import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// DEALS - Query and Mutation Functions
// ============================================================================

/**
 * Get deals grouped by stage for Kanban board view
 */
export const byPipeline = query({
  args: {
    pipelineId: v.id("pipelines"),
    ownerId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
  },
  handler: async (ctx, args) => {
    const { pipelineId, ownerId, status } = args;

    // Get the pipeline with its stages
    const pipeline = await ctx.db.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    // Get all deals for this pipeline
    let dealsQuery = ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", pipelineId));

    const allDeals = await dealsQuery.collect();

    // Apply filters
    let filteredDeals = allDeals;

    if (ownerId) {
      filteredDeals = filteredDeals.filter((deal) => deal.ownerId === ownerId);
    }

    if (status) {
      filteredDeals = filteredDeals.filter((deal) => deal.status === status);
    }

    // Fetch related data for all deals
    const dealsWithRelations = await Promise.all(
      filteredDeals.map(async (deal) => {
        let company: Doc<"companies"> | null = null;
        if (deal.companyId) {
          company = await ctx.db.get(deal.companyId);
        }

        const contacts = await Promise.all(
          deal.contactIds.map((contactId) => ctx.db.get(contactId))
        );

        let owner: Doc<"users"> | null = null;
        if (deal.ownerId) {
          owner = await ctx.db.get(deal.ownerId);
        }

        return {
          ...deal,
          company,
          contacts: contacts.filter((c): c is Doc<"contacts"> => c !== null),
          owner,
        };
      })
    );

    // Group deals by stage
    const dealsByStage: Record<string, typeof dealsWithRelations> = {};

    // Initialize all stages (even empty ones)
    for (const stage of pipeline.stages) {
      dealsByStage[stage.id] = [];
    }

    // Populate with deals
    for (const deal of dealsWithRelations) {
      if (dealsByStage[deal.stageId]) {
        dealsByStage[deal.stageId].push(deal);
      }
    }

    // Sort deals within each stage by stageChangedAt
    for (const stageId of Object.keys(dealsByStage)) {
      dealsByStage[stageId].sort((a, b) => b.stageChangedAt - a.stageChangedAt);
    }

    // Calculate stage totals
    const stageTotals: Record<string, { count: number; value: number }> = {};
    for (const stage of pipeline.stages) {
      const stageDeals = dealsByStage[stage.id];
      stageTotals[stage.id] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
      };
    }

    return {
      pipeline,
      stages: pipeline.stages,
      dealsByStage,
      stageTotals,
      totalDeals: filteredDeals.length,
      totalValue: filteredDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
    };
  },
});

/**
 * List deals with pagination and optional filtering
 */
export const list = query({
  args: {
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
    filter: v.optional(
      v.object({
        pipelineId: v.optional(v.id("pipelines")),
        stageId: v.optional(v.string()),
        companyId: v.optional(v.id("companies")),
        ownerId: v.optional(v.id("users")),
        status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filter } = args;

    let dealsQuery;

    // Use appropriate index based on filter
    if (filter?.pipelineId && filter?.stageId) {
      dealsQuery = ctx.db
        .query("deals")
        .withIndex("by_pipeline_stage", (q) =>
          q.eq("pipelineId", filter.pipelineId!).eq("stageId", filter.stageId!)
        );
    } else if (filter?.companyId) {
      dealsQuery = ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", filter.companyId));
    } else if (filter?.ownerId) {
      dealsQuery = ctx.db
        .query("deals")
        .withIndex("by_owner", (q) => q.eq("ownerId", filter.ownerId));
    } else if (filter?.status) {
      dealsQuery = ctx.db
        .query("deals")
        .withIndex("by_status", (q) => q.eq("status", filter.status!));
    } else {
      dealsQuery = ctx.db.query("deals").withIndex("by_created");
    }

    // Get paginated results
    const results = await dealsQuery
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    // Apply post-query filters
    let filteredPage = results.page;

    if (filter?.tags && filter.tags.length > 0) {
      filteredPage = filteredPage.filter((deal) =>
        filter.tags!.some((tag) => deal.tags.includes(tag))
      );
    }

    // Fetch related data
    const dealsWithRelations = await Promise.all(
      filteredPage.map(async (deal) => {
        let company: Doc<"companies"> | null = null;
        if (deal.companyId) {
          company = await ctx.db.get(deal.companyId);
        }

        let pipeline: Doc<"pipelines"> | null = null;
        pipeline = await ctx.db.get(deal.pipelineId);

        const stage = pipeline?.stages.find((s) => s.id === deal.stageId);

        return {
          ...deal,
          company,
          pipeline,
          stageName: stage?.name ?? "Unknown",
          stageColor: stage?.color ?? "#gray",
        };
      })
    );

    return {
      page: dealsWithRelations,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get a single deal by ID with all related data
 */
export const get = query({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      return null;
    }

    // Fetch company
    let company: Doc<"companies"> | null = null;
    if (deal.companyId) {
      company = await ctx.db.get(deal.companyId);
    }

    // Fetch contacts
    const contacts = await Promise.all(
      deal.contactIds.map((contactId) => ctx.db.get(contactId))
    );

    // Fetch pipeline and stage info
    const pipeline = await ctx.db.get(deal.pipelineId);
    const stage = pipeline?.stages.find((s) => s.id === deal.stageId);

    // Fetch owner
    let owner: Doc<"users"> | null = null;
    if (deal.ownerId) {
      owner = await ctx.db.get(deal.ownerId);
    }

    // Fetch related activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", "deal").eq("relatedToId", args.id)
      )
      .order("desc")
      .take(20);

    // Get deal history from activity log
    const history = await ctx.db
      .query("activityLog")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", "deal").eq("entityId", args.id)
      )
      .order("desc")
      .take(50);

    return {
      ...deal,
      company,
      contacts: contacts.filter((c): c is Doc<"contacts"> => c !== null),
      pipeline,
      stage: stage ?? null,
      stageName: stage?.name ?? "Unknown",
      stageColor: stage?.color ?? "#gray",
      owner,
      activities,
      history,
    };
  },
});

/**
 * Search deals by name (simple text search)
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    pipelineId: v.optional(v.id("pipelines")),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, pipelineId, status, limit = 20 } = args;
    const searchLower = searchTerm.toLowerCase();

    // Get base query
    let deals;
    if (pipelineId) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", pipelineId))
        .collect();
    } else {
      deals = await ctx.db.query("deals").collect();
    }

    // Filter by search term and status
    let filtered = deals.filter((deal) =>
      deal.name.toLowerCase().includes(searchLower)
    );

    if (status) {
      filtered = filtered.filter((deal) => deal.status === status);
    }

    // Limit results
    const limitedDeals = filtered.slice(0, limit);

    // Fetch related data
    const dealsWithRelations = await Promise.all(
      limitedDeals.map(async (deal) => {
        let company: Doc<"companies"> | null = null;
        if (deal.companyId) {
          company = await ctx.db.get(deal.companyId);
        }

        const pipeline = await ctx.db.get(deal.pipelineId);
        const stage = pipeline?.stages.find((s) => s.id === deal.stageId);

        return {
          ...deal,
          company,
          stageName: stage?.name ?? "Unknown",
          stageColor: stage?.color ?? "#gray",
        };
      })
    );

    return dealsWithRelations;
  },
});

/**
 * Create a new deal
 */
export const create = mutation({
  args: {
    name: v.string(),
    companyId: v.optional(v.id("companies")),
    contactIds: v.optional(v.array(v.id("contacts"))),
    pipelineId: v.id("pipelines"),
    stageId: v.string(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate pipeline exists and stage is valid
    const pipeline = await ctx.db.get(args.pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const stageExists = pipeline.stages.some((s) => s.id === args.stageId);
    if (!stageExists) {
      throw new Error("Invalid stage for this pipeline");
    }

    // Validate company exists if provided
    if (args.companyId) {
      const company = await ctx.db.get(args.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate contacts exist if provided
    if (args.contactIds && args.contactIds.length > 0) {
      for (const contactId of args.contactIds) {
        const contact = await ctx.db.get(contactId);
        if (!contact) {
          throw new Error(`Contact ${contactId} not found`);
        }
      }
    }

    // Validate owner exists if provided
    if (args.ownerId) {
      const owner = await ctx.db.get(args.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    const dealId = await ctx.db.insert("deals", {
      name: args.name,
      companyId: args.companyId,
      contactIds: args.contactIds ?? [],
      pipelineId: args.pipelineId,
      stageId: args.stageId,
      amount: args.amount,
      currency: args.currency ?? "USD",
      probability: args.probability,
      expectedCloseDate: args.expectedCloseDate,
      status: args.status ?? "open",
      ownerId: args.ownerId,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
      stageChangedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "deal_created",
      entityType: "deal",
      entityId: dealId,
      metadata: {
        pipelineId: args.pipelineId,
        stageId: args.stageId,
        amount: args.amount,
      },
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const newDeal = await ctx.db.get(dealId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "deal.created",
      payload: {
        deal: newDeal,
      },
    });

    return dealId;
  },
});

/**
 * Update an existing deal
 */
export const update = mutation({
  args: {
    id: v.id("deals"),
    name: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    contactIds: v.optional(v.array(v.id("contacts"))),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    probability: v.optional(v.number()),
    expectedCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("open"), v.literal("won"), v.literal("lost"))),
    lostReason: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check deal exists
    const existingDeal = await ctx.db.get(id);
    if (!existingDeal) {
      throw new Error("Deal not found");
    }

    // Validate company exists if being updated
    if (updates.companyId !== undefined && updates.companyId !== null) {
      const company = await ctx.db.get(updates.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate contacts exist if being updated
    if (updates.contactIds && updates.contactIds.length > 0) {
      for (const contactId of updates.contactIds) {
        const contact = await ctx.db.get(contactId);
        if (!contact) {
          throw new Error(`Contact ${contactId} not found`);
        }
      }
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined && updates.ownerId !== null) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Handle status changes
    const statusChanged = updates.status && updates.status !== existingDeal.status;
    let finalActualCloseDate = updates.actualCloseDate;
    if (statusChanged) {
      if (updates.status === "won" || updates.status === "lost") {
        finalActualCloseDate = now;
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"deals">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.companyId !== undefined) updateData.companyId = updates.companyId;
    if (updates.contactIds !== undefined) updateData.contactIds = updates.contactIds;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.expectedCloseDate !== undefined) updateData.expectedCloseDate = updates.expectedCloseDate;
    if (finalActualCloseDate !== undefined) updateData.actualCloseDate = finalActualCloseDate;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.lostReason !== undefined) updateData.lostReason = updates.lostReason;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "deal_updated",
      entityType: "deal",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const updatedDeal = await ctx.db.get(id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "deal.updated",
      payload: {
        deal: updatedDeal,
        changes: updates,
      },
    });

    return id;
  },
});

/**
 * Move deal to a different stage (optimized for Kanban drag-and-drop)
 */
export const moveToStage = mutation({
  args: {
    id: v.id("deals"),
    stageId: v.string(),
    pipelineId: v.optional(v.id("pipelines")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check deal exists
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const targetPipelineId = args.pipelineId ?? deal.pipelineId;

    // Validate pipeline and stage
    const pipeline = await ctx.db.get(targetPipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const newStage = pipeline.stages.find((s) => s.id === args.stageId);
    if (!newStage) {
      throw new Error("Invalid stage for this pipeline");
    }

    const oldStageId = deal.stageId;
    const oldStage = pipeline.stages.find((s) => s.id === oldStageId);

    // Update the deal
    await ctx.db.patch(args.id, {
      stageId: args.stageId,
      pipelineId: targetPipelineId,
      stageChangedAt: now,
      updatedAt: now,
      // Update probability if stage has a default probability
      ...(newStage.probability !== undefined && {
        probability: newStage.probability,
      }),
    });

    // Log the stage change
    await ctx.db.insert("activityLog", {
      action: "deal_stage_changed",
      entityType: "deal",
      entityId: args.id,
      changes: {
        from: {
          stageId: oldStageId,
          stageName: oldStage?.name ?? "Unknown",
        },
        to: {
          stageId: args.stageId,
          stageName: newStage.name,
        },
      },
      timestamp: now,
      system: true,
    });

    // Trigger webhook for stage change
    const updatedDeal = await ctx.db.get(args.id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "deal.stage_changed",
      payload: {
        deal: updatedDeal,
        previousStage: {
          id: oldStageId,
          name: oldStage?.name ?? "Unknown",
        },
        newStage: {
          id: args.stageId,
          name: newStage.name,
        },
      },
    });

    return args.id;
  },
});

/**
 * Delete a deal (soft delete via status or hard delete)
 */
export const delete_ = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check deal exists
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "deal_deleted",
      entityType: "deal",
      entityId: args.id,
      metadata: {
        deletedDeal: {
          name: deal.name,
          amount: deal.amount,
          status: deal.status,
        },
      },
      timestamp: now,
      system: true,
    });

    // Delete related activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", "deal").eq("relatedToId", args.id)
      )
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete the deal
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Get deals by contact
 */
export const byContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    // We need to scan all deals since contactIds is an array
    const allDeals = await ctx.db.query("deals").collect();

    const contactDeals = allDeals.filter((deal) =>
      deal.contactIds.includes(args.contactId)
    );

    // Fetch related data
    const dealsWithRelations = await Promise.all(
      contactDeals.map(async (deal) => {
        let company: Doc<"companies"> | null = null;
        if (deal.companyId) {
          company = await ctx.db.get(deal.companyId);
        }

        const pipeline = await ctx.db.get(deal.pipelineId);
        const stage = pipeline?.stages.find((s) => s.id === deal.stageId);

        return {
          ...deal,
          company,
          pipeline,
          stageName: stage?.name ?? "Unknown",
          stageColor: stage?.color ?? "#gray",
        };
      })
    );

    return dealsWithRelations;
  },
});

/**
 * Get deal statistics for a pipeline
 */
export const getPipelineStats = query({
  args: {
    pipelineId: v.id("pipelines"),
    dateRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { pipelineId, dateRange } = args;

    const pipeline = await ctx.db.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    let deals = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) => q.eq("pipelineId", pipelineId))
      .collect();

    // Apply date filter if provided
    if (dateRange) {
      deals = deals.filter(
        (deal) =>
          deal.createdAt >= dateRange.start && deal.createdAt <= dateRange.end
      );
    }

    const openDeals = deals.filter((d) => d.status === "open");
    const wonDeals = deals.filter((d) => d.status === "won");
    const lostDeals = deals.filter((d) => d.status === "lost");

    // Calculate average deal size
    const dealsWithAmount = deals.filter((d) => d.amount !== undefined);
    const avgDealSize =
      dealsWithAmount.length > 0
        ? dealsWithAmount.reduce((sum, d) => sum + (d.amount ?? 0), 0) /
          dealsWithAmount.length
        : 0;

    // Calculate win rate
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

    // Calculate stage conversion rates
    const stageStats = pipeline.stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stageId === stage.id);
      return {
        stageId: stage.id,
        stageName: stage.name,
        stageColor: stage.color,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      };
    });

    return {
      totalDeals: deals.length,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      totalValue: deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      openValue: openDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      wonValue: wonDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      avgDealSize,
      winRate,
      stageStats,
    };
  },
});

/**
 * Add a contact to a deal
 */
export const addContact = mutation({
  args: {
    dealId: v.id("deals"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Check if contact is already on the deal
    if (deal.contactIds.includes(args.contactId)) {
      throw new Error("Contact is already associated with this deal");
    }

    await ctx.db.patch(args.dealId, {
      contactIds: [...deal.contactIds, args.contactId],
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "deal_contact_added",
      entityType: "deal",
      entityId: args.dealId,
      metadata: {
        contactId: args.contactId,
        contactName: `${contact.firstName ?? ""} ${contact.lastName}`.trim(),
      },
      timestamp: now,
      system: true,
    });

    return args.dealId;
  },
});

/**
 * Remove a contact from a deal
 */
export const removeContact = mutation({
  args: {
    dealId: v.id("deals"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Check if contact is on the deal
    if (!deal.contactIds.includes(args.contactId)) {
      throw new Error("Contact is not associated with this deal");
    }

    await ctx.db.patch(args.dealId, {
      contactIds: deal.contactIds.filter((id) => id !== args.contactId),
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "deal_contact_removed",
      entityType: "deal",
      entityId: args.dealId,
      metadata: {
        contactId: args.contactId,
      },
      timestamp: now,
      system: true,
    });

    return args.dealId;
  },
});

/**
 * Mark deal as won
 */
export const markWon = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "won",
      actualCloseDate: now,
      probability: 100,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      action: "deal_won",
      entityType: "deal",
      entityId: args.id,
      metadata: {
        amount: deal.amount,
      },
      system: true,
      timestamp: now,
    });

    // Trigger webhook
    const wonDeal = await ctx.db.get(args.id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "deal.won",
      payload: {
        deal: wonDeal,
        amount: deal.amount,
      },
    });

    return args.id;
  },
});

/**
 * Mark deal as lost
 */
export const markLost = mutation({
  args: {
    id: v.id("deals"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      throw new Error("Deal not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "lost",
      lostReason: args.reason,
      actualCloseDate: now,
      probability: 0,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      action: "deal_lost",
      entityType: "deal",
      entityId: args.id,
      metadata: {
        reason: args.reason,
        amount: deal.amount,
      },
      system: true,
      timestamp: now,
    });

    // Trigger webhook
    const lostDeal = await ctx.db.get(args.id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "deal.lost",
      payload: {
        deal: lostDeal,
        reason: args.reason,
        amount: deal.amount,
      },
    });

    return args.id;
  },
});

/**
 * Reopen a closed deal
 */
export const reopen = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.id);
    if (!deal) {
      throw new Error("Deal not found");
    }

    if (deal.status === "open") {
      throw new Error("Deal is already open");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "open",
      actualCloseDate: undefined,
      lostReason: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      action: "deal_reopened",
      entityType: "deal",
      entityId: args.id,
      metadata: {
        previousStatus: deal.status,
      },
      system: true,
      timestamp: now,
    });

    return args.id;
  },
});
