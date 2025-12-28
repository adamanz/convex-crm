import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";

// ============================================================================
// AUDIT LOG - Query Functions for Activity Log
// ============================================================================

/**
 * List audit log entries with pagination and optional filtering
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filter: v.optional(
      v.object({
        userId: v.optional(v.id("users")),
        action: v.optional(v.string()),
        entityType: v.optional(v.string()),
        searchTerm: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filter } = args;

    let logQuery;

    // Use appropriate index based on filter
    if (filter?.userId) {
      logQuery = ctx.db
        .query("activityLog")
        .withIndex("by_user", (q) => q.eq("userId", filter.userId));
    } else if (filter?.entityType) {
      logQuery = ctx.db
        .query("activityLog")
        .withIndex("by_entity", (q) => q.eq("entityType", filter.entityType!));
    } else {
      logQuery = ctx.db.query("activityLog").withIndex("by_timestamp");
    }

    // Get paginated results in descending order (most recent first)
    const results = await logQuery.order("desc").paginate({
      cursor: paginationOpts.cursor,
      numItems: paginationOpts.numItems,
    });

    // Apply post-query filters
    let filteredPage = results.page;

    // Filter by action
    if (filter?.action) {
      filteredPage = filteredPage.filter((entry) =>
        entry.action.toLowerCase().includes(filter.action!.toLowerCase())
      );
    }

    // Filter by date range
    if (filter?.startDate) {
      filteredPage = filteredPage.filter(
        (entry) => entry.timestamp >= filter.startDate!
      );
    }
    if (filter?.endDate) {
      filteredPage = filteredPage.filter(
        (entry) => entry.timestamp <= filter.endDate!
      );
    }

    // Filter by search term (searches action, entityType, entityId)
    if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filteredPage = filteredPage.filter(
        (entry) =>
          entry.action.toLowerCase().includes(term) ||
          entry.entityType.toLowerCase().includes(term) ||
          entry.entityId.toLowerCase().includes(term)
      );
    }

    // Fetch user info for each entry
    const entriesWithUsers = await Promise.all(
      filteredPage.map(async (entry) => {
        let user: Doc<"users"> | null = null;
        if (entry.userId) {
          user = await ctx.db.get(entry.userId);
        }
        return {
          ...entry,
          user,
        };
      })
    );

    return {
      page: entriesWithUsers,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get audit log entries for a specific entity
 */
export const getByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { entityType, entityId, limit = 50 } = args;

    const entries = await ctx.db
      .query("activityLog")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", entityType).eq("entityId", entityId)
      )
      .order("desc")
      .take(limit);

    // Fetch user info for each entry
    const entriesWithUsers = await Promise.all(
      entries.map(async (entry) => {
        let user: Doc<"users"> | null = null;
        if (entry.userId) {
          user = await ctx.db.get(entry.userId);
        }
        return {
          ...entry,
          user,
        };
      })
    );

    return entriesWithUsers;
  },
});

/**
 * Get a single audit log entry by ID
 */
export const get = query({
  args: {
    id: v.id("activityLog"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      return null;
    }

    let user: Doc<"users"> | null = null;
    if (entry.userId) {
      user = await ctx.db.get(entry.userId);
    }

    return {
      ...entry,
      user,
    };
  },
});

/**
 * Get distinct action types for filter dropdown
 */
export const getDistinctActions = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("activityLog").collect();
    const actions = [...new Set(entries.map((e) => e.action))];
    return actions.sort();
  },
});

/**
 * Get distinct entity types for filter dropdown
 */
export const getDistinctEntityTypes = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("activityLog").collect();
    const entityTypes = [...new Set(entries.map((e) => e.entityType))];
    return entityTypes.sort();
  },
});

/**
 * Get all users who have activity log entries (for user filter)
 */
export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("activityLog").collect();
    const userIds = [
      ...new Set(entries.filter((e) => e.userId).map((e) => e.userId!)),
    ];

    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user;
      })
    );

    return users.filter((u): u is Doc<"users"> => u !== null);
  },
});
