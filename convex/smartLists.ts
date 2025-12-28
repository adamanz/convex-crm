import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "greaterThan"
  | "lessThan"
  | "between"
  | "inList"
  | "notInList"
  | "daysAgo"
  | "daysFromNow";

interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  conjunction: "and" | "or";
}

type EntityType = "contact" | "company" | "deal";

// ============================================================================
// Field definitions for each entity type
// ============================================================================

export const CONTACT_FIELDS = [
  { field: "firstName", label: "First Name", type: "string" },
  { field: "lastName", label: "Last Name", type: "string" },
  { field: "email", label: "Email", type: "string" },
  { field: "phone", label: "Phone", type: "string" },
  { field: "title", label: "Job Title", type: "string" },
  { field: "source", label: "Source", type: "string" },
  { field: "tags", label: "Tags", type: "array" },
  { field: "createdAt", label: "Created At", type: "date" },
  { field: "updatedAt", label: "Updated At", type: "date" },
  { field: "lastActivityAt", label: "Last Activity", type: "date" },
  { field: "aiScore", label: "AI Score", type: "number" },
  { field: "address.city", label: "City", type: "string" },
  { field: "address.state", label: "State", type: "string" },
  { field: "address.country", label: "Country", type: "string" },
];

export const COMPANY_FIELDS = [
  { field: "name", label: "Company Name", type: "string" },
  { field: "domain", label: "Domain", type: "string" },
  { field: "industry", label: "Industry", type: "string" },
  { field: "size", label: "Company Size", type: "string" },
  { field: "annualRevenue", label: "Annual Revenue", type: "number" },
  { field: "phone", label: "Phone", type: "string" },
  { field: "website", label: "Website", type: "string" },
  { field: "tags", label: "Tags", type: "array" },
  { field: "createdAt", label: "Created At", type: "date" },
  { field: "updatedAt", label: "Updated At", type: "date" },
  { field: "address.city", label: "City", type: "string" },
  { field: "address.state", label: "State", type: "string" },
  { field: "address.country", label: "Country", type: "string" },
];

export const DEAL_FIELDS = [
  { field: "name", label: "Deal Name", type: "string" },
  { field: "amount", label: "Amount", type: "number" },
  { field: "currency", label: "Currency", type: "string" },
  { field: "probability", label: "Probability", type: "number" },
  { field: "status", label: "Status", type: "string" },
  { field: "stageId", label: "Stage", type: "string" },
  { field: "tags", label: "Tags", type: "array" },
  { field: "expectedCloseDate", label: "Expected Close Date", type: "date" },
  { field: "actualCloseDate", label: "Actual Close Date", type: "date" },
  { field: "createdAt", label: "Created At", type: "date" },
  { field: "updatedAt", label: "Updated At", type: "date" },
  { field: "stageChangedAt", label: "Stage Changed At", type: "date" },
  { field: "winProbability", label: "Win Probability", type: "number" },
];

export const OPERATORS = [
  { value: "equals", label: "Equals", types: ["string", "number", "date"] },
  { value: "notEquals", label: "Does not equal", types: ["string", "number", "date"] },
  { value: "contains", label: "Contains", types: ["string", "array"] },
  { value: "notContains", label: "Does not contain", types: ["string", "array"] },
  { value: "startsWith", label: "Starts with", types: ["string"] },
  { value: "endsWith", label: "Ends with", types: ["string"] },
  { value: "isEmpty", label: "Is empty", types: ["string", "array", "number"] },
  { value: "isNotEmpty", label: "Is not empty", types: ["string", "array", "number"] },
  { value: "greaterThan", label: "Greater than", types: ["number", "date"] },
  { value: "lessThan", label: "Less than", types: ["number", "date"] },
  { value: "between", label: "Between", types: ["number", "date"] },
  { value: "inList", label: "In list", types: ["string", "number"] },
  { value: "notInList", label: "Not in list", types: ["string", "number"] },
  { value: "daysAgo", label: "Days ago", types: ["date"] },
  { value: "daysFromNow", label: "Days from now", types: ["date"] },
];

// ============================================================================
// Helper functions
// ============================================================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function evaluateFilter(entity: Record<string, unknown>, filter: Filter): boolean {
  const fieldValue = getNestedValue(entity, filter.field);
  const filterValue = filter.value;

  switch (filter.operator) {
    case "equals":
      return fieldValue === filterValue;

    case "notEquals":
      return fieldValue !== filterValue;

    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterValue);
      }
      if (typeof fieldValue === "string" && typeof filterValue === "string") {
        return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      return false;

    case "notContains":
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(filterValue);
      }
      if (typeof fieldValue === "string" && typeof filterValue === "string") {
        return !fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      return true;

    case "startsWith":
      if (typeof fieldValue === "string" && typeof filterValue === "string") {
        return fieldValue.toLowerCase().startsWith(filterValue.toLowerCase());
      }
      return false;

    case "endsWith":
      if (typeof fieldValue === "string" && typeof filterValue === "string") {
        return fieldValue.toLowerCase().endsWith(filterValue.toLowerCase());
      }
      return false;

    case "isEmpty":
      if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
        return true;
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.length === 0;
      }
      return false;

    case "isNotEmpty":
      if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
        return false;
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.length > 0;
      }
      return true;

    case "greaterThan":
      if (typeof fieldValue === "number" && typeof filterValue === "number") {
        return fieldValue > filterValue;
      }
      return false;

    case "lessThan":
      if (typeof fieldValue === "number" && typeof filterValue === "number") {
        return fieldValue < filterValue;
      }
      return false;

    case "between":
      if (
        typeof fieldValue === "number" &&
        typeof filterValue === "object" &&
        filterValue !== null &&
        "min" in filterValue &&
        "max" in filterValue
      ) {
        const { min, max } = filterValue as { min: number; max: number };
        return fieldValue >= min && fieldValue <= max;
      }
      return false;

    case "inList":
      if (Array.isArray(filterValue)) {
        return filterValue.includes(fieldValue);
      }
      return false;

    case "notInList":
      if (Array.isArray(filterValue)) {
        return !filterValue.includes(fieldValue);
      }
      return true;

    case "daysAgo":
      if (typeof fieldValue === "number" && typeof filterValue === "number") {
        const daysAgoTimestamp = Date.now() - filterValue * 24 * 60 * 60 * 1000;
        return fieldValue <= daysAgoTimestamp;
      }
      return false;

    case "daysFromNow":
      if (typeof fieldValue === "number" && typeof filterValue === "number") {
        const daysFromNowTimestamp = Date.now() + filterValue * 24 * 60 * 60 * 1000;
        return fieldValue <= daysFromNowTimestamp && fieldValue >= Date.now();
      }
      return false;

    default:
      return false;
  }
}

function evaluateFilters(
  entity: Record<string, unknown>,
  filters: Filter[]
): boolean {
  if (filters.length === 0) return true;

  let result = evaluateFilter(entity, filters[0]);

  for (let i = 1; i < filters.length; i++) {
    const filter = filters[i];
    const filterResult = evaluateFilter(entity, filter);

    // Use the conjunction from the previous filter to combine results
    if (filters[i - 1].conjunction === "and") {
      result = result && filterResult;
    } else {
      result = result || filterResult;
    }
  }

  return result;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * List all smart lists, optionally filtered by entity type
 */
export const listSmartLists = query({
  args: {
    entityType: v.optional(
      v.union(v.literal("contact"), v.literal("company"), v.literal("deal"))
    ),
  },
  handler: async (ctx, args) => {
    let smartListsQuery;

    if (args.entityType) {
      smartListsQuery = ctx.db
        .query("smartLists")
        .withIndex("by_entity_type", (q) => q.eq("entityType", args.entityType!));
    } else {
      smartListsQuery = ctx.db.query("smartLists").withIndex("by_created");
    }

    const smartLists = await smartListsQuery.order("desc").collect();

    // Fetch creator info for each smart list
    const smartListsWithCreator = await Promise.all(
      smartLists.map(async (list) => {
        let creator: Doc<"users"> | null = null;
        if (list.createdBy) {
          creator = await ctx.db.get(list.createdBy);
        }
        return {
          ...list,
          creator,
        };
      })
    );

    return smartListsWithCreator;
  },
});

/**
 * Get a single smart list by ID
 */
export const getSmartList = query({
  args: {
    id: v.id("smartLists"),
  },
  handler: async (ctx, args) => {
    const smartList = await ctx.db.get(args.id);
    if (!smartList) return null;

    let creator: Doc<"users"> | null = null;
    if (smartList.createdBy) {
      creator = await ctx.db.get(smartList.createdBy);
    }

    return {
      ...smartList,
      creator,
    };
  },
});

/**
 * Get members of a smart list (execute the dynamic query)
 */
export const getSmartListMembers = query({
  args: {
    id: v.id("smartLists"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const smartList = await ctx.db.get(args.id);
    if (!smartList) return { members: [], count: 0 };

    const limit = args.limit ?? 100;
    const filters = smartList.filters as Filter[];

    // Query the appropriate table based on entity type
    let entities: Doc<"contacts">[] | Doc<"companies">[] | Doc<"deals">[];

    switch (smartList.entityType) {
      case "contact":
        entities = await ctx.db.query("contacts").collect();
        break;
      case "company":
        entities = await ctx.db.query("companies").collect();
        break;
      case "deal":
        entities = await ctx.db.query("deals").collect();
        break;
      default:
        return { members: [], count: 0 };
    }

    // Apply filters
    let filteredEntities = entities.filter((entity) =>
      evaluateFilters(entity as unknown as Record<string, unknown>, filters)
    );

    // Apply sorting
    if (smartList.sortField) {
      const sortField = smartList.sortField;
      const sortDir = smartList.sortDirection === "desc" ? -1 : 1;

      filteredEntities = filteredEntities.sort((a, b) => {
        const aVal = getNestedValue(
          a as unknown as Record<string, unknown>,
          sortField
        );
        const bVal = getNestedValue(
          b as unknown as Record<string, unknown>,
          sortField
        );

        if (aVal === undefined || aVal === null) return 1 * sortDir;
        if (bVal === undefined || bVal === null) return -1 * sortDir;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal) * sortDir;
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * sortDir;
        }
        return 0;
      });
    }

    const totalCount = filteredEntities.length;
    const members = filteredEntities.slice(0, limit);

    return {
      members,
      count: totalCount,
      entityType: smartList.entityType,
    };
  },
});

/**
 * Preview smart list members without saving (for the builder UI)
 */
export const previewSmartListMembers = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    filters: v.array(
      v.object({
        id: v.string(),
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("notEquals"),
          v.literal("contains"),
          v.literal("notContains"),
          v.literal("startsWith"),
          v.literal("endsWith"),
          v.literal("isEmpty"),
          v.literal("isNotEmpty"),
          v.literal("greaterThan"),
          v.literal("lessThan"),
          v.literal("between"),
          v.literal("inList"),
          v.literal("notInList"),
          v.literal("daysAgo"),
          v.literal("daysFromNow")
        ),
        value: v.any(),
        conjunction: v.union(v.literal("and"), v.literal("or")),
      })
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const filters = args.filters as Filter[];

    let entities: Doc<"contacts">[] | Doc<"companies">[] | Doc<"deals">[];

    switch (args.entityType) {
      case "contact":
        entities = await ctx.db.query("contacts").collect();
        break;
      case "company":
        entities = await ctx.db.query("companies").collect();
        break;
      case "deal":
        entities = await ctx.db.query("deals").collect();
        break;
      default:
        return { members: [], count: 0 };
    }

    const filteredEntities = entities.filter((entity) =>
      evaluateFilters(entity as unknown as Record<string, unknown>, filters)
    );

    return {
      members: filteredEntities.slice(0, limit),
      count: filteredEntities.length,
      entityType: args.entityType,
    };
  },
});

/**
 * Get field definitions for entity type
 */
export const getFieldDefinitions = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
  },
  handler: async (_ctx, args) => {
    switch (args.entityType) {
      case "contact":
        return CONTACT_FIELDS;
      case "company":
        return COMPANY_FIELDS;
      case "deal":
        return DEAL_FIELDS;
      default:
        return [];
    }
  },
});

/**
 * Get available operators
 */
export const getOperators = query({
  args: {},
  handler: async () => {
    return OPERATORS;
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new smart list
 */
export const createSmartList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    filters: v.array(
      v.object({
        id: v.string(),
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("notEquals"),
          v.literal("contains"),
          v.literal("notContains"),
          v.literal("startsWith"),
          v.literal("endsWith"),
          v.literal("isEmpty"),
          v.literal("isNotEmpty"),
          v.literal("greaterThan"),
          v.literal("lessThan"),
          v.literal("between"),
          v.literal("inList"),
          v.literal("notInList"),
          v.literal("daysAgo"),
          v.literal("daysFromNow")
        ),
        value: v.any(),
        conjunction: v.union(v.literal("and"), v.literal("or")),
      })
    ),
    sortField: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    isPublic: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const smartListId = await ctx.db.insert("smartLists", {
      name: args.name,
      description: args.description,
      entityType: args.entityType,
      filters: args.filters,
      sortField: args.sortField,
      sortDirection: args.sortDirection,
      isPublic: args.isPublic ?? false,
      createdBy: args.createdBy,
      lastRefreshedAt: now,
      cachedCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "smart_list_created",
      entityType: "smartList",
      entityId: smartListId,
      timestamp: now,
      system: true,
    });

    return smartListId;
  },
});

/**
 * Update an existing smart list
 */
export const updateSmartList = mutation({
  args: {
    id: v.id("smartLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    filters: v.optional(
      v.array(
        v.object({
          id: v.string(),
          field: v.string(),
          operator: v.union(
            v.literal("equals"),
            v.literal("notEquals"),
            v.literal("contains"),
            v.literal("notContains"),
            v.literal("startsWith"),
            v.literal("endsWith"),
            v.literal("isEmpty"),
            v.literal("isNotEmpty"),
            v.literal("greaterThan"),
            v.literal("lessThan"),
            v.literal("between"),
            v.literal("inList"),
            v.literal("notInList"),
            v.literal("daysAgo"),
            v.literal("daysFromNow")
          ),
          value: v.any(),
          conjunction: v.union(v.literal("and"), v.literal("or")),
        })
      )
    ),
    sortField: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Smart list not found");
    }

    const updateData: Partial<Doc<"smartLists">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.filters !== undefined) updateData.filters = updates.filters;
    if (updates.sortField !== undefined) updateData.sortField = updates.sortField;
    if (updates.sortDirection !== undefined)
      updateData.sortDirection = updates.sortDirection;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "smart_list_updated",
      entityType: "smartList",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete a smart list
 */
export const deleteSmartList = mutation({
  args: {
    id: v.id("smartLists"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Smart list not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "smart_list_deleted",
      entityType: "smartList",
      entityId: args.id,
      metadata: {
        deletedList: {
          name: existing.name,
          entityType: existing.entityType,
        },
      },
      timestamp: now,
      system: true,
    });

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Duplicate a smart list
 */
export const duplicateSmartList = mutation({
  args: {
    id: v.id("smartLists"),
    newName: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Smart list not found");
    }

    const newSmartListId = await ctx.db.insert("smartLists", {
      name: args.newName ?? `${existing.name} (Copy)`,
      description: existing.description,
      entityType: existing.entityType,
      filters: existing.filters,
      sortField: existing.sortField,
      sortDirection: existing.sortDirection,
      isPublic: false, // Copies are private by default
      createdBy: args.createdBy,
      lastRefreshedAt: now,
      cachedCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "smart_list_duplicated",
      entityType: "smartList",
      entityId: newSmartListId,
      metadata: {
        sourceListId: args.id,
        sourceListName: existing.name,
      },
      timestamp: now,
      system: true,
    });

    return newSmartListId;
  },
});

/**
 * Refresh the cached count for a smart list
 */
export const refreshCount = mutation({
  args: {
    id: v.id("smartLists"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const smartList = await ctx.db.get(args.id);
    if (!smartList) {
      throw new Error("Smart list not found");
    }

    const filters = smartList.filters as Filter[];

    let entities: Doc<"contacts">[] | Doc<"companies">[] | Doc<"deals">[];

    switch (smartList.entityType) {
      case "contact":
        entities = await ctx.db.query("contacts").collect();
        break;
      case "company":
        entities = await ctx.db.query("companies").collect();
        break;
      case "deal":
        entities = await ctx.db.query("deals").collect();
        break;
      default:
        return { count: 0 };
    }

    const filteredCount = entities.filter((entity) =>
      evaluateFilters(entity as unknown as Record<string, unknown>, filters)
    ).length;

    await ctx.db.patch(args.id, {
      cachedCount: filteredCount,
      lastRefreshedAt: now,
      updatedAt: now,
    });

    return { count: filteredCount };
  },
});
