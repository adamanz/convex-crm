import { v } from "convex/values";
import { query } from "../_generated/server";
import { DatabaseReader } from "../_generated/server";

/**
 * Find workspace by Slack team ID
 */
export const findWorkspaceByTeamId = query({
  args: { slackTeamId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sentinelWorkspaces")
      .withIndex("by_team", (q) => q.eq("slackTeamId", args.slackTeamId))
      .first();
  },
});

/**
 * Get workspace by ID
 */
export const getWorkspaceById = query({
  args: { workspaceId: v.id("sentinelWorkspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

/**
 * Get all channels for a workspace
 */
export const getWorkspaceChannels = query({
  args: { workspaceId: v.id("sentinelWorkspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sentinelChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

/**
 * Get monitored channels for a workspace
 */
export const getMonitoredChannels = query({
  args: { workspaceId: v.id("sentinelWorkspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sentinelChannels")
      .withIndex("by_workspace_monitored", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("isMonitored", true)
      )
      .collect();
  },
});

/**
 * Get customers for a workspace
 */
export const getWorkspaceCustomers = query({
  args: { workspaceId: v.id("sentinelWorkspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sentinelCustomers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

/**
 * Find channel by Slack channel ID
 */
export const findChannelBySlackId = query({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    slackChannelId: v.string(),
  },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("sentinelChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return channels.find((ch) => ch.slackChannelId === args.slackChannelId);
  },
});

/**
 * Find customer by display name or Slack alias
 */
export const findCustomerByAlias = query({
  args: {
    workspaceId: v.id("sentinelWorkspaces"),
    alias: v.string(),
  },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("sentinelCustomers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const lowerAlias = args.alias.toLowerCase();

    return customers.find(
      (customer) =>
        customer.displayName.toLowerCase() === lowerAlias ||
        customer.slackAliases?.some((a) => a.toLowerCase() === lowerAlias)
    );
  },
});
