import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Sync a single Slack user to CRM contact
export const syncSlackUserToContact = mutation({
  args: {
    slackUserId: v.string(),
    slackTeamId: v.string(),
    email: v.optional(v.string()),
    realName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    title: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isBot: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Skip bots
    if (args.isBot) return null;

    // Skip if no email (can't create meaningful contact without it)
    // But we'll still store the mapping
    const email = args.email?.toLowerCase();

    // Parse name
    const nameParts = (args.realName || args.displayName || "Unknown").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "Unknown";

    // Check if contact exists by email
    let contact = email
      ? await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first()
      : null;

    if (contact) {
      // Update existing contact with Slack info
      await ctx.db.patch(contact._id, {
        avatarUrl: args.avatarUrl || contact.avatarUrl,
        title: args.title || contact.title,
        slackUserId: args.slackUserId,
        updatedAt: Date.now(),
      });
      return { contactId: contact._id, action: "updated" };
    }

    // Create new contact
    const contactId = await ctx.db.insert("contacts", {
      firstName,
      lastName,
      email: email,
      avatarUrl: args.avatarUrl,
      title: args.title,
      source: "slack",
      tags: ["slack-import"],
      slackUserId: args.slackUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { contactId, action: "created" };
  },
});

// Bulk sync Slack users (called from API route)
export const bulkSyncSlackUsers = mutation({
  args: {
    users: v.array(
      v.object({
        slackUserId: v.string(),
        slackTeamId: v.string(),
        email: v.optional(v.string()),
        realName: v.optional(v.string()),
        displayName: v.optional(v.string()),
        title: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        isBot: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = { created: 0, updated: 0, skipped: 0 };

    for (const user of args.users) {
      // Skip bots
      if (user.isBot) {
        results.skipped++;
        continue;
      }

      const email = user.email?.toLowerCase();

      // Parse name
      const nameParts = (user.realName || user.displayName || "Unknown").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "Unknown";

      // Check if contact exists by email or slackUserId
      let contact = email
        ? await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first()
        : null;

      if (!contact) {
        // Try by slack user ID
        contact = await ctx.db
          .query("contacts")
          .withIndex("by_slack_user", (q) => q.eq("slackUserId", user.slackUserId))
          .first();
      }

      if (contact) {
        // Update existing contact
        await ctx.db.patch(contact._id, {
          avatarUrl: user.avatarUrl || contact.avatarUrl,
          title: user.title || contact.title,
          slackUserId: user.slackUserId,
          updatedAt: Date.now(),
        });
        results.updated++;
      } else {
        // Create new contact
        await ctx.db.insert("contacts", {
          firstName,
          lastName,
          email: email,
          avatarUrl: user.avatarUrl,
          title: user.title,
          source: "slack",
          tags: ["slack-import"],
          slackUserId: user.slackUserId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.created++;
      }
    }

    return results;
  },
});

// Get contact by Slack user ID
export const getContactBySlackUserId = query({
  args: {
    slackUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_slack_user", (q) => q.eq("slackUserId", args.slackUserId))
      .first();
  },
});

// Store a Slack message and optionally create a signal
export const storeSlackMessage = mutation({
  args: {
    slackTeamId: v.string(),
    slackChannelId: v.string(),
    slackMessageTs: v.string(),
    slackUserId: v.string(),
    text: v.string(),
    // Signal detection results (optional - if no signal detected)
    signalType: v.optional(
      v.union(
        v.literal("expansion"),
        v.literal("risk"),
        v.literal("buying_intent"),
        v.literal("usage"),
        v.literal("churn"),
        v.literal("relationship")
      )
    ),
    confidence: v.optional(v.number()),
    sentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("negative"),
        v.literal("neutral"),
        v.literal("urgent")
      )
    ),
    isUrgent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get or create workspace
    let workspace = await ctx.db
      .query("sentinelWorkspaces")
      .withIndex("by_team", (q) => q.eq("slackTeamId", args.slackTeamId))
      .first();

    if (!workspace) {
      const workspaceId = await ctx.db.insert("sentinelWorkspaces", {
        slackTeamId: args.slackTeamId,
        slackConnected: true,
        salesforceConnected: false,
        healthStatus: "healthy",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    }

    // Get or create channel
    let channel = await ctx.db
      .query("sentinelChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace!._id))
      .filter((q) => q.eq(q.field("slackChannelId"), args.slackChannelId))
      .first();

    if (!channel) {
      const channelId = await ctx.db.insert("sentinelChannels", {
        workspaceId: workspace!._id,
        slackChannelId: args.slackChannelId,
        name: `#channel-${args.slackChannelId.slice(-4)}`,
        isMonitored: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      channel = await ctx.db.get(channelId);
    }

    // Find linked contact by Slack user ID
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_slack_user", (q) => q.eq("slackUserId", args.slackUserId))
      .first();

    // Store message
    const messageId = await ctx.db.insert("sentinelMessages", {
      workspaceId: workspace!._id,
      channelId: channel!._id,
      slackMessageTs: args.slackMessageTs,
      slackUserId: args.slackUserId,
      text: args.text,
      processed: true,
      processedAt: Date.now(),
      createdAt: Date.now(),
    });

    // If signal detected, create signal record
    if (args.signalType && args.confidence) {
      const signalId = await ctx.db.insert("sentinelSignals", {
        workspaceId: workspace!._id,
        channelId: channel!._id,
        sourceMessageId: messageId,
        contactId: contact?._id,
        type: args.signalType,
        confidence: args.confidence,
        sentiment: args.isUrgent ? "urgent" : (args.sentiment || "neutral"),
        text: args.text,
        messageTs: parseFloat(args.slackMessageTs) * 1000,
        authorId: args.slackUserId,
        authorType: "unknown",
        status: "new",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update channel
      await ctx.db.patch(channel!._id, {
        lastSignalId: signalId,
        lastMessageTs: Date.now(),
        updatedAt: Date.now(),
      });

      // Update contact last activity if linked
      if (contact) {
        await ctx.db.patch(contact._id, {
          lastActivityAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return { messageId, signalId, contactId: contact?._id };
    }

    return { messageId, signalId: null, contactId: contact?._id };
  },
});

// Get sync status
export const getSyncStatus = query({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db.query("contacts").collect();
    // Count contacts with slackUserId set
    const slackContacts = contacts.filter((c) => c.slackUserId);
    const workspaces = await ctx.db.query("sentinelWorkspaces").collect();
    const messages = await ctx.db.query("sentinelMessages").collect();
    const signals = await ctx.db.query("sentinelSignals").collect();

    return {
      totalContacts: contacts.length,
      slackLinkedContacts: slackContacts.length,
      connectedWorkspaces: workspaces.length,
      totalMessages: messages.length,
      totalSignals: signals.length,
    };
  },
});
