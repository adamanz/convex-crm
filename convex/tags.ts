import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// ============================================================================
// TAGS - Query and Mutation Functions
// ============================================================================

// Default tag colors for new tags
export const TAG_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
] as const;

/**
 * List all tags, optionally sorted by usage
 */
export const list = query({
  args: {
    sortBy: v.optional(v.union(v.literal("name"), v.literal("usage"), v.literal("created"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sortBy = "name", limit } = args;

    let tagsQuery;

    switch (sortBy) {
      case "usage":
        tagsQuery = ctx.db.query("tags").withIndex("by_usage").order("desc");
        break;
      case "created":
        tagsQuery = ctx.db.query("tags").order("desc");
        break;
      case "name":
      default:
        tagsQuery = ctx.db.query("tags").withIndex("by_name");
        break;
    }

    if (limit) {
      return await tagsQuery.take(limit);
    }

    return await tagsQuery.collect();
  },
});

/**
 * Get a single tag by ID
 */
export const get = query({
  args: {
    id: v.id("tags"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a tag by name (case-insensitive search)
 */
export const getByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.toLowerCase().trim();
    const tags = await ctx.db.query("tags").withIndex("by_name").collect();
    return tags.find((tag) => tag.name.toLowerCase() === normalizedName) ?? null;
  },
});

/**
 * Search tags by name prefix (for autocomplete)
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, limit = 10 } = args;
    const normalizedSearch = searchTerm.toLowerCase().trim();

    if (!normalizedSearch) {
      // Return most used tags if no search term
      return await ctx.db
        .query("tags")
        .withIndex("by_usage")
        .order("desc")
        .take(limit);
    }

    const allTags = await ctx.db.query("tags").collect();

    // Filter and sort by relevance
    const filtered = allTags
      .filter((tag) => tag.name.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        // Prioritize tags that start with the search term
        const aStarts = a.name.toLowerCase().startsWith(normalizedSearch);
        const bStarts = b.name.toLowerCase().startsWith(normalizedSearch);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        // Then sort by usage count
        return b.usageCount - a.usageCount;
      });

    return filtered.slice(0, limit);
  },
});

/**
 * Get multiple tags by their names
 */
export const getByNames = query({
  args: {
    names: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedNames = args.names.map((n) => n.toLowerCase().trim());
    const allTags = await ctx.db.query("tags").collect();

    const tagMap: Record<string, Doc<"tags">> = {};
    for (const tag of allTags) {
      if (normalizedNames.includes(tag.name.toLowerCase())) {
        tagMap[tag.name.toLowerCase()] = tag;
      }
    }

    // Return in order of input names, preserving original case
    return args.names
      .map((name) => tagMap[name.toLowerCase().trim()])
      .filter((t): t is Doc<"tags"> => t !== undefined);
  },
});

/**
 * Create a new tag
 */
export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalizedName = args.name.trim();

    if (!normalizedName) {
      throw new Error("Tag name cannot be empty");
    }

    // Check for duplicate name (case-insensitive)
    const existingTags = await ctx.db.query("tags").collect();
    const duplicate = existingTags.find(
      (tag) => tag.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (duplicate) {
      throw new Error(`A tag with the name "${normalizedName}" already exists`);
    }

    // Assign a color if not provided
    const color = args.color || TAG_COLORS[existingTags.length % TAG_COLORS.length];

    const tagId = await ctx.db.insert("tags", {
      name: normalizedName,
      color,
      description: args.description,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return tagId;
  },
});

/**
 * Create a tag if it doesn't exist, otherwise return existing
 */
export const getOrCreate = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.name.trim();

    if (!normalizedName) {
      throw new Error("Tag name cannot be empty");
    }

    // Check for existing tag
    const existingTags = await ctx.db.query("tags").collect();
    const existing = existingTags.find(
      (tag) => tag.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (existing) {
      return existing._id;
    }

    // Create new tag
    const now = Date.now();
    const color = args.color || TAG_COLORS[existingTags.length % TAG_COLORS.length];

    const tagId = await ctx.db.insert("tags", {
      name: normalizedName,
      color,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return tagId;
  },
});

/**
 * Update an existing tag
 */
export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existingTag = await ctx.db.get(id);
    if (!existingTag) {
      throw new Error("Tag not found");
    }

    // If updating name, check for duplicates
    if (updates.name !== undefined) {
      const normalizedName = updates.name.trim();

      if (!normalizedName) {
        throw new Error("Tag name cannot be empty");
      }

      const allTags = await ctx.db.query("tags").collect();
      const duplicate = allTags.find(
        (tag) =>
          tag._id !== id &&
          tag.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        throw new Error(`A tag with the name "${normalizedName}" already exists`);
      }
    }

    const updateData: Partial<Doc<"tags">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.description !== undefined) updateData.description = updates.description;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a tag
 */
export const delete_ = mutation({
  args: {
    id: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.id);
    if (!tag) {
      throw new Error("Tag not found");
    }

    // Note: This doesn't remove the tag from entities that use it.
    // The tag name strings on contacts/companies/deals will remain.
    // This is intentional - orphaned tag references are handled gracefully.

    await ctx.db.delete(args.id);

    return { success: true, deletedTagName: tag.name };
  },
});

/**
 * Increment usage count for a tag (call when tag is applied to an entity)
 */
export const incrementUsage = mutation({
  args: {
    tagName: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.tagName.toLowerCase().trim();
    const tags = await ctx.db.query("tags").collect();
    const tag = tags.find((t) => t.name.toLowerCase() === normalizedName);

    if (tag) {
      await ctx.db.patch(tag._id, {
        usageCount: tag.usageCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Decrement usage count for a tag (call when tag is removed from an entity)
 */
export const decrementUsage = mutation({
  args: {
    tagName: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = args.tagName.toLowerCase().trim();
    const tags = await ctx.db.query("tags").collect();
    const tag = tags.find((t) => t.name.toLowerCase() === normalizedName);

    if (tag && tag.usageCount > 0) {
      await ctx.db.patch(tag._id, {
        usageCount: tag.usageCount - 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Recalculate usage counts for all tags (maintenance operation)
 * Scans contacts, companies, and deals to get accurate counts
 */
export const recalculateUsageCounts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all tags
    const tags = await ctx.db.query("tags").collect();

    // Get all entities with tags
    const contacts = await ctx.db.query("contacts").collect();
    const companies = await ctx.db.query("companies").collect();
    const deals = await ctx.db.query("deals").collect();

    // Count tag usage
    const usageCounts: Record<string, number> = {};

    for (const tag of tags) {
      usageCounts[tag.name.toLowerCase()] = 0;
    }

    // Count in contacts
    for (const contact of contacts) {
      for (const tagName of contact.tags) {
        const key = tagName.toLowerCase();
        if (key in usageCounts) {
          usageCounts[key]++;
        }
      }
    }

    // Count in companies
    for (const company of companies) {
      for (const tagName of company.tags) {
        const key = tagName.toLowerCase();
        if (key in usageCounts) {
          usageCounts[key]++;
        }
      }
    }

    // Count in deals
    for (const deal of deals) {
      for (const tagName of deal.tags) {
        const key = tagName.toLowerCase();
        if (key in usageCounts) {
          usageCounts[key]++;
        }
      }
    }

    // Update all tags
    for (const tag of tags) {
      const newCount = usageCounts[tag.name.toLowerCase()] || 0;
      if (tag.usageCount !== newCount) {
        await ctx.db.patch(tag._id, {
          usageCount: newCount,
          updatedAt: now,
        });
      }
    }

    return {
      tagsUpdated: tags.length,
      timestamp: now,
    };
  },
});

/**
 * Get tag statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query("tags").collect();

    const totalTags = tags.length;
    const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0);
    const unusedTags = tags.filter((tag) => tag.usageCount === 0).length;
    const mostUsed = tags.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

    return {
      totalTags,
      totalUsage,
      unusedTags,
      averageUsage: totalTags > 0 ? totalUsage / totalTags : 0,
      mostUsed: mostUsed.map((t) => ({ name: t.name, count: t.usageCount, color: t.color })),
    };
  },
});

/**
 * Bulk create tags (useful for seeding)
 */
export const bulkCreate = mutation({
  args: {
    tags: v.array(
      v.object({
        name: v.string(),
        color: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingTags = await ctx.db.query("tags").collect();
    const existingNames = new Set(existingTags.map((t) => t.name.toLowerCase()));

    const createdIds: string[] = [];
    let colorIndex = existingTags.length;

    for (const tagData of args.tags) {
      const normalizedName = tagData.name.trim();

      if (!normalizedName || existingNames.has(normalizedName.toLowerCase())) {
        continue; // Skip empty or duplicate names
      }

      const color = tagData.color || TAG_COLORS[colorIndex % TAG_COLORS.length];
      colorIndex++;

      const tagId = await ctx.db.insert("tags", {
        name: normalizedName,
        color,
        description: tagData.description,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      createdIds.push(tagId);
      existingNames.add(normalizedName.toLowerCase());
    }

    return {
      created: createdIds.length,
      tagIds: createdIds,
    };
  },
});
