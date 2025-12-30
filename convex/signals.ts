import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Signal types matching schema
const signalTypes = v.union(
  v.literal("expansion"),
  v.literal("risk"),
  v.literal("buying_intent"),
  v.literal("usage"),
  v.literal("churn"),
  v.literal("relationship")
);

const signalStatuses = v.union(
  v.literal("new"),
  v.literal("handled"),
  v.literal("dismissed"),
  v.literal("snoozed"),
  v.literal("synced")
);

const sentiments = v.union(
  v.literal("positive"),
  v.literal("negative"),
  v.literal("neutral"),
  v.literal("urgent")
);

// Create a signal from Slack message
export const createSignalFromSlack = mutation({
  args: {
    slackTeamId: v.string(),
    slackChannelId: v.string(),
    slackMessageTs: v.string(),
    slackUserId: v.string(),
    text: v.string(),
    signalType: signalTypes,
    confidence: v.number(),
    sentiment: sentiments,
    isUrgent: v.boolean(),
    contextWindow: v.optional(v.array(v.object({
      slackMessageTs: v.optional(v.string()),
      text: v.string(),
      slackUserId: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    // Get or create workspace
    let workspace = await ctx.db
      .query("sentinelWorkspaces")
      .withIndex("by_team", (q) => q.eq("slackTeamId", args.slackTeamId))
      .first();

    if (!workspace) {
      // Create placeholder workspace - will be updated on OAuth
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

    // Check for duplicate signal (same channel + message ts)
    const existing = await ctx.db
      .query("sentinelSignals")
      .withIndex("by_channel", (q) => q.eq("channelId", channel!._id))
      .filter((q) => q.eq(q.field("messageTs"), parseFloat(args.slackMessageTs) * 1000))
      .first();

    if (existing) {
      return existing._id;
    }

    // Store raw message
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

    // Create the signal
    const signalId = await ctx.db.insert("sentinelSignals", {
      workspaceId: workspace!._id,
      channelId: channel!._id,
      sourceMessageId: messageId,
      type: args.signalType,
      confidence: args.confidence,
      sentiment: args.isUrgent ? "urgent" : args.sentiment,
      text: args.text,
      messageTs: parseFloat(args.slackMessageTs) * 1000,
      authorId: args.slackUserId,
      authorType: "unknown",
      status: "new",
      contextWindow: args.contextWindow,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update channel last signal
    await ctx.db.patch(channel!._id, {
      lastSignalId: signalId,
      lastMessageTs: Date.now(),
      updatedAt: Date.now(),
    });

    return signalId;
  },
});

// List signals with filters
export const listSignals = query({
  args: {
    workspaceId: v.optional(v.id("sentinelWorkspaces")),
    signalType: v.optional(signalTypes),
    status: v.optional(signalStatuses),
    minConfidence: v.optional(v.number()),
    isUrgent: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let signals = await ctx.db.query("sentinelSignals").order("desc").collect();

    // Apply filters
    if (args.workspaceId) {
      signals = signals.filter((s) => s.workspaceId === args.workspaceId);
    }

    if (args.signalType) {
      signals = signals.filter((s) => s.type === args.signalType);
    }

    if (args.status) {
      signals = signals.filter((s) => s.status === args.status);
    }

    if (args.minConfidence !== undefined) {
      signals = signals.filter((s) => s.confidence >= args.minConfidence!);
    }

    if (args.isUrgent !== undefined) {
      signals = signals.filter((s) =>
        args.isUrgent ? s.sentiment === "urgent" : s.sentiment !== "urgent"
      );
    }

    // Limit results
    const limit = args.limit || 50;
    signals = signals.slice(0, limit);

    // Enrich with related data
    const enriched = await Promise.all(
      signals.map(async (signal) => {
        const channel = await ctx.db.get(signal.channelId);
        const customer = signal.customerId
          ? await ctx.db.get(signal.customerId)
          : null;

        // Get linked CRM entities
        const contact = signal.contactId
          ? await ctx.db.get(signal.contactId)
          : null;
        const company = signal.companyId
          ? await ctx.db.get(signal.companyId)
          : null;

        return {
          ...signal,
          channelName: channel?.name || "Unknown Channel",
          customerName: customer?.displayName || null,
          // CRM entity info
          contact: contact ? {
            _id: contact._id,
            name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
            email: contact.email,
          } : null,
          company: company ? {
            _id: company._id,
            name: company.name,
            domain: company.domain,
          } : null,
        };
      })
    );

    return enriched;
  },
});

// Get a single signal with full context
export const getSignal = query({
  args: {
    signalId: v.id("sentinelSignals"),
  },
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    if (!signal) return null;

    const channel = await ctx.db.get(signal.channelId);
    const customer = signal.customerId
      ? await ctx.db.get(signal.customerId)
      : null;
    const workspace = await ctx.db.get(signal.workspaceId);
    const message = signal.sourceMessageId
      ? await ctx.db.get(signal.sourceMessageId)
      : null;

    // Get linked CRM entities
    const contact = signal.contactId
      ? await ctx.db.get(signal.contactId)
      : null;
    const company = signal.companyId
      ? await ctx.db.get(signal.companyId)
      : null;

    return {
      ...signal,
      channel,
      customer,
      workspace,
      message,
      contact,
      company,
    };
  },
});

// Update signal status
export const updateSignalStatus = mutation({
  args: {
    signalId: v.id("sentinelSignals"),
    status: signalStatuses,
    handledBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    snoozedUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    if (!signal) throw new Error("Signal not found");

    await ctx.db.patch(args.signalId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get dashboard stats
export const getStats = query({
  args: {
    workspaceId: v.optional(v.id("sentinelWorkspaces")),
  },
  handler: async (ctx, args) => {
    let signals = await ctx.db.query("sentinelSignals").collect();

    if (args.workspaceId) {
      signals = signals.filter((s) => s.workspaceId === args.workspaceId);
    }

    const totalSignals = signals.length;
    const newSignals = signals.filter((s) => s.status === "new").length;
    const highConfidenceSignals = signals.filter((s) => s.confidence >= 80).length;
    const urgentSignals = signals.filter((s) => s.sentiment === "urgent").length;

    // Signal type breakdown
    const byType = {
      expansion: signals.filter((s) => s.type === "expansion").length,
      risk: signals.filter((s) => s.type === "risk").length,
      buying_intent: signals.filter((s) => s.type === "buying_intent").length,
      usage: signals.filter((s) => s.type === "usage").length,
      churn: signals.filter((s) => s.type === "churn").length,
      relationship: signals.filter((s) => s.type === "relationship").length,
    };

    // Status breakdown
    const byStatus = {
      new: newSignals,
      handled: signals.filter((s) => s.status === "handled").length,
      dismissed: signals.filter((s) => s.status === "dismissed").length,
      snoozed: signals.filter((s) => s.status === "snoozed").length,
      synced: signals.filter((s) => s.status === "synced").length,
    };

    return {
      totalSignals,
      newSignals,
      highConfidenceSignals,
      urgentSignals,
      byType,
      byStatus,
    };
  },
});

// Get all workspaces
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sentinelWorkspaces").collect();
  },
});

// Save/update workspace from OAuth
export const saveWorkspace = mutation({
  args: {
    slackTeamId: v.string(),
    slackTeamDomain: v.optional(v.string()),
    slackBotUserId: v.string(),
    encryptedBotToken: v.string(),
    installedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if workspace exists
    const existing = await ctx.db
      .query("sentinelWorkspaces")
      .withIndex("by_team", (q) => q.eq("slackTeamId", args.slackTeamId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        slackTeamDomain: args.slackTeamDomain,
        slackBotUserId: args.slackBotUserId,
        encryptedBotToken: args.encryptedBotToken,
        slackConnected: true,
        healthStatus: "healthy",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("sentinelWorkspaces", {
      slackTeamId: args.slackTeamId,
      slackTeamDomain: args.slackTeamDomain,
      slackBotUserId: args.slackBotUserId,
      encryptedBotToken: args.encryptedBotToken,
      slackConnected: true,
      salesforceConnected: false,
      healthStatus: "healthy",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Link a signal to a CRM contact and/or company
export const linkSignalToContact = mutation({
  args: {
    signalId: v.id("sentinelSignals"),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    if (!signal) throw new Error("Signal not found");

    // Validate contact exists if provided
    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact) throw new Error("Contact not found");
    }

    // Validate company exists if provided
    if (args.companyId) {
      const company = await ctx.db.get(args.companyId);
      if (!company) throw new Error("Company not found");
    }

    await ctx.db.patch(args.signalId, {
      contactId: args.contactId,
      companyId: args.companyId,
      updatedAt: Date.now(),
    });

    return { success: true, signalId: args.signalId };
  },
});

// Get signals linked to a specific contact
export const getSignalsByContact = query({
  args: {
    contactId: v.id("contacts"),
    status: v.optional(signalStatuses),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let signals = await ctx.db
      .query("sentinelSignals")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .collect();

    if (args.status) {
      signals = signals.filter((s) => s.status === args.status);
    }

    const limit = args.limit || 20;
    signals = signals.slice(0, limit);

    // Enrich with channel info
    const enriched = await Promise.all(
      signals.map(async (signal) => {
        const channel = await ctx.db.get(signal.channelId);
        return {
          ...signal,
          channelName: channel?.name || "Unknown Channel",
        };
      })
    );

    return enriched;
  },
});

// Get signals linked to a specific company
export const getSignalsByCompany = query({
  args: {
    companyId: v.id("companies"),
    status: v.optional(signalStatuses),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let signals = await ctx.db
      .query("sentinelSignals")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    if (args.status) {
      signals = signals.filter((s) => s.status === args.status);
    }

    const limit = args.limit || 20;
    signals = signals.slice(0, limit);

    // Enrich with channel info
    const enriched = await Promise.all(
      signals.map(async (signal) => {
        const channel = await ctx.db.get(signal.channelId);
        return {
          ...signal,
          channelName: channel?.name || "Unknown Channel",
        };
      })
    );

    return enriched;
  },
});

// Create opportunity from signal (marks as handled and returns signal data for deal creation)
export const createOpportunityFromSignal = mutation({
  args: {
    signalId: v.id("sentinelSignals"),
    dealName: v.string(),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const signal = await ctx.db.get(args.signalId);
    if (!signal) throw new Error("Signal not found");

    // Mark signal as handled with recommended action
    await ctx.db.patch(args.signalId, {
      status: "handled",
      recommendedAction: `Create deal: ${args.dealName}${args.value ? ` ($${args.value})` : ""}`,
      updatedAt: Date.now(),
    });

    // Return signal data - actual deal creation requires pipeline/stage context
    // which should be done through the main deals flow
    return {
      success: true,
      signalId: args.signalId,
      signalType: signal.type,
      dealName: args.dealName,
      value: args.value,
      message: "Signal marked as handled. Create the deal through Deals > New Deal.",
    };
  },
});
