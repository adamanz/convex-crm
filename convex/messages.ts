import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Get messages for a conversation
export const listByConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return messages;
  },
});

// Get a single message
export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Send a new message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      direction: "outbound",
      content: args.content,
      mediaUrl: args.mediaUrl,
      status: "pending",
      timestamp: now,
    });

    // Update conversation stats
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        messageCount: conversation.messageCount + 1,
        lastMessageAt: now,
        lastMessagePreview:
          args.content.length > 100
            ? args.content.substring(0, 100) + "..."
            : args.content,
      });
    }

    // Trigger webhook
    const newMessage = await ctx.db.get(messageId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "message.sent",
      payload: {
        message: newMessage,
        conversationId: args.conversationId,
      },
    });

    return messageId;
  },
});

// Receive an inbound message (typically called from webhook)
export const receiveInbound = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    messageHandle: v.optional(v.string()),
    service: v.optional(v.union(v.literal("iMessage"), v.literal("SMS"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      direction: "inbound",
      content: args.content,
      mediaUrl: args.mediaUrl,
      status: "delivered",
      messageHandle: args.messageHandle,
      service: args.service,
      timestamp: now,
    });

    // Update conversation stats
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        messageCount: conversation.messageCount + 1,
        lastMessageAt: now,
        lastMessagePreview:
          args.content.length > 100
            ? args.content.substring(0, 100) + "..."
            : args.content,
        isIMessage: args.service === "iMessage",
      });
    }

    // Trigger webhook
    const newMessage = await ctx.db.get(messageId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "message.received",
      payload: {
        message: newMessage,
        conversationId: args.conversationId,
      },
    });

    return messageId;
  },
});

// Update message status (typically called from webhook)
export const updateStatus = mutation({
  args: {
    messageHandle: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_message_handle", (q) =>
        q.eq("messageHandle", args.messageHandle)
      )
      .collect();

    if (messages.length === 0) {
      console.warn(`Message with handle ${args.messageHandle} not found`);
      return null;
    }

    const message = messages[0];
    await ctx.db.patch(message._id, {
      status: args.status,
      errorMessage: args.errorMessage,
    });

    return message._id;
  },
});

// Mark a message as AI-generated
export const markAsAI = mutation({
  args: {
    id: v.id("messages"),
    workflowId: v.optional(v.id("workflows")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      aiGenerated: true,
      workflowId: args.workflowId,
    });
  },
});
