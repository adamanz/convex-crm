import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List all pipelines
 */
export const list = query({
  args: {
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let pipelines = await ctx.db.query("pipelines").order("desc").collect();

    // Filter by owner if specified (include pipelines with no owner as shared)
    if (args.ownerId) {
      pipelines = pipelines.filter(
        (p) => p.ownerId === args.ownerId || p.ownerId === undefined
      );
    }

    // Sort: default pipeline first, then by name
    pipelines.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });

    return pipelines;
  },
});

/**
 * Get a single pipeline by ID
 */
export const get = query({
  args: { id: v.id("pipelines") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get the default pipeline
 */
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const defaultPipeline = await ctx.db
      .query("pipelines")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultPipeline) {
      // Fall back to first pipeline if no default set
      return await ctx.db.query("pipelines").first();
    }

    return defaultPipeline;
  },
});

/**
 * Get pipeline with deal counts and value per stage
 */
export const getWithStats = query({
  args: { id: v.id("pipelines") },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db.get(args.id);
    if (!pipeline) return null;

    // Get all deals in this pipeline
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", args.id))
      .collect();

    // Calculate stats per stage
    const stageCounts: Record<string, { count: number; totalValue: number }> =
      {};
    for (const stage of pipeline.stages) {
      stageCounts[stage.id] = { count: 0, totalValue: 0 };
    }

    for (const deal of deals) {
      if (stageCounts[deal.stageId]) {
        stageCounts[deal.stageId].count++;
        stageCounts[deal.stageId].totalValue += deal.amount ?? 0;
      }
    }

    const stagesWithStats = pipeline.stages.map((stage) => ({
      ...stage,
      dealCount: stageCounts[stage.id]?.count ?? 0,
      totalValue: stageCounts[stage.id]?.totalValue ?? 0,
    }));

    return {
      ...pipeline,
      stages: stagesWithStats,
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new pipeline
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    stages: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        order: v.number(),
        probability: v.optional(v.number()),
      })
    ),
    isDefault: v.optional(v.boolean()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If this is being set as default, unset other defaults
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("pipelines")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    const pipelineId = await ctx.db.insert("pipelines", {
      name: args.name,
      description: args.description,
      stages: args.stages,
      isDefault: args.isDefault ?? false,
      ownerId: args.ownerId,
      createdAt: now,
      updatedAt: now,
    });

    return pipelineId;
  },
});

/**
 * Update a pipeline
 */
export const update = mutation({
  args: {
    id: v.id("pipelines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    stages: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          color: v.string(),
          order: v.number(),
          probability: v.optional(v.number()),
        })
      )
    ),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Pipeline not found");
    }

    // If setting as default, unset other defaults
    if (updates.isDefault === true && !existing.isDefault) {
      const existingDefault = await ctx.db
        .query("pipelines")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (existingDefault && existingDefault._id !== id) {
        await ctx.db.patch(existingDefault._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    // Validate that stage IDs in use aren't being removed
    if (updates.stages) {
      const newStageIds = new Set(updates.stages.map((s) => s.id));

      // Check if any deals reference stages being removed
      const dealsInPipeline = await ctx.db
        .query("deals")
        .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", id))
        .collect();

      for (const deal of dealsInPipeline) {
        if (!newStageIds.has(deal.stageId)) {
          throw new Error(
            `Cannot remove stage "${deal.stageId}" because it has active deals. Move or close the deals first.`
          );
        }
      }
    }

    // Build update object
    const updateData: Partial<Doc<"pipelines">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.stages !== undefined) updateData.stages = updates.stages;
    if (updates.isDefault !== undefined)
      updateData.isDefault = updates.isDefault;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a pipeline (only if no deals reference it)
 */
export const delete_ = mutation({
  args: { id: v.id("pipelines") },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db.get(args.id);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    // Check if any deals use this pipeline
    const dealsInPipeline = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", args.id))
      .first();

    if (dealsInPipeline) {
      throw new Error(
        "Cannot delete pipeline with active deals. Move or close all deals first."
      );
    }

    // If deleting default pipeline, make another one default
    if (pipeline.isDefault) {
      const anotherPipeline = await ctx.db
        .query("pipelines")
        .filter((q) => q.neq(q.field("_id"), args.id))
        .first();

      if (anotherPipeline) {
        await ctx.db.patch(anotherPipeline._id, {
          isDefault: true,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

/**
 * Seed default pipeline if none exists
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if any pipeline exists
    const existingPipeline = await ctx.db.query("pipelines").first();

    if (existingPipeline) {
      return { created: false, pipelineId: existingPipeline._id };
    }

    const now = Date.now();

    // Create default sales pipeline
    const pipelineId = await ctx.db.insert("pipelines", {
      name: "Sales Pipeline",
      description: "Default sales pipeline for tracking deals",
      stages: [
        {
          id: "lead",
          name: "Lead",
          color: "#6B7280",
          order: 0,
          probability: 10,
        },
        {
          id: "qualified",
          name: "Qualified",
          color: "#3B82F6",
          order: 1,
          probability: 25,
        },
        {
          id: "proposal",
          name: "Proposal",
          color: "#8B5CF6",
          order: 2,
          probability: 50,
        },
        {
          id: "negotiation",
          name: "Negotiation",
          color: "#F59E0B",
          order: 3,
          probability: 75,
        },
        {
          id: "closed_won",
          name: "Closed Won",
          color: "#10B981",
          order: 4,
          probability: 100,
        },
        {
          id: "closed_lost",
          name: "Closed Lost",
          color: "#EF4444",
          order: 5,
          probability: 0,
        },
      ],
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    return { created: true, pipelineId };
  },
});

/**
 * Add a stage to an existing pipeline
 */
export const addStage = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    stage: v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
      probability: v.optional(v.number()),
    }),
    afterStageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db.get(args.pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    // Check for duplicate stage ID
    if (pipeline.stages.some((s) => s.id === args.stage.id)) {
      throw new Error(`Stage with ID "${args.stage.id}" already exists`);
    }

    // Determine order
    let newOrder: number;
    const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);

    if (args.afterStageId) {
      const afterIndex = stages.findIndex((s) => s.id === args.afterStageId);
      if (afterIndex === -1) {
        throw new Error(`Stage "${args.afterStageId}" not found`);
      }
      newOrder = stages[afterIndex].order + 0.5;
    } else {
      // Add at the end
      newOrder = stages.length > 0 ? stages[stages.length - 1].order + 1 : 0;
    }

    // Add new stage
    stages.push({
      ...args.stage,
      order: newOrder,
    });

    // Normalize orders
    stages.sort((a, b) => a.order - b.order);
    const normalizedStages = stages.map((s, i) => ({ ...s, order: i }));

    await ctx.db.patch(args.pipelineId, {
      stages: normalizedStages,
      updatedAt: Date.now(),
    });

    return args.pipelineId;
  },
});

/**
 * Remove a stage from a pipeline (moves deals to specified fallback stage)
 */
export const removeStage = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    stageId: v.string(),
    moveDealsToStageId: v.string(),
  },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db.get(args.pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const stageToRemove = pipeline.stages.find((s) => s.id === args.stageId);
    if (!stageToRemove) {
      throw new Error(`Stage "${args.stageId}" not found`);
    }

    const fallbackStage = pipeline.stages.find(
      (s) => s.id === args.moveDealsToStageId
    );
    if (!fallbackStage) {
      throw new Error(`Fallback stage "${args.moveDealsToStageId}" not found`);
    }

    if (args.stageId === args.moveDealsToStageId) {
      throw new Error("Cannot move deals to the stage being removed");
    }

    // Move deals to fallback stage
    const dealsInStage = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) =>
        q.eq("pipelineId", args.pipelineId).eq("stageId", args.stageId)
      )
      .collect();

    const now = Date.now();
    for (const deal of dealsInStage) {
      await ctx.db.patch(deal._id, {
        stageId: args.moveDealsToStageId,
        stageChangedAt: now,
        updatedAt: now,
      });
    }

    // Remove stage and normalize orders
    const remainingStages = pipeline.stages
      .filter((s) => s.id !== args.stageId)
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ ...s, order: i }));

    await ctx.db.patch(args.pipelineId, {
      stages: remainingStages,
      updatedAt: now,
    });

    return { pipelineId: args.pipelineId, dealsMoved: dealsInStage.length };
  },
});

/**
 * Reorder stages in a pipeline
 */
export const reorderStages = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    stageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db.get(args.pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    // Validate all stage IDs exist
    const existingIds = new Set(pipeline.stages.map((s) => s.id));
    for (const stageId of args.stageIds) {
      if (!existingIds.has(stageId)) {
        throw new Error(`Stage "${stageId}" not found in pipeline`);
      }
    }

    if (args.stageIds.length !== pipeline.stages.length) {
      throw new Error("Must provide all stage IDs in the new order");
    }

    // Create a map for quick lookup
    const stageMap = new Map(pipeline.stages.map((s) => [s.id, s]));

    // Reorder stages
    const reorderedStages = args.stageIds.map((id, index) => ({
      ...stageMap.get(id)!,
      order: index,
    }));

    await ctx.db.patch(args.pipelineId, {
      stages: reorderedStages,
      updatedAt: Date.now(),
    });

    return args.pipelineId;
  },
});
