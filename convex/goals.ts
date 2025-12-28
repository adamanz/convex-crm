import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// GOALS - Query and Mutation Functions
// ============================================================================

/**
 * List all goals with optional filtering
 */
export const list = query({
  args: {
    filter: v.optional(
      v.object({
        ownerId: v.optional(v.id("users")),
        teamWide: v.optional(v.boolean()),
        isActive: v.optional(v.boolean()),
        type: v.optional(
          v.union(
            v.literal("revenue"),
            v.literal("deals"),
            v.literal("activities"),
            v.literal("calls")
          )
        ),
        period: v.optional(
          v.union(
            v.literal("daily"),
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("quarterly"),
            v.literal("yearly")
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { filter } = args;

    let goalsQuery;

    // Use appropriate index based on filter
    if (filter?.ownerId) {
      goalsQuery = ctx.db
        .query("goals")
        .withIndex("by_owner", (q) => q.eq("ownerId", filter.ownerId));
    } else if (filter?.teamWide !== undefined) {
      goalsQuery = ctx.db
        .query("goals")
        .withIndex("by_team_wide", (q) => q.eq("teamWide", filter.teamWide!));
    } else if (filter?.isActive !== undefined) {
      goalsQuery = ctx.db
        .query("goals")
        .withIndex("by_active", (q) => q.eq("isActive", filter.isActive!));
    } else if (filter?.type) {
      goalsQuery = ctx.db
        .query("goals")
        .withIndex("by_type", (q) => q.eq("type", filter.type!));
    } else if (filter?.period) {
      goalsQuery = ctx.db
        .query("goals")
        .withIndex("by_period", (q) => q.eq("period", filter.period!));
    } else {
      goalsQuery = ctx.db.query("goals");
    }

    const goals = await goalsQuery.collect();

    // Apply additional filters
    let filteredGoals = goals;

    if (filter?.isActive !== undefined && !filter?.ownerId && filter?.teamWide === undefined) {
      // Already filtered by index
    } else if (filter?.isActive !== undefined) {
      filteredGoals = filteredGoals.filter((g) => g.isActive === filter.isActive);
    }

    if (filter?.type && !goalsQuery.toString().includes("by_type")) {
      filteredGoals = filteredGoals.filter((g) => g.type === filter.type);
    }

    // Fetch owner information for each goal
    const goalsWithOwners = await Promise.all(
      filteredGoals.map(async (goal) => {
        let owner: Doc<"users"> | null = null;
        if (goal.ownerId) {
          owner = await ctx.db.get(goal.ownerId);
        }
        return {
          ...goal,
          owner,
          progressPercent: goal.targetValue > 0
            ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
            : 0,
        };
      })
    );

    return goalsWithOwners;
  },
});

/**
 * Get a single goal by ID
 */
export const get = query({
  args: {
    id: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) {
      return null;
    }

    // Fetch owner info
    let owner: Doc<"users"> | null = null;
    if (goal.ownerId) {
      owner = await ctx.db.get(goal.ownerId);
    }

    // Fetch progress history
    const progressHistory = await ctx.db
      .query("goalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .order("desc")
      .collect();

    return {
      ...goal,
      owner,
      progressHistory,
      progressPercent: goal.targetValue > 0
        ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        : 0,
    };
  },
});

/**
 * Get current user's goals
 */
export const getMyGoals = query({
  args: {
    userId: v.id("users"),
    includeTeam: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, includeTeam = true } = args;

    // Get user's personal goals
    const personalGoals = await ctx.db
      .query("goals")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // Get team-wide goals if requested
    let teamGoals: Doc<"goals">[] = [];
    if (includeTeam) {
      teamGoals = await ctx.db
        .query("goals")
        .withIndex("by_team_wide", (q) => q.eq("teamWide", true))
        .collect();
    }

    // Combine and deduplicate
    const allGoals = [...personalGoals];
    for (const teamGoal of teamGoals) {
      if (!allGoals.find((g) => g._id === teamGoal._id)) {
        allGoals.push(teamGoal);
      }
    }

    // Filter to only active goals
    const activeGoals = allGoals.filter((g) => g.isActive);

    // Add progress percentage
    return activeGoals.map((goal) => ({
      ...goal,
      progressPercent: goal.targetValue > 0
        ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        : 0,
    }));
  },
});

/**
 * Get team-wide goals
 */
export const getTeamGoals = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { isActive } = args;

    let goals = await ctx.db
      .query("goals")
      .withIndex("by_team_wide", (q) => q.eq("teamWide", true))
      .collect();

    if (isActive !== undefined) {
      goals = goals.filter((g) => g.isActive === isActive);
    }

    return goals.map((goal) => ({
      ...goal,
      progressPercent: goal.targetValue > 0
        ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
        : 0,
    }));
  },
});

/**
 * Get goals by time period
 */
export const getGoalsByPeriod = query({
  args: {
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    ownerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { period, ownerId, isActive } = args;

    let goals = await ctx.db
      .query("goals")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();

    if (ownerId) {
      goals = goals.filter((g) => g.ownerId === ownerId || g.teamWide);
    }

    if (isActive !== undefined) {
      goals = goals.filter((g) => g.isActive === isActive);
    }

    // Fetch owners
    const goalsWithOwners = await Promise.all(
      goals.map(async (goal) => {
        let owner: Doc<"users"> | null = null;
        if (goal.ownerId) {
          owner = await ctx.db.get(goal.ownerId);
        }
        return {
          ...goal,
          owner,
          progressPercent: goal.targetValue > 0
            ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
            : 0,
        };
      })
    );

    return goalsWithOwners;
  },
});

/**
 * Create a new goal
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("revenue"),
      v.literal("deals"),
      v.literal("activities"),
      v.literal("calls")
    ),
    targetValue: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    ownerId: v.optional(v.id("users")),
    teamWide: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate owner exists if provided
    if (args.ownerId) {
      const owner = await ctx.db.get(args.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Validate dates
    if (args.endDate <= args.startDate) {
      throw new Error("End date must be after start date");
    }

    const goalId = await ctx.db.insert("goals", {
      name: args.name,
      description: args.description,
      type: args.type,
      targetValue: args.targetValue,
      currentValue: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      period: args.period,
      ownerId: args.ownerId,
      teamWide: args.teamWide ?? false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "goal_created",
      entityType: "goal",
      entityId: goalId,
      metadata: {
        name: args.name,
        type: args.type,
        targetValue: args.targetValue,
        period: args.period,
      },
      timestamp: now,
      system: true,
    });

    return goalId;
  },
});

/**
 * Update an existing goal
 */
export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("revenue"),
        v.literal("deals"),
        v.literal("activities"),
        v.literal("calls")
      )
    ),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    period: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly")
      )
    ),
    ownerId: v.optional(v.id("users")),
    teamWide: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check goal exists
    const existingGoal = await ctx.db.get(id);
    if (!existingGoal) {
      throw new Error("Goal not found");
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined && updates.ownerId !== null) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Validate dates if being updated
    const startDate = updates.startDate ?? existingGoal.startDate;
    const endDate = updates.endDate ?? existingGoal.endDate;
    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"goals">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.targetValue !== undefined) updateData.targetValue = updates.targetValue;
    if (updates.currentValue !== undefined) updateData.currentValue = updates.currentValue;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.period !== undefined) updateData.period = updates.period;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.teamWide !== undefined) updateData.teamWide = updates.teamWide;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "goal_updated",
      entityType: "goal",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete a goal
 */
export const delete_ = mutation({
  args: {
    id: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check goal exists
    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "goal_deleted",
      entityType: "goal",
      entityId: args.id,
      metadata: {
        deletedGoal: {
          name: goal.name,
          type: goal.type,
          targetValue: goal.targetValue,
        },
      },
      timestamp: now,
      system: true,
    });

    // Delete related progress entries
    const progressEntries = await ctx.db
      .query("goalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", args.id))
      .collect();

    for (const entry of progressEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete the goal
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Update goal progress
 */
export const updateProgress = mutation({
  args: {
    goalId: v.id("goals"),
    value: v.number(),
    notes: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check goal exists
    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Create progress entry
    const progressId = await ctx.db.insert("goalProgress", {
      goalId: args.goalId,
      date: args.date ?? now,
      value: args.value,
      notes: args.notes,
      createdAt: now,
    });

    // Update the goal's current value
    await ctx.db.patch(args.goalId, {
      currentValue: goal.currentValue + args.value,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "goal_progress_updated",
      entityType: "goal",
      entityId: args.goalId,
      metadata: {
        value: args.value,
        newTotal: goal.currentValue + args.value,
        notes: args.notes,
      },
      timestamp: now,
      system: true,
    });

    return progressId;
  },
});

/**
 * Calculate progress for a goal (recalculate from progress entries)
 */
export const calculateProgress = mutation({
  args: {
    goalId: v.id("goals"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check goal exists
    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Sum all progress entries
    const progressEntries = await ctx.db
      .query("goalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    const totalProgress = progressEntries.reduce((sum, entry) => sum + entry.value, 0);

    // Update the goal
    await ctx.db.patch(args.goalId, {
      currentValue: totalProgress,
      updatedAt: now,
    });

    return {
      goalId: args.goalId,
      currentValue: totalProgress,
      targetValue: goal.targetValue,
      progressPercent: goal.targetValue > 0
        ? Math.min(100, (totalProgress / goal.targetValue) * 100)
        : 0,
    };
  },
});

/**
 * Get aggregated goal statistics
 */
export const rollupStats = query({
  args: {
    ownerId: v.optional(v.id("users")),
    includeTeam: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { ownerId, includeTeam = true } = args;
    const now = Date.now();

    // Get relevant goals
    let goals: Doc<"goals">[] = [];

    if (ownerId) {
      const personalGoals = await ctx.db
        .query("goals")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect();
      goals = [...personalGoals];

      if (includeTeam) {
        const teamGoals = await ctx.db
          .query("goals")
          .withIndex("by_team_wide", (q) => q.eq("teamWide", true))
          .collect();
        for (const teamGoal of teamGoals) {
          if (!goals.find((g) => g._id === teamGoal._id)) {
            goals.push(teamGoal);
          }
        }
      }
    } else {
      goals = await ctx.db.query("goals").collect();
    }

    // Filter to active goals
    const activeGoals = goals.filter((g) => g.isActive);

    // Calculate statistics
    const totalGoals = activeGoals.length;
    const completedGoals = activeGoals.filter(
      (g) => g.currentValue >= g.targetValue
    ).length;
    const onTrackGoals = activeGoals.filter((g) => {
      const elapsed = now - g.startDate;
      const total = g.endDate - g.startDate;
      const expectedProgress = (elapsed / total) * g.targetValue;
      return g.currentValue >= expectedProgress * 0.9; // Within 90% of expected
    }).length;
    const behindGoals = totalGoals - completedGoals - onTrackGoals;

    // Group by type
    const byType = {
      revenue: activeGoals.filter((g) => g.type === "revenue"),
      deals: activeGoals.filter((g) => g.type === "deals"),
      activities: activeGoals.filter((g) => g.type === "activities"),
      calls: activeGoals.filter((g) => g.type === "calls"),
    };

    // Calculate totals by type
    const typeStats = Object.entries(byType).map(([type, typeGoals]) => ({
      type,
      count: typeGoals.length,
      totalTarget: typeGoals.reduce((sum, g) => sum + g.targetValue, 0),
      totalCurrent: typeGoals.reduce((sum, g) => sum + g.currentValue, 0),
      avgProgress:
        typeGoals.length > 0
          ? typeGoals.reduce(
              (sum, g) =>
                sum +
                (g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0),
              0
            ) / typeGoals.length
          : 0,
    }));

    // Get upcoming deadlines (goals ending in next 7 days)
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const upcomingDeadlines = activeGoals
      .filter((g) => g.endDate <= sevenDaysFromNow && g.endDate > now)
      .sort((a, b) => a.endDate - b.endDate);

    return {
      totalGoals,
      completedGoals,
      onTrackGoals,
      behindGoals,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      typeStats,
      upcomingDeadlines: upcomingDeadlines.map((g) => ({
        ...g,
        progressPercent: g.targetValue > 0
          ? Math.min(100, (g.currentValue / g.targetValue) * 100)
          : 0,
      })),
    };
  },
});

/**
 * Get progress history for a goal
 */
export const getProgressHistory = query({
  args: {
    goalId: v.id("goals"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { goalId, limit = 30 } = args;

    const progressEntries = await ctx.db
      .query("goalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", goalId))
      .order("desc")
      .take(limit);

    return progressEntries;
  },
});
