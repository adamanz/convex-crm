import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a new workspace
 */
export const createWorkspace = mutation({
  args: {
    slackTeamId: v.string(),
    slackTeamDomain: v.string(),
    slackBotUserId: v.string(),
    encryptedBotToken: v.string(),
  },
  handler: async (ctx, args) => {
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

/**
 * Update workspace
 */
export const updateWorkspace = mutation({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    slackBotUserId: v.optional(v.string()),
    encryptedBotToken: v.optional(v.string()),
    slackConnected: v.optional(v.boolean()),
    salesforceOrgId: v.optional(v.string()),
    salesforceConnected: v.optional(v.boolean()),
    healthStatus: v.optional(
      v.union(v.literal("healthy"), v.literal("degraded"), v.literal("disconnected"))
    ),
  },
  handler: async (ctx, args) => {
    const { workspaceId, ...updates } = args;

    await ctx.db.patch(workspaceId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return workspaceId;
  },
});

/**
 * Create a channel in workspace
 */
export const createChannel = mutation({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    slackChannelId: v.string(),
    name: v.string(),
    isPrivate: v.optional(v.boolean()),
    customerId: v.optional(v.id("sentinelCustomers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sentinelChannels", {
      workspaceId: args.workspaceId,
      slackChannelId: args.slackChannelId,
      name: args.name,
      isMonitored: false,
      isPrivate: args.isPrivate || false,
      customerId: args.customerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update channel
 */
export const updateChannel = mutation({
  args: {
    channelId: v.id("sentinelChannels"),
    isMonitored: v.optional(v.boolean()),
    customerId: v.optional(v.id("sentinelCustomers")),
    lastMessageTs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { channelId, ...updates } = args;

    await ctx.db.patch(channelId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return channelId;
  },
});

/**
 * Create a customer
 */
export const createCustomer = mutation({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    displayName: v.string(),
    slackAliases: v.optional(v.array(v.string())),
    salesforceAccountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sentinelCustomers", {
      workspaceId: args.workspaceId,
      displayName: args.displayName,
      slackAliases: args.slackAliases || [],
      salesforceAccountId: args.salesforceAccountId,
      healthScore: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update customer
 */
export const updateCustomer = mutation({
  args: {
    customerId: v.id("sentinelCustomers"),
    displayName: v.optional(v.string()),
    slackAliases: v.optional(v.array(v.string())),
    salesforceAccountId: v.optional(v.string()),
    healthScore: v.optional(v.number()),
    lastSignalAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { customerId, ...updates } = args;

    await ctx.db.patch(customerId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return customerId;
  },
});
