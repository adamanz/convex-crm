import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// CAMPAIGNS - Query and Mutation Functions
// ============================================================================

/**
 * List campaigns with pagination and optional filtering
 */
export const list = query({
  args: {
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
    filter: v.optional(
      v.object({
        status: v.optional(
          v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("paused"),
            v.literal("completed")
          )
        ),
        type: v.optional(
          v.union(
            v.literal("email"),
            v.literal("social"),
            v.literal("ads"),
            v.literal("event"),
            v.literal("referral"),
            v.literal("other")
          )
        ),
        ownerId: v.optional(v.id("users")),
        isActive: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filter } = args;

    let campaignsQuery;

    // Use appropriate index based on filter
    if (filter?.status) {
      campaignsQuery = ctx.db
        .query("campaigns")
        .withIndex("by_status", (q) => q.eq("status", filter.status!));
    } else if (filter?.type) {
      campaignsQuery = ctx.db
        .query("campaigns")
        .withIndex("by_type", (q) => q.eq("type", filter.type!));
    } else if (filter?.ownerId) {
      campaignsQuery = ctx.db
        .query("campaigns")
        .withIndex("by_owner", (q) => q.eq("ownerId", filter.ownerId));
    } else if (filter?.isActive !== undefined) {
      campaignsQuery = ctx.db
        .query("campaigns")
        .withIndex("by_active", (q) => q.eq("isActive", filter.isActive!));
    } else {
      campaignsQuery = ctx.db.query("campaigns").withIndex("by_created");
    }

    // Get paginated results
    const results = await campaignsQuery
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    // Fetch owner info for each campaign
    const campaignsWithOwner = await Promise.all(
      results.page.map(async (campaign) => {
        let owner: Doc<"users"> | null = null;
        if (campaign.ownerId) {
          owner = await ctx.db.get(campaign.ownerId);
        }
        return {
          ...campaign,
          owner,
        };
      })
    );

    return {
      page: campaignsWithOwner,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get a single campaign by ID with all related data
 */
export const get = query({
  args: {
    id: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      return null;
    }

    // Fetch owner
    let owner: Doc<"users"> | null = null;
    if (campaign.ownerId) {
      owner = await ctx.db.get(campaign.ownerId);
    }

    // Fetch member stats
    const members = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .collect();

    const sentCount = members.filter((m) => m.status === "sent").length;
    const respondedCount = members.filter((m) => m.status === "responded").length;
    const convertedCount = members.filter((m) => m.status === "converted").length;

    // Fetch recent stats
    const recentStats = await ctx.db
      .query("campaignStats")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .order("desc")
      .take(30);

    return {
      ...campaign,
      owner,
      memberStats: {
        total: members.length,
        sent: sentCount,
        responded: respondedCount,
        converted: convertedCount,
        responseRate: members.length > 0 ? (respondedCount / members.length) * 100 : 0,
        conversionRate: members.length > 0 ? (convertedCount / members.length) * 100 : 0,
      },
      recentStats,
    };
  },
});

/**
 * Create a new campaign
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("ads"),
      v.literal("event"),
      v.literal("referral"),
      v.literal("other")
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    goals: v.optional(
      v.object({
        impressions: v.optional(v.number()),
        clicks: v.optional(v.number()),
        leads: v.optional(v.number()),
        revenue: v.optional(v.number()),
      })
    ),
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

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      type: args.type,
      status: args.status ?? "draft",
      startDate: args.startDate,
      endDate: args.endDate,
      budget: args.budget,
      actualSpend: 0,
      currency: args.currency ?? "USD",
      ownerId: args.ownerId,
      goals: args.goals,
      memberCount: 0,
      convertedCount: 0,
      totalRevenue: 0,
      isActive: args.status === "active",
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "campaign_created",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        name: args.name,
        type: args.type,
      },
      timestamp: now,
      system: true,
    });

    return campaignId;
  },
});

/**
 * Update an existing campaign
 */
export const update = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("email"),
        v.literal("social"),
        v.literal("ads"),
        v.literal("event"),
        v.literal("referral"),
        v.literal("other")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    actualSpend: v.optional(v.number()),
    currency: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    goals: v.optional(
      v.object({
        impressions: v.optional(v.number()),
        clicks: v.optional(v.number()),
        leads: v.optional(v.number()),
        revenue: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check campaign exists
    const existingCampaign = await ctx.db.get(id);
    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined && updates.ownerId !== null) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Build update object
    const updateData: Partial<Doc<"campaigns">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      updateData.isActive = updates.status === "active";
    }
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.actualSpend !== undefined) updateData.actualSpend = updates.actualSpend;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.goals !== undefined) updateData.goals = updates.goals;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "campaign_updated",
      entityType: "campaign",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete a campaign
 */
export const deleteCampaign = mutation({
  args: {
    id: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check campaign exists
    const campaign = await ctx.db.get(args.id);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Delete all campaign members
    const members = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all campaign stats
    const stats = await ctx.db
      .query("campaignStats")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .collect();

    for (const stat of stats) {
      await ctx.db.delete(stat._id);
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "campaign_deleted",
      entityType: "campaign",
      entityId: args.id,
      metadata: {
        deletedCampaign: {
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
        },
      },
      timestamp: now,
      system: true,
    });

    // Delete the campaign
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Add members to a campaign
 */
export const addMembers = mutation({
  args: {
    campaignId: v.id("campaigns"),
    contactIds: v.array(v.id("contacts")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check campaign exists
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    let addedCount = 0;

    for (const contactId of args.contactIds) {
      // Check contact exists
      const contact = await ctx.db.get(contactId);
      if (!contact) {
        continue; // Skip non-existent contacts
      }

      // Check if contact is already a member
      const existingMember = await ctx.db
        .query("campaignMembers")
        .withIndex("by_campaign_contact", (q) =>
          q.eq("campaignId", args.campaignId).eq("contactId", contactId)
        )
        .first();

      if (existingMember) {
        continue; // Skip already added contacts
      }

      // Add the member
      await ctx.db.insert("campaignMembers", {
        campaignId: args.campaignId,
        contactId,
        status: "sent",
        source: args.source ?? "manual",
        addedAt: now,
      });

      addedCount++;
    }

    // Update campaign member count
    await ctx.db.patch(args.campaignId, {
      memberCount: campaign.memberCount + addedCount,
      updatedAt: now,
    });

    return { addedCount };
  },
});

/**
 * Remove a member from a campaign
 */
export const removeMember = mutation({
  args: {
    campaignId: v.id("campaigns"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check campaign exists
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Find the member
    const member = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign_contact", (q) =>
        q.eq("campaignId", args.campaignId).eq("contactId", args.contactId)
      )
      .first();

    if (!member) {
      throw new Error("Member not found in campaign");
    }

    // Delete the member
    await ctx.db.delete(member._id);

    // Update campaign counts
    const updates: Partial<Doc<"campaigns">> = {
      memberCount: Math.max(0, campaign.memberCount - 1),
      updatedAt: now,
    };

    if (member.status === "converted") {
      updates.convertedCount = Math.max(0, campaign.convertedCount - 1);
      updates.totalRevenue = campaign.totalRevenue - (member.attributedRevenue ?? 0);
    }

    await ctx.db.patch(args.campaignId, updates);

    return { success: true };
  },
});

/**
 * Update member status
 */
export const updateMemberStatus = mutation({
  args: {
    campaignId: v.id("campaigns"),
    contactId: v.id("contacts"),
    status: v.union(
      v.literal("sent"),
      v.literal("responded"),
      v.literal("converted")
    ),
    attributedDealId: v.optional(v.id("deals")),
    attributedRevenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the member
    const member = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign_contact", (q) =>
        q.eq("campaignId", args.campaignId).eq("contactId", args.contactId)
      )
      .first();

    if (!member) {
      throw new Error("Member not found in campaign");
    }

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const oldStatus = member.status;

    // Build update object
    const memberUpdate: Partial<Doc<"campaignMembers">> = {
      status: args.status,
    };

    if (args.status === "responded" && !member.firstResponseAt) {
      memberUpdate.firstResponseAt = now;
    }

    if (args.status === "converted") {
      memberUpdate.convertedAt = now;
      if (args.attributedDealId) {
        memberUpdate.attributedDealId = args.attributedDealId;
      }
      if (args.attributedRevenue !== undefined) {
        memberUpdate.attributedRevenue = args.attributedRevenue;
      }
    }

    await ctx.db.patch(member._id, memberUpdate);

    // Update campaign stats if status changed to/from converted
    const campaignUpdates: Partial<Doc<"campaigns">> = {
      updatedAt: now,
    };

    if (args.status === "converted" && oldStatus !== "converted") {
      campaignUpdates.convertedCount = campaign.convertedCount + 1;
      if (args.attributedRevenue) {
        campaignUpdates.totalRevenue = campaign.totalRevenue + args.attributedRevenue;
      }
    } else if (oldStatus === "converted" && args.status !== "converted") {
      campaignUpdates.convertedCount = Math.max(0, campaign.convertedCount - 1);
      if (member.attributedRevenue) {
        campaignUpdates.totalRevenue = campaign.totalRevenue - member.attributedRevenue;
      }
    }

    await ctx.db.patch(args.campaignId, campaignUpdates);

    return { success: true };
  },
});

/**
 * Get campaign members with pagination
 */
export const getMembers = query({
  args: {
    campaignId: v.id("campaigns"),
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
    status: v.optional(
      v.union(
        v.literal("sent"),
        v.literal("responded"),
        v.literal("converted")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { campaignId, paginationOpts, status } = args;

    let membersQuery;

    if (status) {
      membersQuery = ctx.db
        .query("campaignMembers")
        .withIndex("by_campaign_status", (q) =>
          q.eq("campaignId", campaignId).eq("status", status)
        );
    } else {
      membersQuery = ctx.db
        .query("campaignMembers")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId));
    }

    const results = await membersQuery.paginate({
      cursor: paginationOpts.cursor ?? null,
      numItems: paginationOpts.numItems,
    });

    // Fetch contact details for each member
    const membersWithContacts = await Promise.all(
      results.page.map(async (member) => {
        const contact = await ctx.db.get(member.contactId);
        let deal: Doc<"deals"> | null = null;
        if (member.attributedDealId) {
          deal = await ctx.db.get(member.attributedDealId);
        }
        return {
          ...member,
          contact,
          deal,
        };
      })
    );

    return {
      page: membersWithContacts,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get campaign statistics (aggregate)
 */
export const getStats = query({
  args: {
    campaignId: v.id("campaigns"),
    dateRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { campaignId, dateRange } = args;

    const campaign = await ctx.db.get(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get stats within date range if provided
    let statsQuery = ctx.db
      .query("campaignStats")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId));

    let stats = await statsQuery.collect();

    if (dateRange) {
      stats = stats.filter(
        (stat) => stat.date >= dateRange.start && stat.date <= dateRange.end
      );
    }

    // Aggregate stats
    const aggregated = stats.reduce(
      (acc, stat) => ({
        impressions: acc.impressions + (stat.impressions ?? 0),
        clicks: acc.clicks + (stat.clicks ?? 0),
        leads: acc.leads + (stat.leads ?? 0),
        conversions: acc.conversions + (stat.conversions ?? 0),
        revenue: acc.revenue + (stat.revenue ?? 0),
        spend: acc.spend + (stat.spend ?? 0),
      }),
      { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, spend: 0 }
    );

    // Calculate rates
    const clickRate = aggregated.impressions > 0
      ? (aggregated.clicks / aggregated.impressions) * 100
      : 0;
    const conversionRate = aggregated.clicks > 0
      ? (aggregated.conversions / aggregated.clicks) * 100
      : 0;
    const costPerClick = aggregated.clicks > 0
      ? aggregated.spend / aggregated.clicks
      : 0;
    const costPerConversion = aggregated.conversions > 0
      ? aggregated.spend / aggregated.conversions
      : 0;

    return {
      ...aggregated,
      clickRate,
      conversionRate,
      costPerClick,
      costPerConversion,
      dailyStats: stats.sort((a, b) => a.date - b.date),
    };
  },
});

/**
 * Calculate campaign ROI
 */
export const getROI = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const spent = campaign.actualSpend ?? 0;
    const revenue = campaign.totalRevenue;

    const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
    const costPerConversion = campaign.convertedCount > 0
      ? spent / campaign.convertedCount
      : 0;
    const revenuePerMember = campaign.memberCount > 0
      ? revenue / campaign.memberCount
      : 0;

    // Get goal progress
    const goalProgress = campaign.goals
      ? {
          impressions: campaign.goals.impressions
            ? { goal: campaign.goals.impressions, current: 0, percentage: 0 }
            : null,
          clicks: campaign.goals.clicks
            ? { goal: campaign.goals.clicks, current: 0, percentage: 0 }
            : null,
          leads: campaign.goals.leads
            ? {
                goal: campaign.goals.leads,
                current: campaign.memberCount,
                percentage: (campaign.memberCount / campaign.goals.leads) * 100,
              }
            : null,
          revenue: campaign.goals.revenue
            ? {
                goal: campaign.goals.revenue,
                current: revenue,
                percentage: (revenue / campaign.goals.revenue) * 100,
              }
            : null,
        }
      : null;

    return {
      spent,
      revenue,
      profit: revenue - spent,
      roi,
      costPerConversion,
      revenuePerMember,
      conversionRate: campaign.memberCount > 0
        ? (campaign.convertedCount / campaign.memberCount) * 100
        : 0,
      goalProgress,
      budgetUtilization: campaign.budget && campaign.budget > 0
        ? (spent / campaign.budget) * 100
        : null,
    };
  },
});

/**
 * Get top performing campaigns
 */
export const getTopPerforming = query({
  args: {
    limit: v.optional(v.number()),
    metric: v.optional(
      v.union(
        v.literal("revenue"),
        v.literal("conversions"),
        v.literal("roi"),
        v.literal("conversionRate")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const metric = args.metric ?? "revenue";

    // Get all active campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate metrics for each campaign
    const campaignsWithMetrics = campaigns.map((campaign) => {
      const spent = campaign.actualSpend ?? 0;
      const roi = spent > 0 ? ((campaign.totalRevenue - spent) / spent) * 100 : 0;
      const conversionRate = campaign.memberCount > 0
        ? (campaign.convertedCount / campaign.memberCount) * 100
        : 0;

      return {
        ...campaign,
        roi,
        conversionRate,
      };
    });

    // Sort by selected metric
    const sorted = campaignsWithMetrics.sort((a, b) => {
      switch (metric) {
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "conversions":
          return b.convertedCount - a.convertedCount;
        case "roi":
          return b.roi - a.roi;
        case "conversionRate":
          return b.conversionRate - a.conversionRate;
        default:
          return b.totalRevenue - a.totalRevenue;
      }
    });

    return sorted.slice(0, limit);
  },
});

/**
 * Attribute a conversion to a campaign (link deal to campaign)
 */
export const attributeConversion = mutation({
  args: {
    dealId: v.id("deals"),
    campaignId: v.id("campaigns"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify deal exists and get its value
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    // Verify campaign exists
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Find or create campaign member
    let member = await ctx.db
      .query("campaignMembers")
      .withIndex("by_campaign_contact", (q) =>
        q.eq("campaignId", args.campaignId).eq("contactId", args.contactId)
      )
      .first();

    const dealAmount = deal.amount ?? 0;

    if (member) {
      // Update existing member
      await ctx.db.patch(member._id, {
        status: "converted",
        convertedAt: now,
        attributedDealId: args.dealId,
        attributedRevenue: dealAmount,
      });

      // Update campaign stats (only if not already converted)
      if (member.status !== "converted") {
        await ctx.db.patch(args.campaignId, {
          convertedCount: campaign.convertedCount + 1,
          totalRevenue: campaign.totalRevenue + dealAmount,
          updatedAt: now,
        });
      } else {
        // Update revenue difference if already converted
        const oldRevenue = member.attributedRevenue ?? 0;
        await ctx.db.patch(args.campaignId, {
          totalRevenue: campaign.totalRevenue - oldRevenue + dealAmount,
          updatedAt: now,
        });
      }
    } else {
      // Create new member as converted
      await ctx.db.insert("campaignMembers", {
        campaignId: args.campaignId,
        contactId: args.contactId,
        status: "converted",
        source: "deal_attribution",
        addedAt: now,
        convertedAt: now,
        attributedDealId: args.dealId,
        attributedRevenue: dealAmount,
      });

      // Update campaign stats
      await ctx.db.patch(args.campaignId, {
        memberCount: campaign.memberCount + 1,
        convertedCount: campaign.convertedCount + 1,
        totalRevenue: campaign.totalRevenue + dealAmount,
        updatedAt: now,
      });
    }

    // Update deal with campaign attribution
    await ctx.db.patch(args.dealId, {
      campaignId: args.campaignId,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "deal_attributed_to_campaign",
      entityType: "deal",
      entityId: args.dealId,
      metadata: {
        campaignId: args.campaignId,
        campaignName: campaign.name,
        dealAmount,
      },
      timestamp: now,
      system: true,
    });

    return { success: true };
  },
});

/**
 * Record daily campaign stats
 */
export const recordDailyStats = mutation({
  args: {
    campaignId: v.id("campaigns"),
    date: v.number(),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    leads: v.optional(v.number()),
    conversions: v.optional(v.number()),
    revenue: v.optional(v.number()),
    spend: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check campaign exists
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Check if stats already exist for this date
    const existingStats = await ctx.db
      .query("campaignStats")
      .withIndex("by_campaign_date", (q) =>
        q.eq("campaignId", args.campaignId).eq("date", args.date)
      )
      .first();

    // Calculate rates
    const impressions = args.impressions ?? 0;
    const clicks = args.clicks ?? 0;
    const conversions = args.conversions ?? 0;
    const spend = args.spend ?? 0;

    const clickRate = impressions > 0 ? (clicks / impressions) * 100 : undefined;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : undefined;
    const costPerClick = clicks > 0 ? spend / clicks : undefined;
    const costPerConversion = conversions > 0 ? spend / conversions : undefined;

    if (existingStats) {
      // Update existing stats
      await ctx.db.patch(existingStats._id, {
        impressions: args.impressions,
        clicks: args.clicks,
        leads: args.leads,
        conversions: args.conversions,
        revenue: args.revenue,
        spend: args.spend,
        clickRate,
        conversionRate,
        costPerClick,
        costPerConversion,
        updatedAt: now,
      });
      return existingStats._id;
    } else {
      // Create new stats
      const statsId = await ctx.db.insert("campaignStats", {
        campaignId: args.campaignId,
        date: args.date,
        impressions: args.impressions,
        clicks: args.clicks,
        leads: args.leads,
        conversions: args.conversions,
        revenue: args.revenue,
        spend: args.spend,
        clickRate,
        conversionRate,
        costPerClick,
        costPerConversion,
        createdAt: now,
        updatedAt: now,
      });
      return statsId;
    }
  },
});

/**
 * Get campaigns for a contact
 */
export const byContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("campaignMembers")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const campaignsWithMembership = await Promise.all(
      memberships.map(async (membership) => {
        const campaign = await ctx.db.get(membership.campaignId);
        return {
          ...membership,
          campaign,
        };
      })
    );

    return campaignsWithMembership.filter((m) => m.campaign !== null);
  },
});

/**
 * Get campaign for a deal
 */
export const byDeal = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal || !deal.campaignId) {
      return null;
    }

    const campaign = await ctx.db.get(deal.campaignId);
    return campaign;
  },
});
