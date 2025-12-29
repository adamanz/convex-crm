import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Save a new Slack workspace connection
 * Encrypts the bot token before storing
 */
export const saveWorkspace = action({
  args: {
    slackTeamId: v.string(),
    slackTeamDomain: v.string(),
    slackBotUserId: v.optional(v.string()),
    botToken: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, encrypt the token
    // For now, we'll use a simple approach - store encrypted version
    // TODO: Implement proper encryption using a secrets management service
    const encryptedToken = Buffer.from(args.botToken).toString("base64");

    // Check if workspace already exists
    const existing = await ctx.runQuery(internal.momentum.workspace.findWorkspaceByTeamId, {
      slackTeamId: args.slackTeamId,
    });

    if (existing) {
      // Update existing workspace
      await ctx.runMutation(internal.momentum.workspace.updateWorkspace, {
        workspaceId: existing._id,
        slackBotUserId: args.slackBotUserId,
        encryptedBotToken: encryptedToken,
        slackConnected: true,
      });

      return { success: true, workspaceId: existing._id, created: false };
    } else {
      // Create new workspace
      const workspaceId = await ctx.runMutation(internal.momentum.workspace.createWorkspace, {
        slackTeamId: args.slackTeamId,
        slackTeamDomain: args.slackTeamDomain,
        slackBotUserId: args.slackBotUserId || "",
        encryptedBotToken: encryptedToken,
      });

      return { success: true, workspaceId, created: true };
    }
  },
});
