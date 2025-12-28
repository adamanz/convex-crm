import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List conversations with latest message preview
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("archived"),
        v.literal("workflow_active")
      )
    ),
    ownerId: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Build query based on provided filters
    let conversationsQuery;
    if (args.status) {
      conversationsQuery = ctx.db
        .query("conversations")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.ownerId) {
      conversationsQuery = ctx.db
        .query("conversations")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId!));
    } else if (args.contactId) {
      conversationsQuery = ctx.db
        .query("conversations")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!));
    } else {
      conversationsQuery = ctx.db.query("conversations");
    }

    let conversations = await conversationsQuery.order("desc").collect();

    // Apply search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase();
      conversations = conversations.filter(
        (conv) =>
          conv.lastMessagePreview?.toLowerCase().includes(searchLower) ||
          conv.phoneNumber.includes(searchLower)
      );
    }

    // Apply cursor-based pagination (sort by lastMessageAt)
    conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    if (args.cursor) {
      conversations = conversations.filter(
        (c) => c.lastMessageAt < args.cursor!
      );
    }

    // Apply additional filters not handled by index
    if (args.status && args.ownerId) {
      conversations = conversations.filter((c) => c.ownerId === args.ownerId);
    }
    if (args.status && args.contactId) {
      conversations = conversations.filter(
        (c) => c.contactId === args.contactId
      );
    }

    const hasMore = conversations.length > limit;
    const items = conversations.slice(0, limit);

    // Enrich with contact info and unread count
    const enrichedItems = await Promise.all(
      items.map(async (conversation) => {
        const contact = conversation.contactId
          ? await ctx.db.get(conversation.contactId)
          : null;
        const owner = conversation.ownerId
          ? await ctx.db.get(conversation.ownerId)
          : null;

        // Count unread inbound messages
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("direction"), "inbound"),
              q.neq(q.field("status"), "read")
            )
          )
          .collect();

        return {
          ...conversation,
          contact,
          owner,
          unreadCount: unreadMessages.length,
        };
      })
    );

    return {
      items: enrichedItems,
      nextCursor: hasMore ? items[items.length - 1]?.lastMessageAt : null,
      hasMore,
    };
  },
});

/**
 * Get a single conversation with recent messages
 */
export const get = query({
  args: {
    id: v.id("conversations"),
    messageLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;

    // Get related entities
    const contact = conversation.contactId
      ? await ctx.db.get(conversation.contactId)
      : null;
    const owner = conversation.ownerId
      ? await ctx.db.get(conversation.ownerId)
      : null;
    const activeWorkflow = conversation.activeWorkflowId
      ? await ctx.db.get(conversation.activeWorkflowId)
      : null;

    // Get recent messages (newest first, then reverse for display)
    const messageLimit = args.messageLimit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .order("desc")
      .take(messageLimit);

    // Reverse to get chronological order for display
    messages.reverse();

    return {
      ...conversation,
      contact,
      owner,
      activeWorkflow,
      messages,
    };
  },
});

/**
 * Get paginated messages for a conversation
 */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    direction: v.optional(v.union(v.literal("newer"), v.literal("older"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const direction = args.direction ?? "older";

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      );

    if (args.cursor) {
      if (direction === "older") {
        messagesQuery = messagesQuery.filter((q) =>
          q.lt(q.field("timestamp"), args.cursor!)
        );
      } else {
        messagesQuery = messagesQuery.filter((q) =>
          q.gt(q.field("timestamp"), args.cursor!)
        );
      }
    }

    // Order based on pagination direction
    const messages = await messagesQuery
      .order(direction === "older" ? "desc" : "asc")
      .take(limit + 1);

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit);

    // Always return in chronological order
    if (direction === "older") {
      items.reverse();
    }

    return {
      items,
      nextCursor: hasMore
        ? direction === "older"
          ? items[0]?.timestamp
          : items[items.length - 1]?.timestamp
        : null,
      hasMore,
    };
  },
});

/**
 * Find conversation by phone number
 */
export const byPhone = query({
  args: {
    phoneNumber: v.string(),
    sendblueNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .collect();

    if (args.sendblueNumber) {
      return conversations.find(
        (c) => c.sendblueNumber === args.sendblueNumber
      ) ?? null;
    }

    return conversations[0] ?? null;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new conversation
 */
export const create = mutation({
  args: {
    phoneNumber: v.string(),
    sendblueNumber: v.string(),
    contactId: v.optional(v.id("contacts")),
    isIMessage: v.optional(v.boolean()),
    aiEnabled: v.optional(v.boolean()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .filter((q) => q.eq(q.field("sendblueNumber"), args.sendblueNumber))
      .first();

    if (existing) {
      // Reactivate if archived
      if (existing.status === "archived") {
        await ctx.db.patch(existing._id, {
          status: "active",
        });
      }
      return existing._id;
    }

    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      phoneNumber: args.phoneNumber,
      sendblueNumber: args.sendblueNumber,
      contactId: args.contactId,
      status: "active",
      isIMessage: args.isIMessage ?? true,
      aiEnabled: args.aiEnabled ?? false,
      messageCount: 0,
      lastMessageAt: now,
      ownerId: args.ownerId,
      createdAt: now,
    });

    return conversationId;
  },
});

/**
 * Archive a conversation
 */
export const archive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.status === "workflow_active") {
      throw new Error(
        "Cannot archive conversation with active workflow. Complete or cancel the workflow first."
      );
    }

    await ctx.db.patch(args.id, {
      status: "archived",
    });

    return args.id;
  },
});

/**
 * Unarchive a conversation
 */
export const unarchive = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.status !== "archived") {
      throw new Error("Conversation is not archived");
    }

    await ctx.db.patch(args.id, {
      status: "active",
    });

    return args.id;
  },
});

/**
 * Update conversation settings
 */
export const update = mutation({
  args: {
    id: v.id("conversations"),
    contactId: v.optional(v.id("contacts")),
    aiEnabled: v.optional(v.boolean()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const conversation = await ctx.db.get(id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updateData: Partial<Doc<"conversations">> = {};

    if (updates.contactId !== undefined) updateData.contactId = updates.contactId;
    if (updates.aiEnabled !== undefined) updateData.aiEnabled = updates.aiEnabled;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Link conversation to contact
 */
export const linkToContact = mutation({
  args: {
    conversationId: v.id("conversations"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    await ctx.db.patch(args.conversationId, {
      contactId: args.contactId,
    });

    // Update contact phone if not set
    if (!contact.phone) {
      await ctx.db.patch(args.contactId, {
        phone: conversation.phoneNumber,
        updatedAt: Date.now(),
      });
    }

    return args.conversationId;
  },
});

/**
 * Unlink conversation from contact
 */
export const unlinkFromContact = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      contactId: undefined,
    });

    return args.conversationId;
  },
});

/**
 * Set AI enabled/disabled for conversation
 */
export const setAiEnabled = mutation({
  args: {
    id: v.id("conversations"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.id, {
      aiEnabled: args.enabled,
    });

    return args.id;
  },
});

/**
 * Toggle AI for a conversation
 */
export const toggleAI = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const newValue = !conversation.aiEnabled;
    await ctx.db.patch(args.id, {
      aiEnabled: newValue,
    });

    return newValue;
  },
});

/**
 * Internal: Update conversation stats after new message
 * Called by message handlers
 */
export const updateStats = mutation({
  args: {
    id: v.id("conversations"),
    lastMessagePreview: v.string(),
    isIMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updateData: Partial<Doc<"conversations">> = {
      messageCount: conversation.messageCount + 1,
      lastMessageAt: Date.now(),
      lastMessagePreview: args.lastMessagePreview.slice(0, 100),
    };

    if (args.isIMessage !== undefined) {
      updateData.isIMessage = args.isIMessage;
    }

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

/**
 * Set active workflow on conversation
 */
export const setActiveWorkflow = mutation({
  args: {
    id: v.id("conversations"),
    workflowId: v.optional(v.id("workflows")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updateData: Partial<Doc<"conversations">> = {
      activeWorkflowId: args.workflowId,
      status: args.workflowId ? "workflow_active" : "active",
    };

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

/**
 * Mark all messages in conversation as read
 */
export const markAllRead = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Get all unread inbound messages
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .filter((q) =>
        q.and(
          q.eq(q.field("direction"), "inbound"),
          q.neq(q.field("status"), "read")
        )
      )
      .collect();

    // Mark each as read
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { status: "read" });
    }

    return { markedRead: unreadMessages.length };
  },
});

/**
 * Get conversation statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allConversations = await ctx.db.query("conversations").collect();

    const stats = {
      total: allConversations.length,
      active: allConversations.filter((c) => c.status === "active").length,
      archived: allConversations.filter((c) => c.status === "archived").length,
      workflowActive: allConversations.filter(
        (c) => c.status === "workflow_active"
      ).length,
      aiEnabled: allConversations.filter((c) => c.aiEnabled).length,
      iMessage: allConversations.filter((c) => c.isIMessage).length,
      sms: allConversations.filter((c) => !c.isIMessage).length,
    };

    return stats;
  },
});
