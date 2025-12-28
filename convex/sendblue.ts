import { v } from "convex/values";
import { action, internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// =============================================================================
// INTERNAL QUERIES - For use within actions
// =============================================================================

/**
 * Get Sendblue integration settings
 */
export const getSendblueSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "sendblue"))
      .first();

    if (!integration || integration.status !== "connected") {
      return null;
    }

    return integration;
  },
});

/**
 * Get conversation details for sending
 */
export const getConversationForSending = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// =============================================================================
// INTERNAL MUTATIONS - For updating from actions
// =============================================================================

/**
 * Update message with Sendblue response data
 */
export const updateMessageWithSendblueData = internalMutation({
  args: {
    messageId: v.id("messages"),
    messageHandle: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed")
    ),
    service: v.optional(v.union(v.literal("iMessage"), v.literal("SMS"))),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { messageId, ...updates } = args;
    await ctx.db.patch(messageId, updates);
    return messageId;
  },
});

/**
 * Create inbound message from webhook
 */
export const createInboundMessage = internalMutation({
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

    return messageId;
  },
});

/**
 * Find or create conversation for incoming message
 */
export const findOrCreateConversation = internalMutation({
  args: {
    phoneNumber: v.string(),
    sendblueNumber: v.string(),
    isIMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Try to find existing conversation
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

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      phoneNumber: args.phoneNumber,
      sendblueNumber: args.sendblueNumber,
      status: "active",
      isIMessage: args.isIMessage ?? true,
      aiEnabled: false,
      messageCount: 0,
      lastMessageAt: now,
      createdAt: now,
    });

    return conversationId;
  },
});

/**
 * Update message status from webhook
 */
export const updateMessageStatusFromWebhook = internalMutation({
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

// =============================================================================
// ACTIONS - External API calls
// =============================================================================

/**
 * Send a message via Sendblue API
 */
export const sendMessage = action({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageId?: Id<"messages">; error?: string }> => {
    // Get Sendblue settings
    const settings = await ctx.runQuery(internal.sendblue.getSendblueSettings);
    if (!settings) {
      return {
        success: false,
        error: "Sendblue integration not configured. Please set up your Sendblue API credentials in Settings.",
      };
    }

    // Get conversation details
    const conversation = await ctx.runQuery(
      internal.sendblue.getConversationForSending,
      { conversationId: args.conversationId }
    );
    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found",
      };
    }

    // Create message in pending state first
    const messageId = await ctx.runMutation(api.messages.send, {
      conversationId: args.conversationId,
      content: args.content,
      mediaUrl: args.mediaUrl,
    });

    // Get API credentials
    const apiKey = settings.credentials?.apiKey;
    const apiSecret = settings.credentials?.apiSecret;

    if (!apiKey || !apiSecret) {
      // Update message as failed
      await ctx.runMutation(internal.sendblue.updateMessageWithSendblueData, {
        messageId,
        messageHandle: "",
        status: "failed",
        errorMessage: "API credentials not configured",
      });
      return {
        success: false,
        messageId,
        error: "Sendblue API credentials not configured",
      };
    }

    // Prepare the request to Sendblue
    const sendbluePayload: Record<string, string> = {
      number: conversation.phoneNumber,
      content: args.content,
      send_style: "invisible", // or "slam", "loud", "gentle", etc.
    };

    // Add from_number if available
    if (conversation.sendblueNumber) {
      sendbluePayload.from_number = conversation.sendblueNumber;
    }

    // Add media URL if present
    if (args.mediaUrl) {
      sendbluePayload.media_url = args.mediaUrl;
    }

    try {
      // Send message via Sendblue API
      const response = await fetch("https://api.sendblue.co/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "sb-api-key-id": apiKey,
          "sb-api-secret-key": apiSecret,
        },
        body: JSON.stringify(sendbluePayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Update message as failed
        const errorMessage = responseData.message || responseData.error || `HTTP ${response.status}`;
        await ctx.runMutation(internal.sendblue.updateMessageWithSendblueData, {
          messageId,
          messageHandle: responseData.message_handle || "",
          status: "failed",
          errorMessage,
        });
        return {
          success: false,
          messageId,
          error: errorMessage,
        };
      }

      // Update message with Sendblue response data
      const status = responseData.status === "QUEUED" || responseData.status === "SENT"
        ? "sent"
        : responseData.status === "DELIVERED"
          ? "delivered"
          : "pending";

      await ctx.runMutation(internal.sendblue.updateMessageWithSendblueData, {
        messageId,
        messageHandle: responseData.message_handle || "",
        status,
        service: responseData.is_outbound !== false
          ? (responseData.was_downgraded ? "SMS" : "iMessage")
          : undefined,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Update message as failed
      await ctx.runMutation(internal.sendblue.updateMessageWithSendblueData, {
        messageId,
        messageHandle: "",
        status: "failed",
        errorMessage,
      });

      return {
        success: false,
        messageId,
        error: errorMessage,
      };
    }
  },
});

// =============================================================================
// QUERIES - Public queries for settings
// =============================================================================

/**
 * Check if Sendblue is configured and connected
 */
export const isConfigured = query({
  args: {},
  handler: async (ctx) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "sendblue"))
      .first();

    return {
      isConfigured: !!integration,
      isConnected: integration?.status === "connected",
      status: integration?.status ?? "disconnected",
    };
  },
});

// =============================================================================
// MUTATIONS - Public mutations for settings management
// =============================================================================

/**
 * Save Sendblue integration settings
 */
export const saveSettings = mutation({
  args: {
    apiKey: v.string(),
    apiSecret: v.string(),
    webhookUrl: v.optional(v.string()),
    syncConversations: v.optional(v.boolean()),
    syncMessages: v.optional(v.boolean()),
    autoReply: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "sendblue"))
      .first();

    // Mask API keys for display
    const apiKeyMasked = args.apiKey.length > 8
      ? `${args.apiKey.slice(0, 4)}...${args.apiKey.slice(-4)}`
      : "****";
    const apiSecretMasked = args.apiSecret.length > 8
      ? `${args.apiSecret.slice(0, 4)}...${args.apiSecret.slice(-4)}`
      : "****";

    const integrationData = {
      type: "sendblue" as const,
      status: "connected" as const,
      config: {
        webhookUrl: args.webhookUrl,
        syncConversations: args.syncConversations ?? true,
        syncMessages: args.syncMessages ?? true,
        autoReply: args.autoReply ?? false,
      },
      credentials: {
        apiKey: args.apiKey,
        apiSecret: args.apiSecret,
        apiKeyMasked,
        apiSecretMasked,
      },
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, integrationData);
      return existing._id;
    }

    const integrationId = await ctx.db.insert("integrations", {
      ...integrationData,
      createdAt: now,
    });

    return integrationId;
  },
});

/**
 * Disconnect Sendblue integration
 */
export const disconnect = mutation({
  args: {},
  handler: async (ctx) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "sendblue"))
      .first();

    if (!integration) {
      throw new Error("Sendblue integration not found");
    }

    await ctx.db.patch(integration._id, {
      status: "disconnected",
      credentials: undefined,
      updatedAt: Date.now(),
    });

    return integration._id;
  },
});

/**
 * Get current Sendblue settings (with masked credentials)
 */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "sendblue"))
      .first();

    if (!integration) {
      return null;
    }

    // Return settings with masked credentials for display
    return {
      status: integration.status,
      config: integration.config,
      apiKeyMasked: integration.credentials?.apiKeyMasked,
      apiSecretMasked: integration.credentials?.apiSecretMasked,
      lastSyncedAt: integration.lastSyncedAt,
      updatedAt: integration.updatedAt,
    };
  },
});

/**
 * Test Sendblue connection
 */
export const testConnection = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    const settings = await ctx.runQuery(internal.sendblue.getSendblueSettings);

    if (!settings) {
      return {
        success: false,
        error: "Sendblue integration not configured",
      };
    }

    const apiKey = settings.credentials?.apiKey;
    const apiSecret = settings.credentials?.apiSecret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        error: "API credentials not configured",
      };
    }

    try {
      // Test by making a request to Sendblue's evaluate-service endpoint
      const response = await fetch("https://api.sendblue.co/api/evaluate-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "sb-api-key-id": apiKey,
          "sb-api-secret-key": apiSecret,
        },
        body: JSON.stringify({
          number: "+15555555555", // Dummy number for testing
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      };
    }
  },
});
