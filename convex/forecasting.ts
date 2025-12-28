import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// Types
// ============================================================================

type ForecastPeriod = "monthly" | "quarterly" | "yearly";
type ForecastCategory = "committed" | "best_case" | "pipeline" | "omitted";

interface DealPrediction {
  dealId: string;
  dealName: string;
  amount: number;
  probability: number;
  predictedCloseDate?: number;
  category: ForecastCategory;
  aiAdjustedProbability?: number;
  riskFactors?: string[];
}

interface ForecastCalculation {
  committed: number;
  bestCase: number;
  pipeline: number;
  closed: number;
  predictedRevenue: number;
  confidence: number;
  predictions: DealPrediction[];
  predictionFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}

// ============================================================================
// Queries
// ============================================================================

// List all forecasts with optional filters
export const listForecasts = query({
  args: {
    period: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    )),
    ownerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let forecasts;

    if (args.isActive !== undefined) {
      forecasts = await ctx.db
        .query("forecasts")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .order("desc")
        .collect();
    } else if (args.period) {
      forecasts = await ctx.db
        .query("forecasts")
        .withIndex("by_period", (q) => q.eq("period", args.period!))
        .order("desc")
        .collect();
    } else {
      forecasts = await ctx.db
        .query("forecasts")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Apply additional filters
    if (args.ownerId) {
      forecasts = forecasts.filter((f) => f.ownerId === args.ownerId);
    }
    if (args.period && !args.isActive) {
      forecasts = forecasts.filter((f) => f.period === args.period);
    }

    // Apply limit
    if (args.limit) {
      forecasts = forecasts.slice(0, args.limit);
    }

    return forecasts;
  },
});

// Get a single forecast by ID
export const getForecast = query({
  args: { id: v.id("forecasts") },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.id);
    if (!forecast) return null;

    // Get the most recent snapshot
    const latestSnapshot = await ctx.db
      .query("forecastSnapshots")
      .withIndex("by_forecast", (q) => q.eq("forecastId", args.id))
      .order("desc")
      .first();

    // Get all snapshots for trend analysis
    const snapshots = await ctx.db
      .query("forecastSnapshots")
      .withIndex("by_forecast", (q) => q.eq("forecastId", args.id))
      .order("desc")
      .take(10);

    return {
      ...forecast,
      latestSnapshot,
      snapshots,
    };
  },
});

// Get forecast summary for dashboard widget
export const getForecastSummary = query({
  args: {},
  handler: async (ctx) => {
    // Get the most recent active forecast
    const activeForecasts = await ctx.db
      .query("forecasts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(3);

    if (activeForecasts.length === 0) {
      return null;
    }

    const currentForecast = activeForecasts[0];

    // Get previous period forecast for comparison
    const previousForecast = activeForecasts[1] || null;

    // Calculate progress toward target
    const closed = currentForecast.closed || 0;
    const target = currentForecast.targetRevenue || 0;
    const progress = target > 0 ? (closed / target) * 100 : 0;

    // Calculate days remaining in period
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((currentForecast.endDate - now) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((currentForecast.endDate - currentForecast.startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = totalDays - daysRemaining;

    return {
      forecast: currentForecast,
      progress,
      daysRemaining,
      daysElapsed,
      totalDays,
      previousForecast,
      paceStatus: getPaceStatus(closed, target, daysElapsed, totalDays),
    };
  },
});

// Helper function to determine pacing status
function getPaceStatus(
  closed: number,
  target: number,
  daysElapsed: number,
  totalDays: number
): "ahead" | "on_track" | "behind" | "at_risk" {
  if (target === 0 || totalDays === 0) return "on_track";

  const expectedProgress = (daysElapsed / totalDays) * target;
  const actualProgress = closed;
  const progressRatio = actualProgress / expectedProgress;

  if (progressRatio >= 1.1) return "ahead";
  if (progressRatio >= 0.9) return "on_track";
  if (progressRatio >= 0.7) return "behind";
  return "at_risk";
}

// Get deals categorized by forecast category
export const getDealsByForecastCategory = query({
  args: {
    forecastId: v.id("forecasts"),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.forecastId);
    if (!forecast) return null;

    // Get all open deals in the forecast period
    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter deals by expected close date within forecast period
    const dealsInPeriod = allDeals.filter((deal) => {
      if (!deal.expectedCloseDate) return false;
      return deal.expectedCloseDate >= forecast.startDate &&
             deal.expectedCloseDate <= forecast.endDate;
    });

    // Apply pipeline filter if specified
    const filteredDeals = forecast.pipelineId
      ? dealsInPeriod.filter((d) => d.pipelineId === forecast.pipelineId)
      : dealsInPeriod;

    // Categorize deals by probability
    const categorizedDeals = {
      committed: [] as Doc<"deals">[],
      bestCase: [] as Doc<"deals">[],
      pipeline: [] as Doc<"deals">[],
      omitted: [] as Doc<"deals">[],
    };

    for (const deal of filteredDeals) {
      const probability = deal.probability || 0;
      if (probability >= 90) {
        categorizedDeals.committed.push(deal);
      } else if (probability >= 70) {
        categorizedDeals.bestCase.push(deal);
      } else if (probability >= 20) {
        categorizedDeals.pipeline.push(deal);
      } else {
        categorizedDeals.omitted.push(deal);
      }
    }

    // Get closed won deals in period
    const closedDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "won"))
      .collect();

    const closedInPeriod = closedDeals.filter((deal) => {
      if (!deal.actualCloseDate) return false;
      return deal.actualCloseDate >= forecast.startDate &&
             deal.actualCloseDate <= forecast.endDate;
    });

    // Calculate totals
    const totals = {
      committed: categorizedDeals.committed.reduce((sum, d) => sum + (d.amount || 0), 0),
      bestCase: categorizedDeals.bestCase.reduce((sum, d) => sum + (d.amount || 0), 0),
      pipeline: categorizedDeals.pipeline.reduce((sum, d) => sum + (d.amount || 0), 0),
      omitted: categorizedDeals.omitted.reduce((sum, d) => sum + (d.amount || 0), 0),
      closed: closedInPeriod.reduce((sum, d) => sum + (d.amount || 0), 0),
    };

    return {
      deals: categorizedDeals,
      closedDeals: closedInPeriod,
      totals,
      dealCounts: {
        committed: categorizedDeals.committed.length,
        bestCase: categorizedDeals.bestCase.length,
        pipeline: categorizedDeals.pipeline.length,
        omitted: categorizedDeals.omitted.length,
        closed: closedInPeriod.length,
      },
    };
  },
});

// Get historical accuracy comparing forecasts to actual results
export const getHistoricalAccuracy = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    // Get completed forecasts (end date in the past)
    const now = Date.now();
    const allForecasts = await ctx.db
      .query("forecasts")
      .withIndex("by_created")
      .order("desc")
      .collect();

    const completedForecasts = allForecasts
      .filter((f) => f.endDate < now)
      .slice(0, limit);

    const accuracyData = completedForecasts.map((forecast) => {
      const predicted = forecast.predictedRevenue || 0;
      const actual = forecast.closed || 0;
      const target = forecast.targetRevenue || 0;

      const predictionAccuracy = predicted > 0
        ? Math.min(100, 100 - Math.abs((actual - predicted) / predicted * 100))
        : 0;

      const targetAttainment = target > 0
        ? (actual / target) * 100
        : 0;

      return {
        forecastId: forecast._id,
        name: forecast.name,
        period: forecast.period,
        startDate: forecast.startDate,
        endDate: forecast.endDate,
        predicted,
        actual,
        target,
        predictionAccuracy,
        targetAttainment,
        variance: actual - predicted,
        variancePercentage: predicted > 0 ? ((actual - predicted) / predicted) * 100 : 0,
      };
    });

    // Calculate aggregate metrics
    const avgAccuracy = accuracyData.length > 0
      ? accuracyData.reduce((sum, d) => sum + d.predictionAccuracy, 0) / accuracyData.length
      : 0;

    const avgAttainment = accuracyData.length > 0
      ? accuracyData.reduce((sum, d) => sum + d.targetAttainment, 0) / accuracyData.length
      : 0;

    return {
      forecasts: accuracyData,
      aggregates: {
        averageAccuracy: avgAccuracy,
        averageAttainment: avgAttainment,
        totalForecasts: accuracyData.length,
      },
    };
  },
});

// Get forecast snapshots for trend analysis
export const getForecastSnapshots = query({
  args: {
    forecastId: v.id("forecasts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    const snapshots = await ctx.db
      .query("forecastSnapshots")
      .withIndex("by_forecast", (q) => q.eq("forecastId", args.forecastId))
      .order("desc")
      .take(limit);

    return snapshots.reverse(); // Return in chronological order
  },
});

// ============================================================================
// Mutations
// ============================================================================

// Create a new forecast
export const createForecast = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    period: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    startDate: v.number(),
    endDate: v.number(),
    targetRevenue: v.optional(v.number()),
    pipelineId: v.optional(v.id("pipelines")),
    ownerId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const forecastId = await ctx.db.insert("forecasts", {
      name: args.name,
      description: args.description,
      period: args.period,
      startDate: args.startDate,
      endDate: args.endDate,
      targetRevenue: args.targetRevenue,
      pipelineId: args.pipelineId,
      ownerId: args.ownerId,
      createdBy: args.createdBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return forecastId;
  },
});

// Update a forecast
export const updateForecast = mutation({
  args: {
    id: v.id("forecasts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetRevenue: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    pipelineId: v.optional(v.id("pipelines")),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const forecast = await ctx.db.get(id);
    if (!forecast) {
      throw new Error("Forecast not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Calculate forecast values based on current pipeline
export const calculateForecast = mutation({
  args: {
    id: v.id("forecasts"),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.id);
    if (!forecast) {
      throw new Error("Forecast not found");
    }

    // Get all open deals
    const openDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter by expected close date within forecast period
    const dealsInPeriod = openDeals.filter((deal) => {
      if (!deal.expectedCloseDate) return false;
      return deal.expectedCloseDate >= forecast.startDate &&
             deal.expectedCloseDate <= forecast.endDate;
    });

    // Apply pipeline filter if specified
    const filteredDeals = forecast.pipelineId
      ? dealsInPeriod.filter((d) => d.pipelineId === forecast.pipelineId)
      : dealsInPeriod;

    // Calculate category totals
    let committed = 0;
    let bestCase = 0;
    let pipeline = 0;

    for (const deal of filteredDeals) {
      const amount = deal.amount || 0;
      const probability = deal.probability || 0;

      if (probability >= 90) {
        committed += amount;
      } else if (probability >= 70) {
        bestCase += amount;
      } else if (probability >= 20) {
        pipeline += amount;
      }
    }

    // Get closed won deals in period
    const wonDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "won"))
      .collect();

    const closed = wonDeals
      .filter((deal) => {
        if (!deal.actualCloseDate) return false;
        return deal.actualCloseDate >= forecast.startDate &&
               deal.actualCloseDate <= forecast.endDate;
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate weighted prediction
    const weightedPipeline = filteredDeals.reduce((sum, deal) => {
      const amount = deal.amount || 0;
      const probability = (deal.probability || 0) / 100;
      return sum + amount * probability;
    }, 0);

    const predictedRevenue = closed + weightedPipeline;

    // Calculate confidence based on deal quality and historical accuracy
    const confidence = calculateConfidence(filteredDeals, committed, bestCase, pipeline);

    // Update forecast
    await ctx.db.patch(args.id, {
      committed,
      bestCase,
      pipeline,
      closed,
      predictedRevenue,
      confidence,
      lastCalculatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      committed,
      bestCase,
      pipeline,
      closed,
      predictedRevenue,
      confidence,
    };
  },
});

// Helper function to calculate confidence score
function calculateConfidence(
  deals: Doc<"deals">[],
  committed: number,
  bestCase: number,
  pipeline: number
): number {
  if (deals.length === 0) return 0;

  // Base confidence on composition of pipeline
  const total = committed + bestCase + pipeline;
  if (total === 0) return 50;

  // Higher confidence when more revenue is in committed
  const committedRatio = committed / total;
  const bestCaseRatio = bestCase / total;

  // Calculate confidence (0-100)
  let confidence = 50; // Base confidence
  confidence += committedRatio * 40; // Up to 40 points for committed deals
  confidence += bestCaseRatio * 20; // Up to 20 points for best case deals

  // Adjust for deal count (more deals = more reliable)
  const dealCountBonus = Math.min(10, deals.length * 0.5);
  confidence += dealCountBonus;

  return Math.min(100, Math.round(confidence));
}

// Create a snapshot of the current forecast state
export const snapshotForecast = mutation({
  args: {
    forecastId: v.id("forecasts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const forecast = await ctx.db.get(args.forecastId);
    if (!forecast) {
      throw new Error("Forecast not found");
    }

    // Get all deals in period
    const openDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const dealsInPeriod = openDeals.filter((deal) => {
      if (!deal.expectedCloseDate) return false;
      return deal.expectedCloseDate >= forecast.startDate &&
             deal.expectedCloseDate <= forecast.endDate;
    });

    // Apply pipeline filter
    const filteredDeals = forecast.pipelineId
      ? dealsInPeriod.filter((d) => d.pipelineId === forecast.pipelineId)
      : dealsInPeriod;

    // Build predictions array
    const predictions: DealPrediction[] = filteredDeals.map((deal) => {
      const probability = deal.probability || 0;
      let category: ForecastCategory;

      if (probability >= 90) category = "committed";
      else if (probability >= 70) category = "best_case";
      else if (probability >= 20) category = "pipeline";
      else category = "omitted";

      return {
        dealId: deal._id,
        dealName: deal.name,
        amount: deal.amount || 0,
        probability,
        predictedCloseDate: deal.expectedCloseDate,
        category,
      };
    });

    const now = Date.now();

    const snapshotId = await ctx.db.insert("forecastSnapshots", {
      forecastId: args.forecastId,
      snapshotDate: now,
      committed: forecast.committed || 0,
      bestCase: forecast.bestCase || 0,
      pipeline: forecast.pipeline || 0,
      closed: forecast.closed || 0,
      predictedTotal: forecast.predictedRevenue,
      confidence: forecast.confidence,
      predictions,
      notes: args.notes,
      createdAt: now,
    });

    return snapshotId;
  },
});

// Delete a forecast
export const deleteForecast = mutation({
  args: { id: v.id("forecasts") },
  handler: async (ctx, args) => {
    // Delete all related snapshots first
    const snapshots = await ctx.db
      .query("forecastSnapshots")
      .withIndex("by_forecast", (q) => q.eq("forecastId", args.id))
      .collect();

    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id);
    }

    // Delete the forecast
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// ============================================================================
// Actions (for AI predictions)
// ============================================================================

// Helper query to get forecast by ID (for actions)
export const getForecastForAction = internalQuery({
  args: { id: v.id("forecasts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Helper query to get deals for forecasting
export const getDealsForForecast = internalQuery({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    pipelineId: v.optional(v.id("pipelines")),
  },
  handler: async (ctx, args) => {
    const openDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const wonDeals = await ctx.db
      .query("deals")
      .withIndex("by_status", (q) => q.eq("status", "won"))
      .collect();

    return { openDeals, wonDeals };
  },
});

// Helper mutation to update forecast with predictions
export const updateForecastPredictions = internalMutation({
  args: {
    forecastId: v.id("forecasts"),
    committed: v.number(),
    bestCase: v.number(),
    pipeline: v.number(),
    closed: v.number(),
    predictedRevenue: v.number(),
    confidence: v.number(),
    predictionFactors: v.array(
      v.object({
        factor: v.string(),
        impact: v.number(),
        description: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { forecastId, ...updates } = args;
    await ctx.db.patch(forecastId, {
      ...updates,
      lastCalculatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Generate AI-powered predictions
export const generatePredictions = action({
  args: {
    forecastId: v.id("forecasts"),
  },
  handler: async (ctx, args): Promise<ForecastCalculation> => {
    // Get the forecast
    const forecast = await ctx.runQuery(internal.forecasting.getForecastForAction, { id: args.forecastId });

    if (!forecast) {
      throw new Error("Forecast not found");
    }

    // Get deals data
    const dealData = await ctx.runQuery(internal.forecasting.getDealsForForecast, {
      startDate: forecast.startDate,
      endDate: forecast.endDate,
      pipelineId: forecast.pipelineId,
    });

    const { openDeals, wonDeals } = dealData;

    // Filter deals in period
    const dealsInPeriod = openDeals.filter((deal) => {
      if (!deal.expectedCloseDate) return false;
      return deal.expectedCloseDate >= forecast.startDate &&
             deal.expectedCloseDate <= forecast.endDate;
    });

    const filteredDeals = forecast.pipelineId
      ? dealsInPeriod.filter((d) => d.pipelineId === forecast.pipelineId)
      : dealsInPeriod;

    // Generate AI predictions for each deal
    const predictions: DealPrediction[] = [];
    let committed = 0;
    let bestCase = 0;
    let pipeline = 0;

    for (const deal of filteredDeals) {
      const baseProbability = deal.probability || 0;
      const amount = deal.amount || 0;

      // AI adjustments based on various factors
      const { adjustedProbability, riskFactors } = analyzeDeals(deal);

      let category: ForecastCategory;
      if (adjustedProbability >= 90) {
        category = "committed";
        committed += amount;
      } else if (adjustedProbability >= 70) {
        category = "best_case";
        bestCase += amount;
      } else if (adjustedProbability >= 20) {
        category = "pipeline";
        pipeline += amount;
      } else {
        category = "omitted";
      }

      predictions.push({
        dealId: deal._id,
        dealName: deal.name,
        amount,
        probability: baseProbability,
        predictedCloseDate: deal.expectedCloseDate,
        category,
        aiAdjustedProbability: adjustedProbability,
        riskFactors,
      });
    }

    // Calculate closed amount
    const closed = wonDeals
      .filter((deal) => {
        if (!deal.actualCloseDate) return false;
        return deal.actualCloseDate >= forecast.startDate &&
               deal.actualCloseDate <= forecast.endDate;
      })
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate predicted revenue using AI-adjusted probabilities
    const weightedPrediction = predictions.reduce((sum, pred) => {
      const adjustedProb = (pred.aiAdjustedProbability || pred.probability) / 100;
      return sum + pred.amount * adjustedProb;
    }, 0);

    const predictedRevenue = closed + weightedPrediction;

    // Generate prediction factors
    const predictionFactors = generatePredictionFactors(predictions, forecast);

    // Calculate overall confidence
    const confidence = calculateAIConfidence(predictions, predictionFactors);

    // Update the forecast with AI predictions
    await ctx.runMutation(internal.forecasting.updateForecastPredictions, {
      forecastId: args.forecastId,
      committed,
      bestCase,
      pipeline,
      closed,
      predictedRevenue,
      confidence,
      predictionFactors,
    });

    return {
      committed,
      bestCase,
      pipeline,
      closed,
      predictedRevenue,
      confidence,
      predictions,
      predictionFactors,
    };
  },
});

// Analyze a deal for AI prediction adjustments
function analyzeDeals(deal: Doc<"deals">): {
  adjustedProbability: number;
  riskFactors: string[]
} {
  const baseProbability = deal.probability || 0;
  let adjustedProbability = baseProbability;
  const riskFactors: string[] = [];

  // Factor 1: Deal age (older deals may be stalling)
  const dealAge = Date.now() - deal.createdAt;
  const ageInDays = dealAge / (1000 * 60 * 60 * 24);
  if (ageInDays > 90) {
    adjustedProbability -= 10;
    riskFactors.push("Deal is older than 90 days");
  } else if (ageInDays > 60) {
    adjustedProbability -= 5;
    riskFactors.push("Deal is aging (60+ days)");
  }

  // Factor 2: Time since last stage change
  const stageStaleDays = (Date.now() - deal.stageChangedAt) / (1000 * 60 * 60 * 24);
  if (stageStaleDays > 30) {
    adjustedProbability -= 15;
    riskFactors.push("No stage movement in 30+ days");
  } else if (stageStaleDays > 14) {
    adjustedProbability -= 5;
    riskFactors.push("Stagnant stage progress");
  }

  // Factor 3: Expected close date approaching
  if (deal.expectedCloseDate) {
    const daysUntilClose = (deal.expectedCloseDate - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilClose < 7 && baseProbability < 80) {
      adjustedProbability -= 10;
      riskFactors.push("Close date imminent but probability low");
    }
  }

  // Factor 4: Deal size relative to typical (would need historical data)
  const amount = deal.amount || 0;
  if (amount > 100000) {
    adjustedProbability -= 5;
    riskFactors.push("Large deal - typically longer sales cycle");
  }

  // Ensure probability stays in valid range
  adjustedProbability = Math.max(0, Math.min(100, adjustedProbability));

  return { adjustedProbability, riskFactors };
}

// Generate prediction factors for transparency
function generatePredictionFactors(
  predictions: DealPrediction[],
  forecast: Doc<"forecasts">
): Array<{ factor: string; impact: number; description: string }> {
  const factors: Array<{ factor: string; impact: number; description: string }> = [];

  // Analyze deal composition
  const committedCount = predictions.filter((p) => p.category === "committed").length;
  const totalCount = predictions.length;
  const committedRatio = totalCount > 0 ? committedCount / totalCount : 0;

  if (committedRatio > 0.5) {
    factors.push({
      factor: "pipeline_quality",
      impact: 15,
      description: "Strong pipeline with majority of deals in committed stage",
    });
  } else if (committedRatio < 0.2) {
    factors.push({
      factor: "pipeline_quality",
      impact: -10,
      description: "Pipeline heavily weighted toward early-stage deals",
    });
  }

  // Analyze risk factors across deals
  const dealWithRisks = predictions.filter((p) => p.riskFactors && p.riskFactors.length > 0);
  if (dealWithRisks.length > totalCount * 0.5) {
    factors.push({
      factor: "deal_health",
      impact: -15,
      description: "Many deals showing risk indicators (stagnation, aging)",
    });
  }

  // Time factor - how much of the period has passed
  const now = Date.now();
  const periodProgress = (now - forecast.startDate) / (forecast.endDate - forecast.startDate);
  if (periodProgress > 0.75) {
    factors.push({
      factor: "time_pressure",
      impact: -5,
      description: "Less than 25% of forecast period remaining",
    });
  } else if (periodProgress < 0.25) {
    factors.push({
      factor: "time_available",
      impact: 5,
      description: "Significant time remaining in forecast period",
    });
  }

  return factors;
}

// Calculate confidence based on AI analysis
function calculateAIConfidence(
  predictions: DealPrediction[],
  factors: Array<{ factor: string; impact: number; description: string }>
): number {
  // Base confidence
  let confidence = 60;

  // Adjust based on prediction factors
  for (const factor of factors) {
    confidence += factor.impact * 0.5;
  }

  // Adjust based on deal count (more data = higher confidence)
  const dealCountBonus = Math.min(15, predictions.length * 0.5);
  confidence += dealCountBonus;

  // Adjust based on how many deals have AI adjustments
  const adjustedDeals = predictions.filter(
    (p) => p.aiAdjustedProbability !== undefined && p.aiAdjustedProbability !== p.probability
  );
  const adjustmentRatio = predictions.length > 0 ? adjustedDeals.length / predictions.length : 0;

  // If many deals needed adjustment, slightly lower confidence
  if (adjustmentRatio > 0.5) {
    confidence -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

// Quick forecast creation helper for common periods
export const createQuickForecast = mutation({
  args: {
    period: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    targetRevenue: v.optional(v.number()),
    pipelineId: v.optional(v.id("pipelines")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let name: string;

    switch (args.period) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        name = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} Forecast`;
        break;
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        name = `Q${quarter + 1} ${now.getFullYear()} Forecast`;
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        name = `${now.getFullYear()} Annual Forecast`;
        break;
    }

    const forecastId = await ctx.db.insert("forecasts", {
      name,
      period: args.period,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      targetRevenue: args.targetRevenue,
      pipelineId: args.pipelineId,
      createdBy: args.createdBy,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return forecastId;
  },
});
