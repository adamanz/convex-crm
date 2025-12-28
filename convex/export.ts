import { v } from "convex/values";
import { query } from "./_generated/server";

// ============================================================================
// EXPORT QUERIES - Export contacts, companies, and deals
// ============================================================================

/**
 * Export all contacts with optional filtering
 * Returns data ready for CSV/JSON export
 */
export const exportContacts = query({
  args: {
    includeCompanyName: v.optional(v.boolean()),
    filter: v.optional(
      v.object({
        companyId: v.optional(v.id("companies")),
        ownerId: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get base contacts query
    let contacts;
    if (args.filter?.companyId) {
      contacts = await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", args.filter!.companyId))
        .collect();
    } else if (args.filter?.ownerId) {
      contacts = await ctx.db
        .query("contacts")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.filter!.ownerId))
        .collect();
    } else {
      contacts = await ctx.db.query("contacts").collect();
    }

    // Apply tag filter if provided
    if (args.filter?.tags && args.filter.tags.length > 0) {
      contacts = contacts.filter((contact) =>
        args.filter!.tags!.some((tag) => contact.tags.includes(tag))
      );
    }

    // Build company lookup if needed
    const companyMap = new Map<string, string>();
    if (args.includeCompanyName !== false) {
      const companies = await ctx.db.query("companies").collect();
      for (const company of companies) {
        companyMap.set(company._id, company.name);
      }
    }

    // Transform to export format
    const exportData = contacts.map((contact) => ({
      id: contact._id,
      firstName: contact.firstName ?? "",
      lastName: contact.lastName,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      title: contact.title ?? "",
      companyName: contact.companyId
        ? companyMap.get(contact.companyId) ?? ""
        : "",
      linkedinUrl: contact.linkedinUrl ?? "",
      twitterHandle: contact.twitterHandle ?? "",
      source: contact.source ?? "",
      tags: contact.tags.join(", "),
      street: contact.address?.street ?? "",
      city: contact.address?.city ?? "",
      state: contact.address?.state ?? "",
      postalCode: contact.address?.postalCode ?? "",
      country: contact.address?.country ?? "",
      createdAt: new Date(contact.createdAt).toISOString(),
      updatedAt: new Date(contact.updatedAt).toISOString(),
      lastActivityAt: contact.lastActivityAt
        ? new Date(contact.lastActivityAt).toISOString()
        : "",
    }));

    return {
      data: exportData,
      count: exportData.length,
      columns: [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "title",
        "companyName",
        "linkedinUrl",
        "twitterHandle",
        "source",
        "tags",
        "street",
        "city",
        "state",
        "postalCode",
        "country",
        "createdAt",
        "updatedAt",
        "lastActivityAt",
      ],
    };
  },
});

/**
 * Export all companies with optional filtering
 */
export const exportCompanies = query({
  args: {
    filter: v.optional(
      v.object({
        ownerId: v.optional(v.id("users")),
        industry: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    includeStats: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get base companies query
    let companies;
    if (args.filter?.ownerId) {
      companies = await ctx.db
        .query("companies")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.filter!.ownerId))
        .collect();
    } else {
      companies = await ctx.db.query("companies").collect();
    }

    // Apply filters
    if (args.filter?.industry) {
      companies = companies.filter(
        (company) => company.industry === args.filter!.industry
      );
    }

    if (args.filter?.tags && args.filter.tags.length > 0) {
      companies = companies.filter((company) =>
        args.filter!.tags!.some((tag) => company.tags.includes(tag))
      );
    }

    // Optionally include contact and deal counts
    let contactCounts = new Map<string, number>();
    let dealCounts = new Map<string, number>();
    let dealValues = new Map<string, number>();

    if (args.includeStats !== false) {
      const contacts = await ctx.db.query("contacts").collect();
      for (const contact of contacts) {
        if (contact.companyId) {
          contactCounts.set(
            contact.companyId,
            (contactCounts.get(contact.companyId) ?? 0) + 1
          );
        }
      }

      const deals = await ctx.db.query("deals").collect();
      for (const deal of deals) {
        if (deal.companyId) {
          dealCounts.set(
            deal.companyId,
            (dealCounts.get(deal.companyId) ?? 0) + 1
          );
          dealValues.set(
            deal.companyId,
            (dealValues.get(deal.companyId) ?? 0) + (deal.amount ?? 0)
          );
        }
      }
    }

    // Transform to export format
    const exportData = companies.map((company) => ({
      id: company._id,
      name: company.name,
      domain: company.domain ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      annualRevenue: company.annualRevenue ?? "",
      description: company.description ?? "",
      phone: company.phone ?? "",
      website: company.website ?? "",
      tags: company.tags.join(", "),
      street: company.address?.street ?? "",
      city: company.address?.city ?? "",
      state: company.address?.state ?? "",
      postalCode: company.address?.postalCode ?? "",
      country: company.address?.country ?? "",
      contactCount: contactCounts.get(company._id) ?? 0,
      dealCount: dealCounts.get(company._id) ?? 0,
      totalDealValue: dealValues.get(company._id) ?? 0,
      createdAt: new Date(company.createdAt).toISOString(),
      updatedAt: new Date(company.updatedAt).toISOString(),
    }));

    return {
      data: exportData,
      count: exportData.length,
      columns: [
        "id",
        "name",
        "domain",
        "industry",
        "size",
        "annualRevenue",
        "description",
        "phone",
        "website",
        "tags",
        "street",
        "city",
        "state",
        "postalCode",
        "country",
        "contactCount",
        "dealCount",
        "totalDealValue",
        "createdAt",
        "updatedAt",
      ],
    };
  },
});

/**
 * Export all deals with optional filtering
 */
export const exportDeals = query({
  args: {
    filter: v.optional(
      v.object({
        pipelineId: v.optional(v.id("pipelines")),
        status: v.optional(
          v.union(v.literal("open"), v.literal("won"), v.literal("lost"))
        ),
        ownerId: v.optional(v.id("users")),
        companyId: v.optional(v.id("companies")),
        tags: v.optional(v.array(v.string())),
      })
    ),
    includeRelatedNames: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get base deals query
    let deals;
    if (args.filter?.pipelineId) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_pipeline_stage", (q) =>
          q.eq("pipelineId", args.filter!.pipelineId!)
        )
        .collect();
    } else if (args.filter?.companyId) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", args.filter!.companyId))
        .collect();
    } else if (args.filter?.status) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_status", (q) => q.eq("status", args.filter!.status!))
        .collect();
    } else if (args.filter?.ownerId) {
      deals = await ctx.db
        .query("deals")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.filter!.ownerId))
        .collect();
    } else {
      deals = await ctx.db.query("deals").collect();
    }

    // Apply additional filters
    if (args.filter?.tags && args.filter.tags.length > 0) {
      deals = deals.filter((deal) =>
        args.filter!.tags!.some((tag) => deal.tags.includes(tag))
      );
    }

    // Build lookup maps
    const companyMap = new Map<string, string>();
    const pipelineMap = new Map<string, { name: string; stages: Map<string, string> }>();
    const contactMap = new Map<string, string>();

    if (args.includeRelatedNames !== false) {
      const companies = await ctx.db.query("companies").collect();
      for (const company of companies) {
        companyMap.set(company._id, company.name);
      }

      const pipelines = await ctx.db.query("pipelines").collect();
      for (const pipeline of pipelines) {
        const stageMap = new Map<string, string>();
        for (const stage of pipeline.stages) {
          stageMap.set(stage.id, stage.name);
        }
        pipelineMap.set(pipeline._id, { name: pipeline.name, stages: stageMap });
      }

      const contacts = await ctx.db.query("contacts").collect();
      for (const contact of contacts) {
        const fullName = [contact.firstName, contact.lastName]
          .filter(Boolean)
          .join(" ");
        contactMap.set(contact._id, fullName);
      }
    }

    // Transform to export format
    const exportData = deals.map((deal) => {
      const pipelineInfo = pipelineMap.get(deal.pipelineId);
      const contactNames = deal.contactIds
        .map((id) => contactMap.get(id) ?? "")
        .filter(Boolean)
        .join("; ");

      return {
        id: deal._id,
        name: deal.name,
        companyName: deal.companyId ? companyMap.get(deal.companyId) ?? "" : "",
        contactNames,
        pipelineName: pipelineInfo?.name ?? "",
        stageName: pipelineInfo?.stages.get(deal.stageId) ?? deal.stageId,
        stageId: deal.stageId,
        amount: deal.amount ?? "",
        currency: deal.currency,
        probability: deal.probability ?? "",
        expectedCloseDate: deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
          : "",
        actualCloseDate: deal.actualCloseDate
          ? new Date(deal.actualCloseDate).toISOString().split("T")[0]
          : "",
        status: deal.status,
        lostReason: deal.lostReason ?? "",
        tags: deal.tags.join(", "),
        createdAt: new Date(deal.createdAt).toISOString(),
        updatedAt: new Date(deal.updatedAt).toISOString(),
      };
    });

    return {
      data: exportData,
      count: exportData.length,
      columns: [
        "id",
        "name",
        "companyName",
        "contactNames",
        "pipelineName",
        "stageName",
        "stageId",
        "amount",
        "currency",
        "probability",
        "expectedCloseDate",
        "actualCloseDate",
        "status",
        "lostReason",
        "tags",
        "createdAt",
        "updatedAt",
      ],
    };
  },
});
