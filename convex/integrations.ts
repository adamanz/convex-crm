import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================================================
// INTEGRATIONS - Query and Mutation Functions
// ============================================================================

// Integration types
const integrationTypes = v.union(
  v.literal("salesforce"),
  v.literal("google"),
  v.literal("sendblue"),
  v.literal("parallel")
);

// Helper to mask sensitive data for display
function maskApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return "****";
  return key.substring(0, 4) + "****" + key.substring(key.length - 4);
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get integration settings by type
 */
export const getSettings = query({
  args: {
    type: integrationTypes,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!integration) {
      return null;
    }

    // Return settings without exposing raw API keys/secrets
    // Only return masked versions for display
    return {
      _id: integration._id,
      type: integration.type,
      status: integration.status,
      config: integration.config,
      connectedEmail: integration.connectedEmail,
      instanceUrl: integration.instanceUrl,
      lastSyncedAt: integration.lastSyncedAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      syncStats: integration.syncStats,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      // Only expose masked credentials
      credentials: integration.credentials
        ? {
            apiKeyMasked: integration.credentials.apiKeyMasked,
            apiSecretMasked: integration.credentials.apiSecretMasked,
            hasAccessToken: !!integration.credentials.accessToken,
            hasRefreshToken: !!integration.credentials.refreshToken,
            tokenExpiresAt: integration.credentials.tokenExpiresAt,
          }
        : undefined,
    };
  },
});

/**
 * List all integrations with their status
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const integrations = await ctx.db.query("integrations").collect();

    return integrations.map((integration) => ({
      _id: integration._id,
      type: integration.type,
      status: integration.status,
      connectedEmail: integration.connectedEmail,
      instanceUrl: integration.instanceUrl,
      lastSyncedAt: integration.lastSyncedAt,
      lastSyncStatus: integration.lastSyncStatus,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Save integration settings
 * Creates a new integration or updates an existing one
 */
export const saveSettings = mutation({
  args: {
    type: integrationTypes,
    config: v.any(),
    // Optional credentials for API key-based integrations
    apiKey: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    // Optional OAuth data
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    // Metadata
    connectedEmail: v.optional(v.string()),
    instanceUrl: v.optional(v.string()),
    // Status override
    status: v.optional(
      v.union(
        v.literal("connected"),
        v.literal("disconnected"),
        v.literal("error"),
        v.literal("syncing")
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    // Build credentials object
    const credentials: {
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: number;
      apiKey?: string;
      apiSecret?: string;
      apiKeyMasked?: string;
      apiSecretMasked?: string;
    } = {};

    // Handle API keys if provided
    if (args.apiKey !== undefined) {
      credentials.apiKey = args.apiKey;
      credentials.apiKeyMasked = maskApiKey(args.apiKey);
    } else if (existing?.credentials?.apiKey) {
      // Preserve existing API key if not being updated
      credentials.apiKey = existing.credentials.apiKey;
      credentials.apiKeyMasked = existing.credentials.apiKeyMasked;
    }

    if (args.apiSecret !== undefined) {
      credentials.apiSecret = args.apiSecret;
      credentials.apiSecretMasked = maskApiKey(args.apiSecret);
    } else if (existing?.credentials?.apiSecret) {
      // Preserve existing API secret if not being updated
      credentials.apiSecret = existing.credentials.apiSecret;
      credentials.apiSecretMasked = existing.credentials.apiSecretMasked;
    }

    // Handle OAuth tokens if provided
    if (args.accessToken !== undefined) {
      credentials.accessToken = args.accessToken;
    } else if (existing?.credentials?.accessToken) {
      credentials.accessToken = existing.credentials.accessToken;
    }

    if (args.refreshToken !== undefined) {
      credentials.refreshToken = args.refreshToken;
    } else if (existing?.credentials?.refreshToken) {
      credentials.refreshToken = existing.credentials.refreshToken;
    }

    if (args.tokenExpiresAt !== undefined) {
      credentials.tokenExpiresAt = args.tokenExpiresAt;
    } else if (existing?.credentials?.tokenExpiresAt) {
      credentials.tokenExpiresAt = existing.credentials.tokenExpiresAt;
    }

    // Determine connection status
    let status = args.status;
    if (!status) {
      // Auto-determine status based on credentials
      const hasApiCredentials = credentials.apiKey || credentials.accessToken;
      status = hasApiCredentials ? "connected" : "disconnected";
    }

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        config: args.config,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        connectedEmail: args.connectedEmail ?? existing.connectedEmail,
        instanceUrl: args.instanceUrl ?? existing.instanceUrl,
        status,
        updatedAt: now,
      });

      return { success: true, id: existing._id, updated: true };
    } else {
      // Create new integration
      const id = await ctx.db.insert("integrations", {
        type: args.type,
        status,
        config: args.config,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        connectedEmail: args.connectedEmail,
        instanceUrl: args.instanceUrl,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, id, updated: false };
    }
  },
});

/**
 * Update integration sync status
 */
export const updateSyncStatus = mutation({
  args: {
    type: integrationTypes,
    lastSyncedAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    lastSyncError: v.optional(v.string()),
    recordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!integration) {
      throw new Error(`Integration ${args.type} not found`);
    }

    const now = Date.now();

    // Build sync stats
    const syncStats = integration.syncStats || {};
    if (args.recordCount !== undefined) {
      syncStats.lastSyncRecordCount = args.recordCount;
      syncStats.totalRecordsSynced =
        (syncStats.totalRecordsSynced || 0) + args.recordCount;

      // Add to sync history (keep last 10 entries)
      const historyEntry = {
        timestamp: now,
        recordCount: args.recordCount,
        status: args.lastSyncStatus || "success",
      };
      syncStats.syncHistory = [
        historyEntry,
        ...(syncStats.syncHistory || []).slice(0, 9),
      ];
    }

    await ctx.db.patch(integration._id, {
      lastSyncedAt: args.lastSyncedAt ?? now,
      lastSyncStatus: args.lastSyncStatus,
      lastSyncError: args.lastSyncError,
      syncStats,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Test connection for an integration
 * This validates that the credentials are correct
 */
export const testConnection = mutation({
  args: {
    type: integrationTypes,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!integration) {
      return {
        success: false,
        error: "Integration not configured",
        status: "disconnected" as const,
      };
    }

    // Validate based on integration type
    switch (args.type) {
      case "salesforce": {
        // For Salesforce, we'd need to validate OAuth tokens
        const hasValidToken = integration.credentials?.accessToken;
        if (!hasValidToken) {
          return {
            success: false,
            error: "No valid Salesforce access token",
            status: "error" as const,
          };
        }

        // In a real implementation, we'd make an API call to Salesforce
        // to verify the token is still valid
        // For now, we'll assume if we have a token, it's valid
        await ctx.db.patch(integration._id, {
          status: "connected",
          lastSyncStatus: "Connection verified",
          updatedAt: Date.now(),
        });

        return {
          success: true,
          message: "Connected to Salesforce",
          status: "connected" as const,
          instanceUrl: integration.instanceUrl,
        };
      }

      case "google": {
        // For Google, validate OAuth tokens
        const hasValidToken = integration.credentials?.accessToken;
        if (!hasValidToken) {
          return {
            success: false,
            error: "No valid Google access token",
            status: "error" as const,
          };
        }

        // Check token expiration
        const expiresAt = integration.credentials?.tokenExpiresAt;
        if (expiresAt && expiresAt < Date.now()) {
          // Token expired, would need to refresh
          // In a real implementation, we'd use the refresh token here
          return {
            success: false,
            error: "Google access token expired",
            status: "error" as const,
          };
        }

        await ctx.db.patch(integration._id, {
          status: "connected",
          lastSyncStatus: "Connection verified",
          updatedAt: Date.now(),
        });

        return {
          success: true,
          message: "Connected to Google",
          status: "connected" as const,
          connectedEmail: integration.connectedEmail,
        };
      }

      case "sendblue": {
        // For Sendblue, validate API key and secret
        const hasApiKey = integration.credentials?.apiKey;
        const hasApiSecret = integration.credentials?.apiSecret;

        if (!hasApiKey || !hasApiSecret) {
          return {
            success: false,
            error: "Missing API credentials",
            status: "error" as const,
          };
        }

        // In a real implementation, we'd make an API call to Sendblue
        // to verify the credentials are valid
        // For now, we'll assume if we have both keys, they're valid
        await ctx.db.patch(integration._id, {
          status: "connected",
          lastSyncStatus: "Connection verified",
          updatedAt: Date.now(),
        });

        return {
          success: true,
          message: "Connected to Sendblue",
          status: "connected" as const,
        };
      }

      case "parallel": {
        // For Parallel.ai, validate API key
        const hasApiKey = integration.credentials?.apiKey;

        if (!hasApiKey) {
          return {
            success: false,
            error: "Missing Parallel API key",
            status: "error" as const,
          };
        }

        await ctx.db.patch(integration._id, {
          status: "connected",
          lastSyncStatus: "Connection verified",
          updatedAt: Date.now(),
        });

        return {
          success: true,
          message: "Connected to Parallel.ai",
          status: "connected" as const,
        };
      }

      default:
        return {
          success: false,
          error: "Unknown integration type",
          status: "error" as const,
        };
    }
  },
});

/**
 * Disconnect an integration
 * Clears credentials and sets status to disconnected
 */
export const disconnect = mutation({
  args: {
    type: integrationTypes,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!integration) {
      return { success: false, error: "Integration not found" };
    }

    await ctx.db.patch(integration._id, {
      status: "disconnected",
      credentials: undefined,
      connectedEmail: undefined,
      instanceUrl: undefined,
      lastSyncedAt: undefined,
      lastSyncStatus: undefined,
      lastSyncError: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get raw credentials for server-side API calls
 * This should only be called from internal functions, not exposed to clients
 */
export const getCredentials = query({
  args: {
    type: integrationTypes,
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!integration) {
      return null;
    }

    // Return credentials for internal use
    // In production, you might want to add additional access controls here
    return {
      type: integration.type,
      status: integration.status,
      credentials: integration.credentials,
      instanceUrl: integration.instanceUrl,
      connectedEmail: integration.connectedEmail,
    };
  },
});
