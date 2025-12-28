import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

    // Store message in conversations table
    await ctx.db.insert("conversations", {
      contactId: args.contactId,
      type: "sms",
      direction: "outbound",
      content: args.message,
      timestamp: Date.now(),
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
    const messages = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .filter((q) => q.eq(q.field("type"), "sms"))
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
        const result = await ctx.scheduler.runAfter(0, sendSMS, {
          contactId,
          message: args.message,
        });
        results.push({ contactId, success: true, result });
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
 * Receive incoming SMS webhook from SendBlue
 */
export const receiveIncomingSMS = mutation({
  args: {
    contactId: v.id("contacts"),
    message: v.string(),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    // Store incoming message in conversations table
    const conversation = await ctx.db.insert("conversations", {
      contactId: args.contactId,
      type: "sms",
      direction: "inbound",
      content: args.message,
      timestamp: Date.now(),
      status: "received",
    } as any);

    return conversation;
  },
});
