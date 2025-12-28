import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

export type LeaderboardMetric =
  | "deals_won"
  | "revenue"
  | "activities"
  | "calls"
  | "emails"
  | "new_contacts"
  | "deals_closed"
  | "meetings";

export type LeaderboardPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "allTime";

export type BadgeType =
  | "first_deal"
  | "deal_streak_3"
  | "deal_streak_5"
  | "deal_streak_10"
  | "top_performer"
  | "revenue_milestone_10k"
  | "revenue_milestone_50k"
  | "revenue_milestone_100k"
  | "activity_champion"
  | "rising_star"
  | "consistent_performer"
  | "team_player";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get period boundaries based on period type
 */
function getPeriodBoundaries(period: LeaderboardPeriod): {
  start: number;
  end: number;
} {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (period) {
    case "daily":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarterly":
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "allTime":
      start = new Date(0);
      break;
    default:
      start = new Date(0);
  }

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

/**
 * Get metric display info
 */
export function getMetricInfo(metric: LeaderboardMetric): {
  label: string;
  icon: string;
  format: "number" | "currency";
} {
  switch (metric) {
    case "deals_won":
      return { label: "Deals Won", icon: "Trophy", format: "number" };
    case "revenue":
      return { label: "Revenue", icon: "DollarSign", format: "currency" };
    case "activities":
      return { label: "Activities", icon: "Activity", format: "number" };
    case "calls":
      return { label: "Calls Made", icon: "Phone", format: "number" };
    case "emails":
      return { label: "Emails Sent", icon: "Mail", format: "number" };
    case "new_contacts":
      return { label: "New Contacts", icon: "UserPlus", format: "number" };
    default:
      return { label: "Unknown", icon: "HelpCircle", format: "number" };
  }
}

/**
 * Get badge display info
 */
export function getBadgeInfo(badgeType: BadgeType): {
  name: string;
  description: string;
  icon: string;
  color: string;
} {
  switch (badgeType) {
    case "first_deal":
      return {
        name: "First Win",
        description: "Closed your first deal",
        icon: "Star",
        color: "#f59e0b",
      };
    case "deal_streak_3":
      return {
        name: "Hot Streak",
        description: "Won 3 deals in a row",
        icon: "Flame",
        color: "#ef4444",
      };
    case "deal_streak_5":
      return {
        name: "On Fire",
        description: "Won 5 deals in a row",
        icon: "Zap",
        color: "#f97316",
      };
    case "deal_streak_10":
      return {
        name: "Unstoppable",
        description: "Won 10 deals in a row",
        icon: "Crown",
        color: "#8b5cf6",
      };
    case "top_performer":
      return {
        name: "Top Performer",
        description: "Ranked #1 on a leaderboard",
        icon: "Medal",
        color: "#eab308",
      };
    case "revenue_milestone_10k":
      return {
        name: "$10K Club",
        description: "Closed $10,000 in revenue",
        icon: "TrendingUp",
        color: "#22c55e",
      };
    case "revenue_milestone_50k":
      return {
        name: "$50K Club",
        description: "Closed $50,000 in revenue",
        icon: "Target",
        color: "#3b82f6",
      };
    case "revenue_milestone_100k":
      return {
        name: "$100K Club",
        description: "Closed $100,000 in revenue",
        icon: "Award",
        color: "#a855f7",
      };
    case "activity_champion":
      return {
        name: "Activity Champion",
        description: "Completed 100+ activities",
        icon: "CheckCircle",
        color: "#06b6d4",
      };
    case "rising_star":
      return {
        name: "Rising Star",
        description: "Improved rank by 3+ positions",
        icon: "ArrowUpCircle",
        color: "#ec4899",
      };
    case "consistent_performer":
      return {
        name: "Consistent Performer",
        description: "Top 3 for 3 consecutive periods",
        icon: "BarChart2",
        color: "#14b8a6",
      };
    case "team_player":
      return {
        name: "Team Player",
        description: "Helped close 5 team deals",
        icon: "Users",
        color: "#6366f1",
      };
    default:
      return {
        name: "Unknown Badge",
        description: "",
        icon: "HelpCircle",
        color: "#6b7280",
      };
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all leaderboards
 */
export const listLeaderboards = query({
  args: {
    isActive: v.optional(v.boolean()),
    metric: v.optional(
      v.union(
        v.literal("deals_won"),
        v.literal("deals_closed"),
        v.literal("revenue"),
        v.literal("activities"),
        v.literal("calls"),
        v.literal("emails"),
        v.literal("meetings"),
        v.literal("new_contacts")
      )
    ),
    period: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly"),
        v.literal("allTime")
      )
    ),
  },
  handler: async (ctx, args) => {
    let leaderboards;

    if (args.isActive !== undefined) {
      leaderboards = await ctx.db
        .query("leaderboards")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      leaderboards = await ctx.db.query("leaderboards").collect();
    }

    // Apply additional filters
    if (args.metric) {
      leaderboards = leaderboards.filter((l) => l.metric === args.metric);
    }
    if (args.period) {
      leaderboards = leaderboards.filter((l) => l.period === args.period);
    }

    // Enrich with creator info and top users
    const enriched = await Promise.all(
      leaderboards.map(async (leaderboard) => {
        const creator = leaderboard.createdBy
          ? await ctx.db.get(leaderboard.createdBy)
          : null;

        // Get top 3 entries for preview
        const entries = await ctx.db
          .query("leaderboardEntries")
          .withIndex("by_leaderboard_rank", (q) =>
            q.eq("leaderboardId", leaderboard._id)
          )
          .take(3);

        const topUsers = await Promise.all(
          entries.map(async (entry) => {
            const user = await ctx.db.get(entry.userId);
            return {
              ...entry,
              user,
            };
          })
        );

        return {
          ...leaderboard,
          creator,
          topUsers,
          metricInfo: getMetricInfo(leaderboard.metric as LeaderboardMetric),
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single leaderboard with full rankings
 */
export const getLeaderboard = query({
  args: {
    id: v.id("leaderboards"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const leaderboard = await ctx.db.get(args.id);
    if (!leaderboard) {
      return null;
    }

    const limit = args.limit ?? 50;

    // Get entries sorted by rank
    const entries = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_leaderboard_rank", (q) =>
        q.eq("leaderboardId", args.id)
      )
      .take(limit);

    // Sort by rank to ensure proper ordering
    entries.sort((a, b) => a.rank - b.rank);

    // Enrich with user info
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        const badges = await ctx.db
          .query("userBadges")
          .withIndex("by_user", (q) => q.eq("userId", entry.userId))
          .collect();

        return {
          ...entry,
          user,
          badges: badges.map((b) => ({
            ...b,
            ...getBadgeInfo(b.badgeType as BadgeType),
          })),
          rankChange:
            entry.previousRank !== undefined
              ? entry.previousRank - entry.rank
              : 0,
        };
      })
    );

    const creator = leaderboard.createdBy
      ? await ctx.db.get(leaderboard.createdBy)
      : null;

    return {
      ...leaderboard,
      creator,
      entries: enrichedEntries,
      metricInfo: getMetricInfo(leaderboard.metric as LeaderboardMetric),
    };
  },
});

/**
 * Get current user's rank on a leaderboard
 */
export const getMyRank = query({
  args: {
    leaderboardId: v.id("leaderboards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Query using compound index
    const entry = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_leaderboard_user", (q) =>
        q.eq("leaderboardId", args.leaderboardId).eq("userId", args.userId)
      )
      .first();

    if (!entry) {
      return null;
    }

    const user = await ctx.db.get(args.userId);
    const badges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get total participants
    const totalEntries = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_leaderboard", (q) =>
        q.eq("leaderboardId", args.leaderboardId)
      )
      .collect();

    return {
      ...entry,
      user,
      badges: badges.map((b) => ({
        ...b,
        ...getBadgeInfo(b.badgeType as BadgeType),
      })),
      rankChange:
        entry.previousRank !== undefined
          ? entry.previousRank - entry.rank
          : 0,
      totalParticipants: totalEntries.length,
    };
  },
});

/**
 * Get leaderboard history for a user (rank changes over time)
 */
export const getLeaderboardHistory = query({
  args: {
    leaderboardId: v.id("leaderboards"),
    userId: v.id("users"),
    periods: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const periods = args.periods ?? 12;

    // Get all entries for this user on this leaderboard
    const entries = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("leaderboardId"), args.leaderboardId))
      .order("desc")
      .take(periods);

    return entries.map((entry) => ({
      rank: entry.rank,
      value: entry.value,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      updatedAt: entry.updatedAt,
    }));
  },
});

/**
 * Get user's badges
 */
export const getUserBadges = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const badges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return badges.map((badge) => ({
      ...badge,
      ...getBadgeInfo(badge.badgeType as BadgeType),
    }));
  },
});

/**
 * Get recent badge earners
 */
export const getRecentBadges = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const badges = await ctx.db
      .query("userBadges")
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      badges.map(async (badge) => {
        const user = await ctx.db.get(badge.userId);
        return {
          ...badge,
          ...getBadgeInfo(badge.badgeType as BadgeType),
          user,
        };
      })
    );

    return enriched;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new leaderboard
 */
export const createLeaderboard = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    metric: v.union(
      v.literal("deals_won"),
      v.literal("deals_closed"),
      v.literal("revenue"),
      v.literal("activities"),
      v.literal("calls"),
      v.literal("emails"),
      v.literal("meetings"),
      v.literal("new_contacts")
    ),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
      v.literal("allTime")
    ),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const leaderboardId = await ctx.db.insert("leaderboards", {
      name: args.name,
      description: args.description,
      metric: args.metric,
      period: args.period,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return leaderboardId;
  },
});

/**
 * Update a leaderboard
 */
export const updateLeaderboard = mutation({
  args: {
    id: v.id("leaderboards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Leaderboard not found");
    }

    const updateData: Partial<Doc<"leaderboards">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a leaderboard
 */
export const deleteLeaderboard = mutation({
  args: {
    id: v.id("leaderboards"),
  },
  handler: async (ctx, args) => {
    const leaderboard = await ctx.db.get(args.id);
    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    // Delete all entries
    const entries = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_leaderboard", (q) => q.eq("leaderboardId", args.id))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    // Delete the leaderboard
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Calculate rankings for a leaderboard
 */
export const calculateRankings = mutation({
  args: {
    leaderboardId: v.id("leaderboards"),
  },
  handler: async (ctx, args) => {
    const leaderboard = await ctx.db.get(args.leaderboardId);
    if (!leaderboard) {
      throw new Error("Leaderboard not found");
    }

    const { start, end } = getPeriodBoundaries(
      leaderboard.period as LeaderboardPeriod
    );
    const now = Date.now();

    // Get all active users
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Calculate value for each user based on metric
    const userValues: { userId: Id<"users">; value: number }[] = [];

    for (const user of users) {
      let value = 0;

      switch (leaderboard.metric) {
        case "deals_won":
          const wonDeals = await ctx.db
            .query("deals")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "won"),
                q.gte(q.field("actualCloseDate"), start),
                q.lte(q.field("actualCloseDate"), end)
              )
            )
            .collect();
          value = wonDeals.length;
          break;

        case "revenue":
          const revenueDeals = await ctx.db
            .query("deals")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "won"),
                q.gte(q.field("actualCloseDate"), start),
                q.lte(q.field("actualCloseDate"), end)
              )
            )
            .collect();
          value = revenueDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
          break;

        case "activities":
          const activities = await ctx.db
            .query("activities")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
              q.and(
                q.gte(q.field("createdAt"), start),
                q.lte(q.field("createdAt"), end)
              )
            )
            .collect();
          value = activities.length;
          break;

        case "calls":
          const calls = await ctx.db
            .query("activities")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
              q.and(
                q.eq(q.field("type"), "call"),
                q.gte(q.field("createdAt"), start),
                q.lte(q.field("createdAt"), end)
              )
            )
            .collect();
          value = calls.length;
          break;

        case "emails":
          const emails = await ctx.db
            .query("emails")
            .withIndex("by_sent_by", (q) => q.eq("sentBy", user._id))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "sent"),
                q.gte(q.field("sentAt"), start),
                q.lte(q.field("sentAt"), end)
              )
            )
            .collect();
          value = emails.length;
          break;

        case "new_contacts":
          const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
              q.and(
                q.gte(q.field("createdAt"), start),
                q.lte(q.field("createdAt"), end)
              )
            )
            .collect();
          value = contacts.length;
          break;
      }

      userValues.push({ userId: user._id, value });
    }

    // Sort by value descending
    userValues.sort((a, b) => b.value - a.value);

    // Get existing entries for previous rank comparison
    const existingEntries = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_leaderboard", (q) =>
        q.eq("leaderboardId", args.leaderboardId)
      )
      .collect();

    const existingByUser = new Map(
      existingEntries.map((e) => [e.userId, e])
    );

    // Update or create entries
    for (let i = 0; i < userValues.length; i++) {
      const { userId, value } = userValues[i];
      const rank = i + 1;
      const existing = existingByUser.get(userId);

      if (existing) {
        // Update existing entry
        await ctx.db.patch(existing._id, {
          rank,
          value,
          previousRank: existing.rank,
          periodStart: start,
          periodEnd: end,
          updatedAt: now,
        });

        // Check for rising star badge
        if (existing.rank - rank >= 3) {
          await awardBadge(ctx, userId, "rising_star");
        }
      } else {
        // Create new entry
        await ctx.db.insert("leaderboardEntries", {
          leaderboardId: args.leaderboardId,
          userId,
          rank,
          value,
          periodStart: start,
          periodEnd: end,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Check for top performer badge
      if (rank === 1 && value > 0) {
        await awardBadge(ctx, userId, "top_performer");
      }
    }

    // Update leaderboard timestamp
    await ctx.db.patch(args.leaderboardId, { updatedAt: now });

    return { success: true, entriesUpdated: userValues.length };
  },
});

/**
 * Refresh all active leaderboards
 */
export const refreshAllLeaderboards = mutation({
  args: {},
  handler: async (ctx) => {
    const activeLeaderboards = await ctx.db
      .query("leaderboards")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const results = [];

    for (const leaderboard of activeLeaderboards) {
      // We call calculateRankings logic inline here
      const { start, end } = getPeriodBoundaries(
        leaderboard.period as LeaderboardPeriod
      );
      const now = Date.now();

      const users = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const userValues: { userId: Id<"users">; value: number }[] = [];

      for (const user of users) {
        let value = 0;

        switch (leaderboard.metric) {
          case "deals_won":
            const wonDeals = await ctx.db
              .query("deals")
              .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
              .filter((q) =>
                q.and(
                  q.eq(q.field("status"), "won"),
                  q.gte(q.field("actualCloseDate"), start),
                  q.lte(q.field("actualCloseDate"), end)
                )
              )
              .collect();
            value = wonDeals.length;
            break;

          case "revenue":
            const revenueDeals = await ctx.db
              .query("deals")
              .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
              .filter((q) =>
                q.and(
                  q.eq(q.field("status"), "won"),
                  q.gte(q.field("actualCloseDate"), start),
                  q.lte(q.field("actualCloseDate"), end)
                )
              )
              .collect();
            value = revenueDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
            break;

          case "activities":
            const activities = await ctx.db
              .query("activities")
              .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
              .filter((q) =>
                q.and(
                  q.gte(q.field("createdAt"), start),
                  q.lte(q.field("createdAt"), end)
                )
              )
              .collect();
            value = activities.length;
            break;

          case "calls":
            const calls = await ctx.db
              .query("activities")
              .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
              .filter((q) =>
                q.and(
                  q.eq(q.field("type"), "call"),
                  q.gte(q.field("createdAt"), start),
                  q.lte(q.field("createdAt"), end)
                )
              )
              .collect();
            value = calls.length;
            break;

          case "emails":
            const emails = await ctx.db
              .query("emails")
              .withIndex("by_sent_by", (q) => q.eq("sentBy", user._id))
              .filter((q) =>
                q.and(
                  q.eq(q.field("status"), "sent"),
                  q.gte(q.field("sentAt"), start),
                  q.lte(q.field("sentAt"), end)
                )
              )
              .collect();
            value = emails.length;
            break;

          case "new_contacts":
            const contacts = await ctx.db
              .query("contacts")
              .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
              .filter((q) =>
                q.and(
                  q.gte(q.field("createdAt"), start),
                  q.lte(q.field("createdAt"), end)
                )
              )
              .collect();
            value = contacts.length;
            break;
        }

        userValues.push({ userId: user._id, value });
      }

      userValues.sort((a, b) => b.value - a.value);

      const existingEntries = await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_leaderboard", (q) =>
          q.eq("leaderboardId", leaderboard._id)
        )
        .collect();

      const existingByUser = new Map(
        existingEntries.map((e) => [e.userId, e])
      );

      for (let i = 0; i < userValues.length; i++) {
        const { userId, value } = userValues[i];
        const rank = i + 1;
        const existing = existingByUser.get(userId);

        if (existing) {
          await ctx.db.patch(existing._id, {
            rank,
            value,
            previousRank: existing.rank,
            periodStart: start,
            periodEnd: end,
            updatedAt: now,
          });

          if (existing.rank - rank >= 3) {
            await awardBadge(ctx, userId, "rising_star");
          }
        } else {
          await ctx.db.insert("leaderboardEntries", {
            leaderboardId: leaderboard._id,
            userId,
            rank,
            value,
            periodStart: start,
            periodEnd: end,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (rank === 1 && value > 0) {
          await awardBadge(ctx, userId, "top_performer");
        }
      }

      await ctx.db.patch(leaderboard._id, { updatedAt: now });

      results.push({
        leaderboardId: leaderboard._id,
        name: leaderboard.name,
        entriesUpdated: userValues.length,
      });
    }

    return results;
  },
});

/**
 * Award a badge to a user
 */
export const awardBadge = async (
  ctx: { db: any },
  userId: Id<"users">,
  badgeType: BadgeType
) => {
  // Check if user already has this badge
  const existing = await ctx.db
    .query("userBadges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("badgeType"), badgeType))
    .first();

  if (existing) {
    return null; // Already has badge
  }

  const now = Date.now();

  const badgeId = await ctx.db.insert("userBadges", {
    userId,
    badgeType,
    earnedAt: now,
  });

  // Create notification (using "system" type since "badge_earned" is not in schema)
  const badgeInfo = getBadgeInfo(badgeType);
  await ctx.db.insert("notifications", {
    type: "system",
    title: `Badge Earned: ${badgeInfo.name}`,
    message: badgeInfo.description,
    userId,
    read: false,
    createdAt: now,
  });

  return badgeId;
};

/**
 * Manual badge award mutation
 */
export const grantBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeType: v.union(
      v.literal("first_deal"),
      v.literal("deal_streak_3"),
      v.literal("deal_streak_5"),
      v.literal("deal_streak_10"),
      v.literal("top_performer"),
      v.literal("revenue_milestone_10k"),
      v.literal("revenue_milestone_50k"),
      v.literal("revenue_milestone_100k"),
      v.literal("activity_champion"),
      v.literal("rising_star"),
      v.literal("consistent_performer"),
      v.literal("team_player")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if user already has this badge
    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("badgeType"), args.badgeType))
      .first();

    if (existing) {
      return { success: false, message: "User already has this badge" };
    }

    const now = Date.now();

    const badgeId = await ctx.db.insert("userBadges", {
      userId: args.userId,
      badgeType: args.badgeType,
      earnedAt: now,
      metadata: args.metadata,
    });

    // Create notification (using "system" type since "badge_earned" is not in schema)
    const badgeInfo = getBadgeInfo(args.badgeType as BadgeType);
    await ctx.db.insert("notifications", {
      type: "system",
      title: `Badge Earned: ${badgeInfo.name}`,
      message: badgeInfo.description,
      userId: args.userId,
      read: false,
      createdAt: now,
    });

    return { success: true, badgeId };
  },
});

/**
 * Check and award milestone badges for a user
 */
export const checkMilestoneBadges = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const awarded: string[] = [];

    // Check first deal badge
    const wonDeals = await ctx.db
      .query("deals")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .filter((q) => q.eq(q.field("status"), "won"))
      .collect();

    if (wonDeals.length >= 1) {
      const result = await awardBadge(ctx, args.userId, "first_deal");
      if (result) awarded.push("first_deal");
    }

    // Check revenue milestones
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

    if (totalRevenue >= 100000) {
      const result = await awardBadge(
        ctx,
        args.userId,
        "revenue_milestone_100k"
      );
      if (result) awarded.push("revenue_milestone_100k");
    } else if (totalRevenue >= 50000) {
      const result = await awardBadge(
        ctx,
        args.userId,
        "revenue_milestone_50k"
      );
      if (result) awarded.push("revenue_milestone_50k");
    } else if (totalRevenue >= 10000) {
      const result = await awardBadge(
        ctx,
        args.userId,
        "revenue_milestone_10k"
      );
      if (result) awarded.push("revenue_milestone_10k");
    }

    // Check activity champion badge
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    if (activities.length >= 100) {
      const result = await awardBadge(ctx, args.userId, "activity_champion");
      if (result) awarded.push("activity_champion");
    }

    return { awarded };
  },
});
