import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Send SMS to a single contact
 */
export const sendSMS = mutation({
  args: {
    contactId: v.id("contacts"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Get contact details
    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.phone) {
      throw new Error("Contact not found or has no phone number");
    }

    // Call SendBlue API
    const response = await fetch("https://api.sendblue.co/api/send-message", {
      method: "POST",
      headers: {
        "sb-api-key-id": process.env.SENDBLUE_API_KEY_ID || "",
        "sb-api-secret-key": process.env.SENDBLUE_API_SECRET_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: contact.phone,
        content: args.message,
      }),
    });

    if (!response.ok) {
      throw new Error(`SendBlue API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Find or create conversation
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .first();

    let conversationId = existingConversation?._id;
    if (!conversationId) {
      conversationId = await ctx.db.insert("conversations", {
        phoneNumber: contact.phone,
        sendblueNumber: process.env.SENDBLUE_NUMBER || "",
        contactId: args.contactId,
        status: "active",
        isIMessage: false,
        aiEnabled: false,
        messageCount: 0,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      } as any);
    }

    // Store message in messages table
    await ctx.db.insert("messages", {
      conversationId,
      direction: "outbound",
      content: args.message,
      status: "sent",
    } as any);

    return result;
  },
});

/**
 * Get SMS message history for a contact
 */
export const getMessageHistory = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    // Find conversation for contact
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .first();

    if (!conversation) {
      return [];
    }

    // Get messages for this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .order("desc")
      .take(50);

    return messages;
  },
});

/**
 * Send bulk SMS to multiple contacts
 */
export const sendBulkSMS = mutation({
  args: {
    contactIds: v.array(v.id("contacts")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const contactId of args.contactIds) {
      try {
        // Get contact details
        const contact = await ctx.db.get(contactId);
        if (!contact || !contact.phone) {
          results.push({
            contactId,
            success: false,
            error: "Contact not found or has no phone number"
          });
          continue;
        }

        // Call SendBlue API
        const response = await fetch("https://api.sendblue.co/api/send-message", {
          method: "POST",
          headers: {
            "sb-api-key-id": process.env.SENDBLUE_API_KEY_ID || "",
            "sb-api-secret-key": process.env.SENDBLUE_API_SECRET_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: contact.phone,
            content: args.message,
          }),
        });

        if (!response.ok) {
          results.push({
            contactId,
            success: false,
            error: `SendBlue API error: ${response.statusText}`
          });
          continue;
        }

        // Find or create conversation
        const existingConversation = await ctx.db
          .query("conversations")
          .withIndex("by_contact", (q) => q.eq("contactId", contactId))
          .first();

        let conversationId = existingConversation?._id;
        if (!conversationId) {
          conversationId = await ctx.db.insert("conversations", {
            phoneNumber: contact.phone,
            sendblueNumber: process.env.SENDBLUE_NUMBER || "",
            contactId,
            status: "active",
            isIMessage: false,
            aiEnabled: false,
            messageCount: 0,
            lastMessageAt: Date.now(),
            createdAt: Date.now(),
          } as any);
        }

        // Store message in messages table
        await ctx.db.insert("messages", {
          conversationId,
          direction: "outbound",
          content: args.message,
          status: "sent",
        } as any);

        results.push({ contactId, success: true });
      } catch (error) {
        results.push({ contactId, success: false, error: String(error) });
      }
    }

    return results;
  },
});

/**
 * Get SendBlue configuration
 */
export const getConfig = query({
  handler: async (ctx) => {
    // This would fetch from a settings table if it exists
    // For now, return a placeholder
    return {
      enabled: !!process.env.SENDBLUE_API_KEY_ID,
      apiKeyId: process.env.SENDBLUE_API_KEY_ID ? "***" : null,
    };
  },
});

/**
 * Check if SendBlue is configured
 */
export const isConfigured = query({
  handler: async (ctx) => {
    return {
      isConnected: !!process.env.SENDBLUE_API_KEY_ID,
      enabled: !!process.env.SENDBLUE_API_KEY_ID,
    };
  },
});

/**
 * Receive incoming SMS webhook from SendBlue
 */
export const receiveIncomingSMS = mutation({
  args: {
    contactId: v.id("contacts"),
    message: v.string(),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find or create conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .first();

    let conversationId: Id<"conversations">;
    if (!conversation) {
      const contact = await ctx.db.get(args.contactId);
      conversationId = await ctx.db.insert("conversations", {
        phoneNumber: contact?.phone || args.senderId,
        sendblueNumber: process.env.SENDBLUE_NUMBER || "",
        contactId: args.contactId,
        status: "active",
        isIMessage: false,
        aiEnabled: false,
        messageCount: 0,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      } as any);
    } else {
      conversationId = conversation._id;
    }

    // Store message in messages table
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      direction: "inbound",
      content: args.message,
      status: "delivered",
    } as any);

    return messageId;
  },
});

/**
 * Internal: Find or create a conversation for SendBlue webhook
 */
export const findOrCreateConversation = internalMutation({
  args: {
    phoneNumber: v.string(),
    sendblueNumber: v.string(),
    isIMessage: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find existing conversation or create new one
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (existing) {
      return existing._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      phoneNumber: args.phoneNumber,
      sendblueNumber: args.sendblueNumber,
      status: "active",
      isIMessage: args.isIMessage,
      aiEnabled: false,
      messageCount: 0,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    } as any);

    return conversationId;
  },
});

/**
 * Internal: Create inbound message from SendBlue webhook
 */
export const createInboundMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    messageHandle: v.string(),
    service: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      direction: "inbound",
      content: args.content,
      mediaUrl: args.mediaUrl,
      status: "delivered",
    } as any);

    return message;
  },
});

/**
 * Internal: Update message status from SendBlue webhook
 */
export const updateMessageStatusFromWebhook = internalMutation({
  args: {
    messageHandle: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find all messages and update those matching the handle
    const allMessages = await ctx.db.query("messages").collect();
    let updated = false;

    for (const msg of allMessages) {
      if (msg.content === args.messageHandle || (msg as any).messageHandle === args.messageHandle) {
        await ctx.db.patch(msg._id, {
          status: args.status === "delivered" ? "delivered" : "failed",
        });
        updated = true;
      }
    }

    return { updated };
  },
});
