import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// CUSTOM FIELDS - Query and Mutation Functions
// ============================================================================

/**
 * Field type options available for custom fields
 */
export const FIELD_TYPES = [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "url",
  "email",
  "phone",
  "currency",
  "textarea",
] as const;

/**
 * Entity types that can have custom fields
 */
export const ENTITY_TYPES = ["contact", "company", "deal"] as const;

// ============================================================================
// CUSTOM FIELD DEFINITIONS - Admin CRUD operations
// ============================================================================

/**
 * List all custom field definitions for an entity type
 */
export const listDefinitions = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
  },
  handler: async (ctx, args) => {
    const definitions = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .collect();

    // Sort by order
    return definitions.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get a single custom field definition by ID
 */
export const getDefinition = query({
  args: {
    id: v.id("customFieldDefinitions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new custom field definition
 */
export const createDefinition = mutation({
  args: {
    name: v.string(),
    label: v.string(),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("checkbox"),
      v.literal("url"),
      v.literal("email"),
      v.literal("phone"),
      v.literal("currency"),
      v.literal("textarea")
    ),
    description: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    options: v.optional(
      v.array(
        v.object({
          value: v.string(),
          label: v.string(),
          color: v.optional(v.string()),
        })
      )
    ),
    defaultValue: v.optional(v.any()),
    validation: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        message: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for duplicate name within the same entity type
    const existing = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity_name", (q) =>
        q.eq("entityType", args.entityType).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error(
        `A custom field with name "${args.name}" already exists for ${args.entityType}`
      );
    }

    // Get the highest order for this entity type to append new field
    const existingFields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .collect();

    const maxOrder = existingFields.reduce(
      (max, field) => Math.max(max, field.order),
      -1
    );

    const definitionId = await ctx.db.insert("customFieldDefinitions", {
      name: args.name,
      label: args.label,
      entityType: args.entityType,
      fieldType: args.fieldType,
      description: args.description,
      placeholder: args.placeholder,
      isRequired: args.isRequired ?? false,
      options: args.options,
      defaultValue: args.defaultValue,
      validation: args.validation,
      order: maxOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "custom_field_created",
      entityType: "customFieldDefinition",
      entityId: definitionId,
      metadata: {
        name: args.name,
        fieldType: args.fieldType,
        forEntityType: args.entityType,
      },
      timestamp: now,
      system: true,
    });

    return definitionId;
  },
});

/**
 * Update a custom field definition
 */
export const updateDefinition = mutation({
  args: {
    id: v.id("customFieldDefinitions"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    options: v.optional(
      v.array(
        v.object({
          value: v.string(),
          label: v.string(),
          color: v.optional(v.string()),
        })
      )
    ),
    defaultValue: v.optional(v.any()),
    validation: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        message: v.optional(v.string()),
      })
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Custom field definition not found");
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"customFieldDefinitions">> = {
      updatedAt: now,
    };

    if (updates.label !== undefined) updateData.label = updates.label;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.placeholder !== undefined)
      updateData.placeholder = updates.placeholder;
    if (updates.isRequired !== undefined)
      updateData.isRequired = updates.isRequired;
    if (updates.options !== undefined) updateData.options = updates.options;
    if (updates.defaultValue !== undefined)
      updateData.defaultValue = updates.defaultValue;
    if (updates.validation !== undefined)
      updateData.validation = updates.validation;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "custom_field_updated",
      entityType: "customFieldDefinition",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Reorder custom field definitions
 */
export const reorderDefinitions = mutation({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    orderedIds: v.array(v.id("customFieldDefinitions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update order for each definition
    await Promise.all(
      args.orderedIds.map((id, index) =>
        ctx.db.patch(id, { order: index, updatedAt: now })
      )
    );

    return { success: true };
  },
});

/**
 * Delete a custom field definition
 * This will also delete all associated values
 */
export const deleteDefinition = mutation({
  args: {
    id: v.id("customFieldDefinitions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const definition = await ctx.db.get(args.id);
    if (!definition) {
      throw new Error("Custom field definition not found");
    }

    // Delete all values associated with this definition
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_definition", (q) => q.eq("definitionId", args.id))
      .collect();

    for (const value of values) {
      await ctx.db.delete(value._id);
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "custom_field_deleted",
      entityType: "customFieldDefinition",
      entityId: args.id,
      metadata: {
        name: definition.name,
        fieldType: definition.fieldType,
        forEntityType: definition.entityType,
        deletedValuesCount: values.length,
      },
      timestamp: now,
      system: true,
    });

    // Delete the definition
    await ctx.db.delete(args.id);

    return { success: true, deletedValuesCount: values.length };
  },
});

// ============================================================================
// CUSTOM FIELD VALUES - Entity-specific value storage
// ============================================================================

/**
 * Get all custom field values for an entity
 */
export const getValues = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all values for this entity
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    // Get all active definitions for this entity type
    const definitions = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Map values to definitions
    const valueMap = new Map(
      values.map((v) => [v.definitionId.toString(), v])
    );

    // Return definitions with their values
    return definitions
      .sort((a, b) => a.order - b.order)
      .map((def) => ({
        definition: def,
        value: valueMap.get(def._id.toString()) || null,
      }));
  },
});

/**
 * Get a single custom field value
 */
export const getValue = query({
  args: {
    definitionId: v.id("customFieldDefinitions"),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customFieldValues")
      .withIndex("by_definition_entity", (q) =>
        q
          .eq("definitionId", args.definitionId)
          .eq("entityType", args.entityType)
          .eq("entityId", args.entityId)
      )
      .first();
  },
});

/**
 * Set a custom field value (create or update)
 */
export const setValue = mutation({
  args: {
    definitionId: v.id("customFieldDefinitions"),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify the definition exists and is active
    const definition = await ctx.db.get(args.definitionId);
    if (!definition) {
      throw new Error("Custom field definition not found");
    }
    if (!definition.isActive) {
      throw new Error("Custom field is not active");
    }
    if (definition.entityType !== args.entityType) {
      throw new Error("Entity type mismatch with field definition");
    }

    // Check if value already exists
    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_definition_entity", (q) =>
        q
          .eq("definitionId", args.definitionId)
          .eq("entityType", args.entityType)
          .eq("entityId", args.entityId)
      )
      .first();

    if (existing) {
      // Update existing value
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new value
      const valueId = await ctx.db.insert("customFieldValues", {
        definitionId: args.definitionId,
        entityType: args.entityType,
        entityId: args.entityId,
        value: args.value,
        createdAt: now,
        updatedAt: now,
      });
      return valueId;
    }
  },
});

/**
 * Set multiple custom field values at once
 */
export const setValues = mutation({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
    values: v.array(
      v.object({
        definitionId: v.id("customFieldDefinitions"),
        value: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Id<"customFieldValues">[] = [];

    for (const { definitionId, value } of args.values) {
      // Verify the definition exists and is active
      const definition = await ctx.db.get(definitionId);
      if (!definition) {
        continue; // Skip invalid definitions
      }
      if (!definition.isActive) {
        continue; // Skip inactive definitions
      }
      if (definition.entityType !== args.entityType) {
        continue; // Skip mismatched entity types
      }

      // Check if value already exists
      const existing = await ctx.db
        .query("customFieldValues")
        .withIndex("by_definition_entity", (q) =>
          q
            .eq("definitionId", definitionId)
            .eq("entityType", args.entityType)
            .eq("entityId", args.entityId)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        const valueId = await ctx.db.insert("customFieldValues", {
          definitionId,
          entityType: args.entityType,
          entityId: args.entityId,
          value,
          createdAt: now,
          updatedAt: now,
        });
        results.push(valueId);
      }
    }

    return results;
  },
});

/**
 * Delete a custom field value
 */
export const deleteValue = mutation({
  args: {
    definitionId: v.id("customFieldDefinitions"),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const value = await ctx.db
      .query("customFieldValues")
      .withIndex("by_definition_entity", (q) =>
        q
          .eq("definitionId", args.definitionId)
          .eq("entityType", args.entityType)
          .eq("entityId", args.entityId)
      )
      .first();

    if (value) {
      await ctx.db.delete(value._id);
      return { success: true };
    }

    return { success: false, message: "Value not found" };
  },
});

// ============================================================================
// HELPER QUERIES
// ============================================================================

/**
 * Get all entities that have a specific custom field value
 */
export const getEntitiesByFieldValue = query({
  args: {
    definitionId: v.id("customFieldDefinitions"),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.definitionId);
    if (!definition) {
      throw new Error("Custom field definition not found");
    }

    // Get all values for this definition
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_definition", (q) => q.eq("definitionId", args.definitionId))
      .collect();

    // Filter by value (simple equality check)
    const matchingValues = values.filter((v) => {
      if (typeof args.value === "object" && args.value !== null) {
        return JSON.stringify(v.value) === JSON.stringify(args.value);
      }
      return v.value === args.value;
    });

    return matchingValues.map((v) => ({
      entityType: v.entityType,
      entityId: v.entityId,
    }));
  },
});

/**
 * Get statistics about custom field usage
 */
export const getFieldStats = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
  },
  handler: async (ctx, args) => {
    const definitions = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType))
      .collect();

    const stats = await Promise.all(
      definitions.map(async (def) => {
        const values = await ctx.db
          .query("customFieldValues")
          .withIndex("by_definition", (q) => q.eq("definitionId", def._id))
          .collect();

        return {
          definition: def,
          totalValues: values.length,
          filledPercentage: 0, // Would need total entity count to calculate
        };
      })
    );

    return stats;
  },
});
