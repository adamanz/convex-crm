import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get comprehensive analytics data for a given time range
 */
export const getAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    pipelineId: v.optional(v.id("pipelines")),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, pipelineId, ownerId } = args;

    // Get all deals
    let deals = await ctx.db.query("deals").collect();

    // Apply filters
    if (pipelineId) {
      deals = deals.filter((d) => d.pipelineId === pipelineId);
    }
    if (ownerId) {
      deals = deals.filter((d) => d.ownerId === ownerId);
    }

    // Filter deals by date range (using createdAt for creation, actualCloseDate for closed deals)
    const dealsInRange = deals.filter(
      (d) => d.createdAt >= startDate && d.createdAt <= endDate
    );

    const closedDealsInRange = deals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate >= startDate &&
        d.actualCloseDate <= endDate
    );

    // Calculate KPIs
    const totalDeals = dealsInRange.length;
    const openDeals = dealsInRange.filter((d) => d.status === "open").length;
    const wonDeals = closedDealsInRange.filter((d) => d.status === "won").length;
    const lostDeals = closedDealsInRange.filter((d) => d.status === "lost").length;
    const closedDeals = wonDeals + lostDeals;

    const totalRevenue = closedDealsInRange
      .filter((d) => d.status === "won")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const pipelineValue = deals
      .filter((d) => d.status === "open")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;

    const avgDealSize =
      wonDeals > 0
        ? totalRevenue / wonDeals
        : 0;

    // Get activities in date range
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_created")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    const totalActivities = activities.length;

    // Calculate conversion rates
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    const contactToDealsRate =
      contacts.length > 0 ? (totalDeals / contacts.length) * 100 : 0;

    const dealToWonRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    return {
      kpis: {
        totalDeals,
        openDeals,
        wonDeals,
        lostDeals,
        closedDeals,
        totalRevenue,
        pipelineValue,
        winRate,
        avgDealSize,
        totalActivities,
        totalContacts: contacts.length,
        contactToDealsRate,
        dealToWonRate,
      },
    };
  },
});

/**
 * Get revenue data over time (grouped by day/week/month)
 */
export const getRevenueOverTime = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    groupBy: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    pipelineId: v.optional(v.id("pipelines")),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, groupBy, pipelineId } = args;

    let deals = await ctx.db.query("deals").collect();

    if (pipelineId) {
      deals = deals.filter((d) => d.pipelineId === pipelineId);
    }

    // Filter won deals in date range
    const wonDeals = deals.filter(
      (d) =>
        d.status === "won" &&
        d.actualCloseDate &&
        d.actualCloseDate >= startDate &&
        d.actualCloseDate <= endDate
    );

    // Group by time period
    const revenueByPeriod = new Map<string, number>();

    wonDeals.forEach((deal) => {
      if (!deal.actualCloseDate) return;

      const date = new Date(deal.actualCloseDate);
      let key: string;

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      const current = revenueByPeriod.get(key) || 0;
      revenueByPeriod.set(key, current + (deal.amount || 0));
    });

    // Convert to array and sort
    const data = Array.from(revenueByPeriod.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return data;
  },
});

/**
 * Get pipeline stage distribution
 */
export const getPipelineAnalytics = query({
  args: {
    pipelineId: v.id("pipelines"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { pipelineId, startDate, endDate } = args;

    const pipeline = await ctx.db.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    let deals = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", pipelineId))
      .collect();

    // Apply date filter if provided
    if (startDate && endDate) {
      deals = deals.filter(
        (d) => d.createdAt >= startDate && d.createdAt <= endDate
      );
    }

    // Only count open deals for pipeline funnel
    const openDeals = deals.filter((d) => d.status === "open");

    const stages = pipeline.stages.map((stage) => {
      const stageDeals = openDeals.filter((d) => d.stageId === stage.id);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

      return {
        name: stage.name,
        count,
        value,
        fill: stage.color,
      };
    });

    return stages;
  },
});

/**
 * Get activity breakdown by type
 */
export const getActivityAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, ownerId } = args;

    let activities = await ctx.db
      .query("activities")
      .withIndex("by_created")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    if (ownerId) {
      activities = activities.filter((a) => a.ownerId === ownerId);
    }

    // Group by type
    const activityCounts = new Map<string, number>();

    activities.forEach((activity) => {
      const current = activityCounts.get(activity.type) || 0;
      activityCounts.set(activity.type, current + 1);
    });

    const data = Array.from(activityCounts.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return data;
  },
});

/**
 * Get win rate analytics with trend
 */
export const getWinRateAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    previousStartDate: v.optional(v.number()),
    previousEndDate: v.optional(v.number()),
    pipelineId: v.optional(v.id("pipelines")),
  },
  handler: async (ctx, args) => {
    const {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      pipelineId,
    } = args;

    let deals = await ctx.db.query("deals").collect();

    if (pipelineId) {
      deals = deals.filter((d) => d.pipelineId === pipelineId);
    }

    // Current period deals
    const currentDeals = deals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate >= startDate &&
        d.actualCloseDate <= endDate
    );

    const won = currentDeals.filter((d) => d.status === "won").length;
    const lost = currentDeals.filter((d) => d.status === "lost").length;
    const pending = deals.filter((d) => d.status === "open").length;

    const wonValue = currentDeals
      .filter((d) => d.status === "won")
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    const lostValue = currentDeals
      .filter((d) => d.status === "lost")
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    const pendingValue = deals
      .filter((d) => d.status === "open")
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Previous period win rate (if dates provided)
    let previousWinRate: number | undefined;
    if (previousStartDate && previousEndDate) {
      const previousDeals = deals.filter(
        (d) =>
          d.actualCloseDate &&
          d.actualCloseDate >= previousStartDate &&
          d.actualCloseDate <= previousEndDate
      );

      const prevWon = previousDeals.filter((d) => d.status === "won").length;
      const prevLost = previousDeals.filter((d) => d.status === "lost").length;
      const prevClosed = prevWon + prevLost;

      previousWinRate = prevClosed > 0 ? (prevWon / prevClosed) * 100 : 0;
    }

    return {
      won,
      lost,
      pending,
      wonValue,
      lostValue,
      pendingValue,
      previousWinRate,
    };
  },
});

/**
 * Get team performance analytics
 */
export const getTeamPerformance = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    pipelineId: v.optional(v.id("pipelines")),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, pipelineId } = args;

    const users = await ctx.db.query("users").collect();
    let deals = await ctx.db.query("deals").collect();

    if (pipelineId) {
      deals = deals.filter((d) => d.pipelineId === pipelineId);
    }

    // Get activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_created")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    const teamData = await Promise.all(
      users.map(async (user) => {
        const userDeals = deals.filter((d) => d.ownerId === user._id);

        const closedDeals = userDeals.filter(
          (d) =>
            d.actualCloseDate &&
            d.actualCloseDate >= startDate &&
            d.actualCloseDate <= endDate
        );

        const dealsWon = closedDeals.filter((d) => d.status === "won").length;
        const dealsLost = closedDeals.filter((d) => d.status === "lost").length;

        const revenue = closedDeals
          .filter((d) => d.status === "won")
          .reduce((sum, d) => sum + (d.amount || 0), 0);

        const userActivities = activities.filter((a) => a.ownerId === user._id);

        // Get user's goal if exists
        const goals = await ctx.db
          .query("goals")
          .withIndex("by_owner")
          .filter((q) => q.eq(q.field("ownerId"), user._id))
          .collect();

        const activeGoal = goals.find(
          (g) =>
            g.type === "revenue" &&
            g.startDate <= endDate &&
            g.endDate >= startDate
        );

        return {
          id: user._id,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
          avatarUrl: user.avatarUrl,
          dealsWon,
          dealsLost,
          revenue,
          target: activeGoal?.targetValue,
          activities: userActivities.length,
        };
      })
    );

    // Filter out users with no activity
    return teamData.filter(
      (member) =>
        member.dealsWon > 0 || member.dealsLost > 0 || member.activities > 0
    );
  },
});

/**
 * Get conversion funnel metrics
 */
export const getConversionFunnel = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate } = args;

    // Get all entities in date range
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    const deals = await ctx.db
      .query("deals")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    const wonDeals = deals.filter(
      (d) =>
        d.status === "won" &&
        d.actualCloseDate &&
        d.actualCloseDate >= startDate &&
        d.actualCloseDate <= endDate
    );

    const totalContacts = contacts.length;
    const totalDeals = deals.length;
    const totalWon = wonDeals.length;

    const contactToDealRate =
      totalContacts > 0 ? (totalDeals / totalContacts) * 100 : 0;
    const dealToWonRate = totalDeals > 0 ? (totalWon / totalDeals) * 100 : 0;
    const contactToWonRate =
      totalContacts > 0 ? (totalWon / totalContacts) * 100 : 0;

    return {
      stages: [
        {
          name: "Contacts",
          count: totalContacts,
          conversionRate: 100,
        },
        {
          name: "Deals Created",
          count: totalDeals,
          conversionRate: contactToDealRate,
        },
        {
          name: "Deals Won",
          count: totalWon,
          conversionRate: dealToWonRate,
        },
      ],
      overallConversionRate: contactToWonRate,
    };
  },
});
