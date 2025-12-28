import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// TERRITORIES - Query and Mutation Functions
// ============================================================================

/**
 * List all territories with stats
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { includeInactive = false } = args;

    const territories = includeInactive
      ? await ctx.db.query("territories").collect()
      : await ctx.db
          .query("territories")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect();

    // Enrich with owner information and stats
    const enrichedTerritories = await Promise.all(
      territories.map(async (territory) => {
        const owner = territory.ownerId
          ? await ctx.db.get(territory.ownerId)
          : null;

        // Get actual counts for verification (these should match stored counts)
        const assignments = await ctx.db
          .query("territoryAssignments")
          .withIndex("by_territory", (q) => q.eq("territoryId", territory._id))
          .collect();

        const contactCount = assignments.filter(
          (a) => a.entityType === "contact"
        ).length;
        const companyCount = assignments.filter(
          (a) => a.entityType === "company"
        ).length;
        const dealCount = assignments.filter(
          (a) => a.entityType === "deal"
        ).length;

        return {
          ...territory,
          owner: owner
            ? {
                _id: owner._id,
                firstName: owner.firstName,
                lastName: owner.lastName,
                email: owner.email,
              }
            : null,
          actualCounts: {
            contacts: contactCount,
            companies: companyCount,
            deals: dealCount,
          },
        };
      })
    );

    return enrichedTerritories;
  },
});

/**
 * Get a single territory by ID
 */
export const get = query({
  args: {
    id: v.id("territories"),
  },
  handler: async (ctx, args) => {
    const territory = await ctx.db.get(args.id);
    if (!territory) return null;

    const owner = territory.ownerId
      ? await ctx.db.get(territory.ownerId)
      : null;

    // Get assignments
    const assignments = await ctx.db
      .query("territoryAssignments")
      .withIndex("by_territory", (q) => q.eq("territoryId", territory._id))
      .collect();

    // Group by entity type
    const contactAssignments = assignments.filter(
      (a) => a.entityType === "contact"
    );
    const companyAssignments = assignments.filter(
      (a) => a.entityType === "company"
    );
    const dealAssignments = assignments.filter((a) => a.entityType === "deal");

    return {
      ...territory,
      owner: owner
        ? {
            _id: owner._id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
          }
        : null,
      assignments: {
        contacts: contactAssignments,
        companies: companyAssignments,
        deals: dealAssignments,
      },
    };
  },
});

/**
 * Create a new territory
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    ownerId: v.optional(v.id("users")),
    rules: v.array(
      v.object({
        id: v.string(),
        field: v.union(
          v.literal("region"),
          v.literal("state"),
          v.literal("country"),
          v.literal("industry"),
          v.literal("companySize"),
          v.literal("annualRevenue")
        ),
        operator: v.union(
          v.literal("equals"),
          v.literal("notEquals"),
          v.literal("contains"),
          v.literal("startsWith"),
          v.literal("greaterThan"),
          v.literal("lessThan"),
          v.literal("in")
        ),
        value: v.any(),
      })
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const territoryId = await ctx.db.insert("territories", {
      name: args.name,
      description: args.description,
      color: args.color,
      ownerId: args.ownerId,
      rules: args.rules,
      assignedContacts: 0,
      assignedCompanies: 0,
      assignedDeals: 0,
      totalDealValue: 0,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });

    return territoryId;
  },
});

/**
 * Update a territory
 */
export const update = mutation({
  args: {
    id: v.id("territories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    rules: v.optional(
      v.array(
        v.object({
          id: v.string(),
          field: v.union(
            v.literal("region"),
            v.literal("state"),
            v.literal("country"),
            v.literal("industry"),
            v.literal("companySize"),
            v.literal("annualRevenue")
          ),
          operator: v.union(
            v.literal("equals"),
            v.literal("notEquals"),
            v.literal("contains"),
            v.literal("startsWith"),
            v.literal("greaterThan"),
            v.literal("lessThan"),
            v.literal("in")
          ),
          value: v.any(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const territory = await ctx.db.get(id);
    if (!territory) throw new Error("Territory not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a territory
 */
export const remove = mutation({
  args: {
    id: v.id("territories"),
  },
  handler: async (ctx, args) => {
    // Remove all assignments first
    const assignments = await ctx.db
      .query("territoryAssignments")
      .withIndex("by_territory", (q) => q.eq("territoryId", args.id))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete the territory
    await ctx.db.delete(args.id);
  },
});

/**
 * Assign an entity (contact, company, deal) to a territory
 */
export const assignEntity = mutation({
  args: {
    territoryId: v.id("territories"),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
    autoAssigned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { territoryId, entityType, entityId, autoAssigned = false } = args;

    // Check if already assigned
    const existing = await ctx.db
      .query("territoryAssignments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", entityType).eq("entityId", entityId)
      )
      .unique();

    if (existing) {
      // Update to new territory
      await ctx.db.patch(existing._id, {
        territoryId,
        assignedAt: Date.now(),
        autoAssigned,
      });
    } else {
      // Create new assignment
      await ctx.db.insert("territoryAssignments", {
        territoryId,
        entityType,
        entityId,
        assignedAt: Date.now(),
        autoAssigned,
      });
    }

    // Update territory counts
    await updateTerritoryCounts(ctx, territoryId);
  },
});

/**
 * Remove an entity from a territory
 */
export const unassignEntity = mutation({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("territoryAssignments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .unique();

    if (assignment) {
      const territoryId = assignment.territoryId;
      await ctx.db.delete(assignment._id);

      // Update territory counts
      await updateTerritoryCounts(ctx, territoryId);
    }
  },
});

/**
 * Get territory stats by region
 */
export const getStatsByRegion = query({
  args: {},
  handler: async (ctx) => {
    const territories = await ctx.db.query("territories").collect();

    // Group by region (from rules)
    const regionStats: Record<
      string,
      {
        territories: number;
        totalContacts: number;
        totalCompanies: number;
        totalDeals: number;
        totalValue: number;
      }
    > = {};

    for (const territory of territories) {
      // Find region rule
      const regionRule = territory.rules.find((r) => r.field === "region");
      const region = regionRule ? String(regionRule.value) : "Unassigned";

      if (!regionStats[region]) {
        regionStats[region] = {
          territories: 0,
          totalContacts: 0,
          totalCompanies: 0,
          totalDeals: 0,
          totalValue: 0,
        };
      }

      regionStats[region].territories++;
      regionStats[region].totalContacts += territory.assignedContacts;
      regionStats[region].totalCompanies += territory.assignedCompanies;
      regionStats[region].totalDeals += territory.assignedDeals;
      regionStats[region].totalValue += territory.totalDealValue;
    }

    return Object.entries(regionStats).map(([region, stats]) => ({
      region,
      ...stats,
    }));
  },
});

/**
 * Auto-assign entities based on territory rules
 */
export const autoAssignAll = mutation({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
  },
  handler: async (ctx, args) => {
    const territories = await ctx.db
      .query("territories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    let assigned = 0;

    if (args.entityType === "company") {
      const companies = await ctx.db.query("companies").collect();

      for (const company of companies) {
        const matchingTerritory = findMatchingTerritory(company, territories);
        if (matchingTerritory) {
          await ctx.db.insert("territoryAssignments", {
            territoryId: matchingTerritory._id,
            entityType: "company",
            entityId: company._id,
            assignedAt: Date.now(),
            autoAssigned: true,
          });
          assigned++;
        }
      }
    }

    // Update all territory counts
    for (const territory of territories) {
      await updateTerritoryCounts(ctx, territory._id);
    }

    return { assigned };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateTerritoryCounts(
  ctx: MutationCtx,
  territoryId: Id<"territories">
) {
  const assignments = await ctx.db
    .query("territoryAssignments")
    .withIndex("by_territory", (q) => q.eq("territoryId", territoryId))
    .collect();

  const contactCount = assignments.filter(
    (a: Doc<"territoryAssignments">) => a.entityType === "contact"
  ).length;
  const companyCount = assignments.filter(
    (a: Doc<"territoryAssignments">) => a.entityType === "company"
  ).length;
  const dealCount = assignments.filter(
    (a: Doc<"territoryAssignments">) => a.entityType === "deal"
  ).length;

  // Calculate total deal value
  let totalValue = 0;
  const dealAssignments = assignments.filter(
    (a: Doc<"territoryAssignments">) => a.entityType === "deal"
  );
  for (const assignment of dealAssignments) {
    const deal = await ctx.db.get(assignment.entityId as Id<"deals">);
    if (deal) {
      totalValue += deal.amount ?? 0;
    }
  }

  await ctx.db.patch(territoryId, {
    assignedContacts: contactCount,
    assignedCompanies: companyCount,
    assignedDeals: dealCount,
    totalDealValue: totalValue,
    updatedAt: Date.now(),
  });
}

function findMatchingTerritory(
  entity: any,
  territories: Doc<"territories">[]
): Doc<"territories"> | null {
  for (const territory of territories) {
    if (matchesAllRules(entity, territory.rules)) {
      return territory;
    }
  }
  return null;
}

function matchesAllRules(entity: any, rules: any[]): boolean {
  for (const rule of rules) {
    if (!matchesRule(entity, rule)) {
      return false;
    }
  }
  return true;
}

function matchesRule(entity: any, rule: any): boolean {
  const entityValue = getEntityFieldValue(entity, rule.field);
  const ruleValue = rule.value;

  switch (rule.operator) {
    case "equals":
      return entityValue === ruleValue;
    case "notEquals":
      return entityValue !== ruleValue;
    case "contains":
      return (
        typeof entityValue === "string" &&
        entityValue.toLowerCase().includes(String(ruleValue).toLowerCase())
      );
    case "startsWith":
      return (
        typeof entityValue === "string" &&
        entityValue.toLowerCase().startsWith(String(ruleValue).toLowerCase())
      );
    case "greaterThan":
      return Number(entityValue) > Number(ruleValue);
    case "lessThan":
      return Number(entityValue) < Number(ruleValue);
    case "in":
      return Array.isArray(ruleValue) && ruleValue.includes(entityValue);
    default:
      return false;
  }
}

function getEntityFieldValue(entity: any, field: string): any {
  switch (field) {
    case "region":
    case "state":
    case "country":
      return entity.address?.[field === "region" ? "state" : field];
    case "industry":
      return entity.industry;
    case "companySize":
      return entity.size;
    case "annualRevenue":
      return entity.annualRevenue;
    default:
      return null;
  }
}
