import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// COMPANIES - Query and Mutation Functions
// ============================================================================

/**
 * List companies with pagination and optional filtering
 */
export const list = query({
  args: {
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
    filter: v.optional(
      v.object({
        ownerId: v.optional(v.id("users")),
        industry: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filter } = args;

    let companiesQuery;

    // Use appropriate index based on filter
    if (filter?.ownerId) {
      companiesQuery = ctx.db
        .query("companies")
        .withIndex("by_owner", (q) => q.eq("ownerId", filter.ownerId));
    } else {
      companiesQuery = ctx.db.query("companies").withIndex("by_created");
    }

    // Get paginated results
    const results = await companiesQuery
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    // Post-query filters for industry and tags
    let filteredPage = results.page;

    if (filter?.industry) {
      filteredPage = filteredPage.filter(
        (company) => company.industry === filter.industry
      );
    }

    if (filter?.tags && filter.tags.length > 0) {
      filteredPage = filteredPage.filter((company) =>
        filter.tags!.some((tag) => company.tags.includes(tag))
      );
    }

    // Fetch contact counts for each company
    const companiesWithCounts = await Promise.all(
      filteredPage.map(async (company) => {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        const deals = await ctx.db
          .query("deals")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        return {
          ...company,
          contactCount: contacts.length,
          dealCount: deals.length,
          totalDealValue: deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
        };
      })
    );

    return {
      page: companiesWithCounts,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get a single company by ID with related data
 */
export const get = query({
  args: {
    id: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.id);
    if (!company) {
      return null;
    }

    // Fetch owner info
    let owner: Doc<"users"> | null = null;
    if (company.ownerId) {
      owner = await ctx.db.get(company.ownerId);
    }

    // Fetch contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .collect();

    // Fetch deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .collect();

    // Fetch related activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", "company").eq("relatedToId", args.id)
      )
      .order("desc")
      .take(10);

    // Calculate deal statistics
    const openDeals = deals.filter((d) => d.status === "open");
    const wonDeals = deals.filter((d) => d.status === "won");
    const lostDeals = deals.filter((d) => d.status === "lost");

    const dealStats = {
      total: deals.length,
      open: openDeals.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      totalValue: deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
      openValue: openDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
      wonValue: wonDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
    };

    return {
      ...company,
      owner,
      contacts,
      deals,
      recentActivities: activities,
      contactCount: contacts.length,
      dealStats,
    };
  },
});

/**
 * Full-text search for companies
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    ownerId: v.optional(v.id("users")),
    industry: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, ownerId, industry, limit = 20 } = args;

    let searchQuery = ctx.db
      .query("companies")
      .withSearchIndex("search_companies", (q) => {
        let search = q.search("name", searchTerm);
        if (ownerId) {
          search = search.eq("ownerId", ownerId);
        }
        if (industry) {
          search = search.eq("industry", industry);
        }
        return search;
      });

    const companies = await searchQuery.take(limit);

    // Fetch contact counts
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        return {
          ...company,
          contactCount: contacts.length,
        };
      })
    );

    return companiesWithCounts;
  },
});

/**
 * Create a new company
 */
export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    annualRevenue: v.optional(v.number()),
    description: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
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

    // Check for duplicate domain if provided
    if (args.domain) {
      const existingCompany = await ctx.db
        .query("companies")
        .withIndex("by_domain", (q) => q.eq("domain", args.domain))
        .first();
      if (existingCompany) {
        throw new Error("A company with this domain already exists");
      }
    }

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      domain: args.domain,
      logoUrl: args.logoUrl,
      industry: args.industry,
      size: args.size,
      annualRevenue: args.annualRevenue,
      description: args.description,
      address: args.address,
      phone: args.phone,
      website: args.website,
      ownerId: args.ownerId,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "company_created",
      entityType: "company",
      entityId: companyId,
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const newCompany = await ctx.db.get(companyId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "company.created",
      payload: {
        company: newCompany,
      },
    });

    return companyId;
  },
});

/**
 * Update an existing company
 */
export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    annualRevenue: v.optional(v.number()),
    description: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check company exists
    const existingCompany = await ctx.db.get(id);
    if (!existingCompany) {
      throw new Error("Company not found");
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined && updates.ownerId !== null) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Check for duplicate domain if being updated
    if (updates.domain && updates.domain !== existingCompany.domain) {
      const duplicateCompany = await ctx.db
        .query("companies")
        .withIndex("by_domain", (q) => q.eq("domain", updates.domain))
        .first();
      if (duplicateCompany) {
        throw new Error("A company with this domain already exists");
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"companies">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.domain !== undefined) updateData.domain = updates.domain;
    if (updates.logoUrl !== undefined) updateData.logoUrl = updates.logoUrl;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.size !== undefined) updateData.size = updates.size;
    if (updates.annualRevenue !== undefined) updateData.annualRevenue = updates.annualRevenue;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "company_updated",
      entityType: "company",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const updatedCompany = await ctx.db.get(id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "company.updated",
      payload: {
        company: updatedCompany,
        changes: updates,
      },
    });

    return id;
  },
});

/**
 * Delete a company
 */
export const delete_ = mutation({
  args: {
    id: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check company exists
    const company = await ctx.db.get(args.id);
    if (!company) {
      throw new Error("Company not found");
    }

    // Check if company has contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .first();

    if (contacts) {
      throw new Error(
        "Cannot delete company: has associated contacts. Remove or reassign contacts first."
      );
    }

    // Check if company has deals
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .first();

    if (deals) {
      throw new Error(
        "Cannot delete company: has associated deals. Remove or reassign deals first."
      );
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "company_deleted",
      entityType: "company",
      entityId: args.id,
      metadata: {
        deletedCompany: {
          name: company.name,
          domain: company.domain,
        },
      },
      timestamp: now,
      system: true,
    });

    // Trigger webhook before deletion
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "company.deleted",
      payload: {
        companyId: args.id,
        deletedCompany: {
          name: company.name,
          domain: company.domain,
        },
      },
    });

    // Delete the company
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Get companies by industry
 */
export const byIndustry = query({
  args: {
    industry: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { industry, limit = 50 } = args;

    const companies = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("industry"), industry))
      .take(limit);

    return companies;
  },
});

/**
 * Get unique industries for filtering
 */
export const getIndustries = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();

    const industries = new Set<string>();
    for (const company of companies) {
      if (company.industry) {
        industries.add(company.industry);
      }
    }

    return Array.from(industries).sort();
  },
});
