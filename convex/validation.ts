import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// VALIDATION RULES - Data Quality Validation System
// ============================================================================

/**
 * Rule types available for validation
 */
export const RULE_TYPES = [
  "required",
  "format",
  "range",
  "regex",
  "unique",
  "lookup",
] as const;

/**
 * Entity types that can have validation rules
 */
export const ENTITY_TYPES = ["contact", "company", "deal"] as const;

/**
 * Format types for format validation
 */
export const FORMAT_TYPES = ["email", "phone", "url"] as const;

// ============================================================================
// RULE CRUD OPERATIONS
// ============================================================================

/**
 * List all validation rules, optionally filtered by entity type
 */
export const listRules = query({
  args: {
    entityType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal")
      )
    ),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let rulesQuery;

    if (args.entityType) {
      rulesQuery = ctx.db
        .query("validationRules")
        .withIndex("by_entity", (q) => q.eq("entityType", args.entityType!));
    } else {
      rulesQuery = ctx.db.query("validationRules");
    }

    let rules = await rulesQuery.collect();

    if (args.activeOnly) {
      rules = rules.filter((rule) => rule.isActive);
    }

    // Sort by priority (lower number = higher priority)
    return rules.sort((a, b) => a.priority - b.priority);
  },
});

/**
 * Get a single validation rule by ID
 */
export const getRule = query({
  args: {
    id: v.id("validationRules"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new validation rule
 */
export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    field: v.string(),
    ruleType: v.union(
      v.literal("required"),
      v.literal("format"),
      v.literal("range"),
      v.literal("regex"),
      v.literal("unique"),
      v.literal("lookup")
    ),
    config: v.object({
      formatType: v.optional(
        v.union(
          v.literal("email"),
          v.literal("phone"),
          v.literal("url")
        )
      ),
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      allowedValues: v.optional(v.array(v.string())),
    }),
    errorMessage: v.string(),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get existing rules to determine next priority
    const existingRules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .collect();

    const maxPriority = existingRules.reduce(
      (max, rule) => Math.max(max, rule.priority),
      -1
    );

    const ruleId = await ctx.db.insert("validationRules", {
      name: args.name,
      description: args.description,
      entityType: args.entityType,
      field: args.field,
      ruleType: args.ruleType,
      config: args.config,
      errorMessage: args.errorMessage,
      isActive: args.isActive ?? true,
      priority: args.priority ?? maxPriority + 1,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "validation_rule_created",
      entityType: "validationRule",
      entityId: ruleId,
      metadata: {
        name: args.name,
        ruleType: args.ruleType,
        forEntityType: args.entityType,
        field: args.field,
      },
      timestamp: now,
      system: true,
    });

    return ruleId;
  },
});

/**
 * Update an existing validation rule
 */
export const updateRule = mutation({
  args: {
    id: v.id("validationRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    field: v.optional(v.string()),
    ruleType: v.optional(
      v.union(
        v.literal("required"),
        v.literal("format"),
        v.literal("range"),
        v.literal("regex"),
        v.literal("unique"),
        v.literal("lookup")
      )
    ),
    config: v.optional(
      v.object({
        formatType: v.optional(
          v.union(
            v.literal("email"),
            v.literal("phone"),
            v.literal("url")
          )
        ),
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        allowedValues: v.optional(v.array(v.string())),
      })
    ),
    errorMessage: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Validation rule not found");
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"validationRules">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.field !== undefined) updateData.field = updates.field;
    if (updates.ruleType !== undefined) updateData.ruleType = updates.ruleType;
    if (updates.config !== undefined) updateData.config = updates.config;
    if (updates.errorMessage !== undefined) updateData.errorMessage = updates.errorMessage;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.priority !== undefined) updateData.priority = updates.priority;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "validation_rule_updated",
      entityType: "validationRule",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete a validation rule
 */
export const deleteRule = mutation({
  args: {
    id: v.id("validationRules"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Validation rule not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "validation_rule_deleted",
      entityType: "validationRule",
      entityId: args.id,
      metadata: {
        name: rule.name,
        ruleType: rule.ruleType,
        forEntityType: rule.entityType,
        field: rule.field,
      },
      timestamp: now,
      system: true,
    });

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

/**
 * Validation patterns for format checks
 */
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[\d\s\-().]{7,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

/**
 * Helper function to get field value from an entity (supports nested fields)
 */
function getFieldValue(entity: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let value: unknown = entity;

  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "object") {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Validate a single field against a rule
 */
function validateField(
  value: unknown,
  rule: Doc<"validationRules">
): { isValid: boolean; error?: string } {
  const { ruleType, config, errorMessage } = rule;

  switch (ruleType) {
    case "required":
      if (value === undefined || value === null || value === "") {
        return { isValid: false, error: errorMessage };
      }
      break;

    case "format":
      if (value !== undefined && value !== null && value !== "") {
        const pattern = VALIDATION_PATTERNS[config.formatType as keyof typeof VALIDATION_PATTERNS];
        if (pattern && !pattern.test(String(value))) {
          return { isValid: false, error: errorMessage };
        }
      }
      break;

    case "range":
      if (value !== undefined && value !== null && value !== "") {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: errorMessage };
        }
        if (config.min !== undefined && numValue < config.min) {
          return { isValid: false, error: errorMessage };
        }
        if (config.max !== undefined && numValue > config.max) {
          return { isValid: false, error: errorMessage };
        }
      }
      break;

    case "regex":
      if (value !== undefined && value !== null && value !== "" && config.pattern) {
        try {
          const regex = new RegExp(config.pattern);
          if (!regex.test(String(value))) {
            return { isValid: false, error: errorMessage };
          }
        } catch {
          // Invalid regex pattern - skip validation
        }
      }
      break;

    case "lookup":
      if (value !== undefined && value !== null && value !== "" && config.allowedValues) {
        if (!config.allowedValues.includes(String(value))) {
          return { isValid: false, error: errorMessage };
        }
      }
      break;

    case "unique":
      // Unique validation is handled separately as it requires database access
      break;
  }

  return { isValid: true };
}

/**
 * Validate an entity against all applicable rules
 */
export const validateEntity = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch the entity
    let entity: Doc<"contacts"> | Doc<"companies"> | Doc<"deals"> | null = null;

    if (args.entityType === "contact") {
      entity = await ctx.db.get(args.entityId as Id<"contacts">);
    } else if (args.entityType === "company") {
      entity = await ctx.db.get(args.entityId as Id<"companies">);
    } else if (args.entityType === "deal") {
      entity = await ctx.db.get(args.entityId as Id<"deals">);
    }

    if (!entity) {
      return { isValid: false, errors: [{ field: "_entity", error: "Entity not found" }] };
    }

    // Get active rules for this entity type
    const rules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort by priority
    rules.sort((a, b) => a.priority - b.priority);

    const errors: Array<{ field: string; error: string; ruleId: string; ruleName: string }> = [];

    for (const rule of rules) {
      const value = getFieldValue(entity as Record<string, unknown>, rule.field);

      // Handle unique validation
      if (rule.ruleType === "unique" && value !== undefined && value !== null && value !== "") {
        let duplicates: unknown[];

        if (args.entityType === "contact") {
          duplicates = await ctx.db
            .query("contacts")
            .filter((q) =>
              q.and(
                q.eq(q.field(rule.field as keyof Doc<"contacts">), value as string),
                q.neq(q.field("_id"), args.entityId as Id<"contacts">)
              )
            )
            .take(1);
        } else if (args.entityType === "company") {
          duplicates = await ctx.db
            .query("companies")
            .filter((q) =>
              q.and(
                q.eq(q.field(rule.field as keyof Doc<"companies">), value as string),
                q.neq(q.field("_id"), args.entityId as Id<"companies">)
              )
            )
            .take(1);
        } else {
          duplicates = await ctx.db
            .query("deals")
            .filter((q) =>
              q.and(
                q.eq(q.field(rule.field as keyof Doc<"deals">), value as string),
                q.neq(q.field("_id"), args.entityId as Id<"deals">)
              )
            )
            .take(1);
        }

        if (duplicates.length > 0) {
          errors.push({
            field: rule.field,
            error: rule.errorMessage,
            ruleId: rule._id,
            ruleName: rule.name,
          });
        }
        continue;
      }

      const result = validateField(value, rule);
      if (!result.isValid) {
        errors.push({
          field: rule.field,
          error: result.error!,
          ruleId: rule._id,
          ruleName: rule.name,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

/**
 * Validate a single field against its rules
 */
export const validateFieldValue = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    field: v.string(),
    value: v.any(),
    entityId: v.optional(v.string()), // For unique validation
  },
  handler: async (ctx, args) => {
    // Get active rules for this field
    const rules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity_field", (q) =>
        q.eq("entityType", args.entityType).eq("field", args.field)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort by priority
    rules.sort((a, b) => a.priority - b.priority);

    const errors: Array<{ error: string; ruleId: string; ruleName: string }> = [];

    for (const rule of rules) {
      // Handle unique validation
      if (rule.ruleType === "unique" && args.value !== undefined && args.value !== null && args.value !== "") {
        let query;

        if (args.entityType === "contact") {
          query = ctx.db.query("contacts").filter((q) =>
            q.eq(q.field(args.field as keyof Doc<"contacts">), args.value as string)
          );
        } else if (args.entityType === "company") {
          query = ctx.db.query("companies").filter((q) =>
            q.eq(q.field(args.field as keyof Doc<"companies">), args.value as string)
          );
        } else {
          query = ctx.db.query("deals").filter((q) =>
            q.eq(q.field(args.field as keyof Doc<"deals">), args.value as string)
          );
        }

        const existing = await query.take(1);

        // If we're updating an existing entity, exclude it from duplicate check
        if (existing.length > 0 && (!args.entityId || (existing[0] as { _id: string })._id !== args.entityId)) {
          errors.push({
            error: rule.errorMessage,
            ruleId: rule._id,
            ruleName: rule.name,
          });
        }
        continue;
      }

      const result = validateField(args.value, rule);
      if (!result.isValid) {
        errors.push({
          error: result.error!,
          ruleId: rule._id,
          ruleName: rule.name,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

/**
 * Test a rule against sample data
 */
export const testRule = query({
  args: {
    ruleType: v.union(
      v.literal("required"),
      v.literal("format"),
      v.literal("range"),
      v.literal("regex"),
      v.literal("unique"),
      v.literal("lookup")
    ),
    config: v.object({
      formatType: v.optional(
        v.union(
          v.literal("email"),
          v.literal("phone"),
          v.literal("url")
        )
      ),
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      allowedValues: v.optional(v.array(v.string())),
    }),
    errorMessage: v.string(),
    testValue: v.any(),
  },
  handler: async (ctx, args) => {
    // Create a mock rule object for testing
    const mockRule = {
      _id: "test" as Id<"validationRules">,
      _creationTime: Date.now(),
      name: "Test Rule",
      entityType: "contact" as const,
      field: "test",
      ruleType: args.ruleType,
      config: args.config,
      errorMessage: args.errorMessage,
      isActive: true,
      priority: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // For unique validation, just return valid since we can't test without a real database check
    if (args.ruleType === "unique") {
      return { isValid: true, message: "Unique validation requires real database check" };
    }

    const result = validateField(args.testValue, mockRule);
    return {
      isValid: result.isValid,
      error: result.error,
    };
  },
});

/**
 * Get all entities that violate validation rules
 */
export const getViolations = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    ruleId: v.optional(v.id("validationRules")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get active rules
    let rules: Doc<"validationRules">[];

    if (args.ruleId) {
      const rule = await ctx.db.get(args.ruleId);
      rules = rule && rule.isActive ? [rule] : [];
    } else {
      rules = await ctx.db
        .query("validationRules")
        .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    if (rules.length === 0) {
      return { violations: [], totalCount: 0 };
    }

    // Get entities
    let entities: Array<Doc<"contacts"> | Doc<"companies"> | Doc<"deals">>;

    if (args.entityType === "contact") {
      entities = await ctx.db.query("contacts").take(1000);
    } else if (args.entityType === "company") {
      entities = await ctx.db.query("companies").take(1000);
    } else {
      entities = await ctx.db.query("deals").take(1000);
    }

    const violations: Array<{
      entityId: string;
      entityName: string;
      errors: Array<{ field: string; error: string; ruleName: string }>;
    }> = [];

    for (const entity of entities) {
      const entityErrors: Array<{ field: string; error: string; ruleName: string }> = [];

      for (const rule of rules) {
        const value = getFieldValue(entity as Record<string, unknown>, rule.field);

        // Skip unique validation in bulk check for performance
        if (rule.ruleType === "unique") {
          continue;
        }

        const result = validateField(value, rule);
        if (!result.isValid) {
          entityErrors.push({
            field: rule.field,
            error: result.error!,
            ruleName: rule.name,
          });
        }
      }

      if (entityErrors.length > 0) {
        let entityName = "";
        if (args.entityType === "contact") {
          const contact = entity as Doc<"contacts">;
          entityName = `${contact.firstName || ""} ${contact.lastName}`.trim();
        } else if (args.entityType === "company") {
          entityName = (entity as Doc<"companies">).name;
        } else {
          entityName = (entity as Doc<"deals">).name;
        }

        violations.push({
          entityId: entity._id,
          entityName,
          errors: entityErrors,
        });

        if (violations.length >= limit) {
          break;
        }
      }
    }

    return {
      violations,
      totalCount: violations.length,
    };
  },
});

/**
 * Bulk validate multiple entities
 */
export const bulkValidate = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get active rules for this entity type
    const rules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    rules.sort((a, b) => a.priority - b.priority);

    const results: Array<{
      entityId: string;
      isValid: boolean;
      errors: Array<{ field: string; error: string; ruleName: string }>;
    }> = [];

    for (const entityId of args.entityIds) {
      let entity: Doc<"contacts"> | Doc<"companies"> | Doc<"deals"> | null = null;

      if (args.entityType === "contact") {
        entity = await ctx.db.get(entityId as Id<"contacts">);
      } else if (args.entityType === "company") {
        entity = await ctx.db.get(entityId as Id<"companies">);
      } else if (args.entityType === "deal") {
        entity = await ctx.db.get(entityId as Id<"deals">);
      }

      if (!entity) {
        results.push({
          entityId,
          isValid: false,
          errors: [{ field: "_entity", error: "Entity not found", ruleName: "System" }],
        });
        continue;
      }

      const errors: Array<{ field: string; error: string; ruleName: string }> = [];

      for (const rule of rules) {
        const value = getFieldValue(entity as Record<string, unknown>, rule.field);

        // Skip unique validation in bulk for performance
        if (rule.ruleType === "unique") {
          continue;
        }

        const result = validateField(value, rule);
        if (!result.isValid) {
          errors.push({
            field: rule.field,
            error: result.error!,
            ruleName: rule.name,
          });
        }
      }

      results.push({
        entityId,
        isValid: errors.length === 0,
        errors,
      });
    }

    return {
      results,
      summary: {
        total: results.length,
        valid: results.filter((r) => r.isValid).length,
        invalid: results.filter((r) => !r.isValid).length,
      },
    };
  },
});

/**
 * Get validation statistics for an entity type
 */
export const getValidationStats = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
  },
  handler: async (ctx, args) => {
    // Get rules for this entity type
    const rules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .collect();

    const activeRules = rules.filter((r) => r.isActive);

    // Get entity count
    let entityCount = 0;
    if (args.entityType === "contact") {
      entityCount = (await ctx.db.query("contacts").collect()).length;
    } else if (args.entityType === "company") {
      entityCount = (await ctx.db.query("companies").collect()).length;
    } else {
      entityCount = (await ctx.db.query("deals").collect()).length;
    }

    // Group rules by type
    const rulesByType: Record<string, number> = {};
    for (const rule of activeRules) {
      rulesByType[rule.ruleType] = (rulesByType[rule.ruleType] || 0) + 1;
    }

    // Group rules by field
    const rulesByField: Record<string, number> = {};
    for (const rule of activeRules) {
      rulesByField[rule.field] = (rulesByField[rule.field] || 0) + 1;
    }

    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      inactiveRules: rules.length - activeRules.length,
      entityCount,
      rulesByType,
      rulesByField,
    };
  },
});

/**
 * Get all rules for a specific field
 */
export const getRulesForField = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    field: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("validationRules")
      .withIndex("by_entity_field", (q) =>
        q.eq("entityType", args.entityType).eq("field", args.field)
      )
      .collect();

    return rules.sort((a, b) => a.priority - b.priority);
  },
});
