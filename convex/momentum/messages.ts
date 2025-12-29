import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";

// Placeholder utility functions (to be imported from proper location)
const detectSignalType = (text: string): string => "message";
const analyzeSentiment = (text: string): string => "neutral";
const extractMentions = (text: string): string[] => [];
const extractEmails = (text: string): string[] => [];
const extractCompanyMentions = (text: string): string[] => [];

/**
 * Store a raw Slack message
 */
export const storeMessage = mutation({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    channelId: v.id("sentinelChannels"),
    slackMessageTs: v.string(),
    slackUserId: v.optional(v.string()),
    text: v.string(),
    attachments: v.optional(v.any()),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if message already exists (prevent duplicates)
    const existing = await ctx.db
      .query("sentinelMessages")
      .withIndex("by_channel_ts", (q) =>
        q.eq("channelId", args.channelId).eq("slackMessageTs", args.slackMessageTs)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Store the message
    const messageId = await ctx.db.insert("sentinelMessages", {
      workspaceId: args.workspaceId,
      channelId: args.channelId,
      slackMessageTs: args.slackMessageTs,
      slackUserId: args.slackUserId,
      text: args.text,
      attachments: args.attachments,
      rawPayload: args.rawPayload,
      processed: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Mark message as processed
 */
export const markMessageProcessed = mutation({
  args: {
    messageId: v.id("sentinelMessages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      processed: true,
      processedAt: Date.now(),
    });

    return args.messageId;
  },
});

/**
 * Process a Slack message and detect signals
 * Main entry point for handling incoming Slack messages
 */
export const processSlackMessage = action({
  args: {
    workspaceId: v.string(), // Will be Slack team ID, need to look up in DB
    channelId: v.string(), // Slack channel ID
    slackMessageTs: v.string(),
    slackUserId: v.optional(v.string()),
    text: v.string(),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // Find workspace by Slack team ID
      const workspace = await ctx.runQuery(internal.momentum.workspace.findWorkspaceByTeamId, {
        slackTeamId: args.workspaceId,
      });

      if (!workspace) {
        console.warn(`Workspace not found for team ${args.workspaceId}`);
        return { success: false, error: "Workspace not found" };
      }

      // Find channel
      const channel = await ctx.runQuery(internal.momentum.workspace.findChannelBySlackId, {
        workspaceId: workspace._id,
        slackChannelId: args.channelId,
      });

      if (!channel) {
        console.warn(`Channel not found: ${args.channelId}`);
        return { success: false, error: "Channel not found" };
      }

      // Skip if channel is not monitored
      if (!channel.isMonitored) {
        return { success: true, skipped: true, reason: "Channel not monitored" };
      }

      // Store the message
      const messageId = await ctx.runMutation(internal.momentum.messages.storeMessage, {
        workspaceId: workspace._id,
        channelId: channel._id,
        slackMessageTs: args.slackMessageTs,
        slackUserId: args.slackUserId,
        text: args.text,
        rawPayload: args.rawPayload,
      });

      // Detect signal
      const signal = detectSignalType(args.text);

      if (signal && signal.confidence > 50) {
        // Only create signal if confidence > 50%
        const sentiment = analyzeSentiment(args.text);

        // Extract context information
        const mentions = extractMentions(args.text);
        const emails = extractEmails(args.text);
        const companies = extractCompanyMentions(args.text);

        // Find customer (by channel mapping or company mention)
        let customerId = channel.customerId;

        if (!customerId && companies.length > 0) {
          // Try to find customer by company mention
          const customer = await ctx.runQuery(internal.momentum.workspace.findCustomerByAlias, {
            workspaceId: workspace._id,
            alias: companies[0],
          });
          customerId = customer?._id;
        }

        // Create context window (previous 2 messages for context)
        // For now, just store the current message
        const contextWindow = [
          {
            slackMessageTs: args.slackMessageTs,
            text: args.text,
            slackUserId: args.slackUserId,
            timestamp: Date.now(),
          },
        ];

        // Create signal record
        const signalId = await ctx.runMutation(internal.momentum.messages.createSignal, {
          workspaceId: workspace._id,
          customerId,
          channelId: channel._id,
          sourceMessageId: messageId,
          type: signal.type,
          confidence: signal.confidence,
          sentiment: sentiment.sentiment,
          urgency: sentiment.urgency,
          text: args.text,
          contextWindow,
          status: "new",
        });

        // Mark message as processed
        await ctx.runMutation(internal.momentum.messages.markMessageProcessed, {
          messageId,
        });

        console.log(`Signal created: ${signalId} (type: ${signal.type}, confidence: ${signal.confidence}%)`);

        return {
          success: true,
          signalCreated: true,
          signalId,
          signal: { type: signal.type, confidence: signal.confidence },
        };
      }

      // No signal detected
      await ctx.runMutation(internal.momentum.messages.markMessageProcessed, {
        messageId,
      });

      return { success: true, signalCreated: false };
    } catch (error) {
      console.error("Error processing message:", error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Create a signal (mutation)
 */
export const createSignal = mutation({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    customerId: v.optional(v.id("sentinelCustomers")),
    channelId: v.id("sentinelChannels"),
    sourceMessageId: v.id("sentinelMessages"),
    type: v.string(),
    confidence: v.number(),
    sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    urgency: v.boolean(),
    text: v.string(),
    contextWindow: v.optional(
      v.array(
        v.object({
          slackMessageTs: v.optional(v.string()),
          text: v.string(),
          slackUserId: v.optional(v.string()),
          timestamp: v.optional(v.number()),
        })
      )
    ),
    status: v.union(
      v.literal("new"),
      v.literal("handled"),
      v.literal("dismissed"),
      v.literal("snoozed"),
      v.literal("synced")
    ),
  },
  handler: async (ctx, args) => {
    const signalId = await ctx.db.insert("sentinelSignals", {
      workspaceId: args.workspaceId,
      customerId: args.customerId,
      channelId: args.channelId,
      sourceMessageId: args.sourceMessageId,
      type: args.type,
      confidence: args.confidence,
      sentiment: args.sentiment,
      urgency: args.urgency,
      text: args.text,
      contextWindow: args.contextWindow,
      status: args.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update channel with last signal
    await ctx.db.patch(args.channelId, {
      lastSignalId: signalId,
      lastMessageTs: Date.now(),
      updatedAt: Date.now(),
    });

    return signalId;
  },
});

/**
 * Get signals for a workspace
 */
export const getSignals = query({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("sentinelSignals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc") // Most recent first
      .take(args.limit || 50);

    return signals;
  },
});

/**
 * Get recent unprocessed messages
 */
export const getUnprocessedMessages = query({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("sentinelMessages")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("processed"), false))
      .order("desc")
      .take(args.limit || 100);

    return messages;
  },
});
