import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Permission type for API keys
export type ApiPermission =
  | "contacts:read"
  | "contacts:write"
  | "contacts:delete"
  | "companies:read"
  | "companies:write"
  | "companies:delete"
  | "deals:read"
  | "deals:write"
  | "deals:delete"
  | "activities:read"
  | "activities:write"
  | "*";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure API key
 * Format: crm_<32 random hex characters>
 */
function generateApiKey(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `crm_${hexString}`;
}

/**
 * Hash an API key using SHA-256
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get the display prefix from an API key (first 8 characters after 'crm_')
 */
function getKeyPrefix(key: string): string {
  return key.substring(0, 12); // "crm_" + 8 chars
}

// ============================================================================
// API KEY MANAGEMENT QUERIES
// ============================================================================

/**
 * List all API keys for the current user
 */
export const listApiKeys = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { includeInactive = false } = args;

    const keys = includeInactive
      ? await ctx.db.query("apiKeys").order("desc").collect()
      : await ctx.db
          .query("apiKeys")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .order("desc")
          .collect();

    // Don't return the hash, just the metadata
    return keys.map((key) => ({
      _id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      lastUsedAt: key.lastUsedAt,
      totalRequests: key.totalRequests,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      createdBy: key.createdBy,
    }));
  },
});

/**
 * Get a single API key by ID
 */
export const getApiKey = query({
  args: {
    id: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.id);
    if (!key) return null;

    // Get usage stats
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_api_key", (q) => q.eq("apiKeyId", args.id))
      .order("desc")
      .take(100);

    // Calculate stats
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const last7d = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter((l) => l.timestamp > last24h);
    const weeklyLogs = logs.filter((l) => l.timestamp > last7d);

    const successCount = recentLogs.filter((l) => l.statusCode < 400).length;
    const errorCount = recentLogs.filter((l) => l.statusCode >= 400).length;

    const avgResponseTime =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + l.responseTime, 0) / recentLogs.length
        : 0;

    return {
      _id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      rateLimitWindow: key.rateLimitWindow ?? 60000,
      lastUsedAt: key.lastUsedAt,
      totalRequests: key.totalRequests,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      createdBy: key.createdBy,
      stats: {
        requestsLast24h: recentLogs.length,
        requestsLast7d: weeklyLogs.length,
        successCount,
        errorCount,
        avgResponseTime: Math.round(avgResponseTime),
      },
    };
  },
});

/**
 * Get API usage statistics
 */
export const getApiStats = query({
  args: {
    apiKeyId: v.optional(v.id("apiKeys")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { apiKeyId, days = 7 } = args;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    let logsQuery = ctx.db
      .query("apiLogs")
      .withIndex("by_timestamp")
      .order("desc");

    const allLogs = await logsQuery.collect();
    let logs = allLogs.filter((l) => l.timestamp > cutoff);

    if (apiKeyId) {
      logs = logs.filter((l) => l.apiKeyId === apiKeyId);
    }

    // Group by day
    const dailyStats: Record<
      string,
      { date: string; requests: number; errors: number; avgResponseTime: number }
    > = {};

    for (const log of logs) {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, requests: 0, errors: 0, avgResponseTime: 0 };
      }
      dailyStats[date].requests++;
      if (log.statusCode >= 400) {
        dailyStats[date].errors++;
      }
    }

    // Calculate average response times
    for (const date of Object.keys(dailyStats)) {
      const dayLogs = logs.filter(
        (l) => new Date(l.timestamp).toISOString().split("T")[0] === date
      );
      dailyStats[date].avgResponseTime =
        dayLogs.length > 0
          ? Math.round(
              dayLogs.reduce((sum, l) => sum + l.responseTime, 0) / dayLogs.length
            )
          : 0;
    }

    // Group by endpoint
    const endpointStats: Record<string, { endpoint: string; count: number; errors: number }> = {};
    for (const log of logs) {
      if (!endpointStats[log.endpoint]) {
        endpointStats[log.endpoint] = { endpoint: log.endpoint, count: 0, errors: 0 };
      }
      endpointStats[log.endpoint].count++;
      if (log.statusCode >= 400) {
        endpointStats[log.endpoint].errors++;
      }
    }

    // Get status code distribution
    const statusCodes: Record<number, number> = {};
    for (const log of logs) {
      statusCodes[log.statusCode] = (statusCodes[log.statusCode] || 0) + 1;
    }

    return {
      totalRequests: logs.length,
      totalErrors: logs.filter((l) => l.statusCode >= 400).length,
      avgResponseTime:
        logs.length > 0
          ? Math.round(logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length)
          : 0,
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      endpointStats: Object.values(endpointStats).sort((a, b) => b.count - a.count),
      statusCodes,
    };
  },
});

// ============================================================================
// API KEY MANAGEMENT MUTATIONS
// ============================================================================

/**
 * Create a new API key
 * Returns the full key ONLY ONCE - it cannot be retrieved later
 */
export const createApiKey = mutation({
  args: {
    name: v.string(),
    permissions: v.array(
      v.union(
        v.literal("contacts:read"),
        v.literal("contacts:write"),
        v.literal("contacts:delete"),
        v.literal("companies:read"),
        v.literal("companies:write"),
        v.literal("companies:delete"),
        v.literal("deals:read"),
        v.literal("deals:write"),
        v.literal("deals:delete"),
        v.literal("activities:read"),
        v.literal("activities:write"),
        v.literal("*")
      )
    ),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate the API key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    // Create the API key record
    const apiKeyId = await ctx.db.insert("apiKeys", {
      name: args.name,
      keyHash,
      keyPrefix,
      permissions: args.permissions,
      rateLimit: args.rateLimit ?? 60, // Default 60 requests per minute
      rateLimitWindow: 60000, // 1 minute
      lastUsedAt: undefined,
      totalRequests: 0,
      expiresAt: args.expiresAt,
      isActive: true,
      createdBy: undefined, // Would be set from auth context in production
      createdAt: now,
      updatedAt: now,
    });

    // Log the creation
    await ctx.db.insert("activityLog", {
      action: "api_key_created",
      entityType: "apiKey",
      entityId: apiKeyId,
      timestamp: now,
      system: true,
    });

    // Return the key - THIS IS THE ONLY TIME IT WILL BE VISIBLE
    return {
      id: apiKeyId,
      key: rawKey,
      keyPrefix,
      name: args.name,
      permissions: args.permissions,
      rateLimit: args.rateLimit ?? 60,
      expiresAt: args.expiresAt,
      createdAt: now,
    };
  },
});

/**
 * Revoke (deactivate) an API key
 */
export const revokeApiKey = mutation({
  args: {
    id: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const apiKey = await ctx.db.get(args.id);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    if (!apiKey.isActive) {
      throw new Error("API key is already revoked");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: now,
    });

    // Log the revocation
    await ctx.db.insert("activityLog", {
      action: "api_key_revoked",
      entityType: "apiKey",
      entityId: args.id,
      timestamp: now,
      system: true,
    });

    return { success: true };
  },
});

/**
 * Update an API key's settings
 */
export const updateApiKey = mutation({
  args: {
    id: v.id("apiKeys"),
    name: v.optional(v.string()),
    permissions: v.optional(
      v.array(
        v.union(
          v.literal("contacts:read"),
          v.literal("contacts:write"),
          v.literal("contacts:delete"),
          v.literal("companies:read"),
          v.literal("companies:write"),
          v.literal("companies:delete"),
          v.literal("deals:read"),
          v.literal("deals:write"),
          v.literal("deals:delete"),
          v.literal("activities:read"),
          v.literal("activities:write"),
          v.literal("*")
        )
      )
    ),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { id, ...updates } = args;

    const apiKey = await ctx.db.get(id);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    const updateData: Partial<Doc<"apiKeys">> = { updatedAt: now };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.rateLimit !== undefined) updateData.rateLimit = updates.rateLimit;
    if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;

    await ctx.db.patch(id, updateData);

    // Log the update
    await ctx.db.insert("activityLog", {
      action: "api_key_updated",
      entityType: "apiKey",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return { success: true };
  },
});

// ============================================================================
// INTERNAL FUNCTIONS FOR HTTP ENDPOINTS
// ============================================================================

/**
 * Validate an API key and check permissions
 * Used by HTTP endpoints
 */
export const validateApiKey = internalQuery({
  args: {
    keyHash: v.string(),
    requiredPermission: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the API key by hash
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return { valid: false, error: "API key has been revoked" };
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return { valid: false, error: "API key has expired" };
    }

    // Check permissions
    const hasPermission =
      apiKey.permissions.includes("*") ||
      apiKey.permissions.includes(args.requiredPermission as ApiPermission);

    if (!hasPermission) {
      return { valid: false, error: "Insufficient permissions" };
    }

    return {
      valid: true,
      apiKeyId: apiKey._id,
      rateLimit: apiKey.rateLimit,
      rateLimitWindow: apiKey.rateLimitWindow ?? 60000,
    };
  },
});

/**
 * Check rate limit for an API key
 */
export const checkRateLimit = internalQuery({
  args: {
    apiKeyId: v.id("apiKeys"),
    rateLimit: v.number(),
    rateLimitWindow: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - args.rateLimitWindow;

    // Get current rate limit record
    const rateLimit = await ctx.db
      .query("apiRateLimits")
      .withIndex("by_api_key", (q) => q.eq("apiKeyId", args.apiKeyId))
      .first();

    if (!rateLimit) {
      // No record exists, this is the first request
      return { allowed: true, remaining: args.rateLimit - 1, resetAt: now + args.rateLimitWindow };
    }

    // Check if we're in a new window
    if (rateLimit.windowStart < windowStart) {
      // Window has expired, reset
      return { allowed: true, remaining: args.rateLimit - 1, resetAt: now + args.rateLimitWindow };
    }

    // Check if under the limit
    if (rateLimit.requestCount < args.rateLimit) {
      return {
        allowed: true,
        remaining: args.rateLimit - rateLimit.requestCount - 1,
        resetAt: rateLimit.windowStart + args.rateLimitWindow,
      };
    }

    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.windowStart + args.rateLimitWindow,
    };
  },
});

/**
 * Update rate limit counter
 */
export const updateRateLimit = internalMutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    rateLimitWindow: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - args.rateLimitWindow;

    // Get current rate limit record
    const rateLimit = await ctx.db
      .query("apiRateLimits")
      .withIndex("by_api_key", (q) => q.eq("apiKeyId", args.apiKeyId))
      .first();

    if (!rateLimit) {
      // Create new record
      await ctx.db.insert("apiRateLimits", {
        apiKeyId: args.apiKeyId,
        windowStart: now,
        requestCount: 1,
      });
    } else if (rateLimit.windowStart < windowStart) {
      // Reset window
      await ctx.db.patch(rateLimit._id, {
        windowStart: now,
        requestCount: 1,
      });
    } else {
      // Increment counter
      await ctx.db.patch(rateLimit._id, {
        requestCount: rateLimit.requestCount + 1,
      });
    }
  },
});

/**
 * Log an API call
 */
export const logApiCall = internalMutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    endpoint: v.string(),
    method: v.string(),
    path: v.optional(v.string()),
    statusCode: v.number(),
    responseTime: v.number(),
    requestBody: v.optional(v.any()),
    queryParams: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert the log entry
    await ctx.db.insert("apiLogs", {
      apiKeyId: args.apiKeyId,
      endpoint: args.endpoint,
      method: args.method,
      path: args.path,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      requestBody: args.requestBody,
      queryParams: args.queryParams,
      errorMessage: args.errorMessage,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    // Update API key usage stats
    const apiKey = await ctx.db.get(args.apiKeyId);
    if (apiKey) {
      await ctx.db.patch(args.apiKeyId, {
        lastUsedAt: now,
        totalRequests: apiKey.totalRequests + 1,
      });
    }
  },
});

/**
 * Get recent API logs
 */
export const getApiLogs = query({
  args: {
    apiKeyId: v.optional(v.id("apiKeys")),
    limit: v.optional(v.number()),
    statusFilter: v.optional(v.union(v.literal("success"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    const { limit = 50, statusFilter, apiKeyId } = args;

    let logsQuery;
    if (apiKeyId) {
      logsQuery = ctx.db
        .query("apiLogs")
        .withIndex("by_api_key", (q) => q.eq("apiKeyId", apiKeyId));
    } else {
      logsQuery = ctx.db.query("apiLogs").withIndex("by_timestamp");
    }

    let logs = await logsQuery.order("desc").take(limit * 2);

    // Apply status filter
    if (statusFilter === "success") {
      logs = logs.filter((l) => l.statusCode < 400);
    } else if (statusFilter === "error") {
      logs = logs.filter((l) => l.statusCode >= 400);
    }

    // Get API key names for display
    const keyIds = [...new Set(logs.map((l) => l.apiKeyId))];
    const keys = await Promise.all(keyIds.map((id) => ctx.db.get(id)));
    const keyMap = new Map(keys.filter(Boolean).map((k) => [k!._id, k!.name]));

    return logs.slice(0, limit).map((log) => ({
      ...log,
      apiKeyName: keyMap.get(log.apiKeyId) ?? "Unknown",
    }));
  },
});
