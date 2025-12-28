import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Activity timeline feed with pagination
 * Returns activities sorted by creation date (newest first)
 */
export const feed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    type: v.optional(
      v.union(
        v.literal("task"),
        v.literal("call"),
        v.literal("email"),
        v.literal("meeting"),
        v.literal("note")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    let activitiesQuery = ctx.db
      .query("activities")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), cursor))
      .order("desc");

    const activities = await activitiesQuery.take(limit + 1);

    // Filter by type and owner in memory (if specified)
    let filtered = activities;
    if (args.type) {
      filtered = filtered.filter((a) => a.type === args.type);
    }
    if (args.ownerId) {
      filtered = filtered.filter((a) => a.ownerId === args.ownerId);
    }

    const hasMore = filtered.length > limit;
    const items = filtered.slice(0, limit);

    // Get related entities for enrichment
    const enrichedItems = await Promise.all(
      items.map(async (activity) => {
        let relatedEntity = null;
        if (activity.relatedToType === "contact") {
          relatedEntity = await ctx.db.get(
            activity.relatedToId as Id<"contacts">
          );
        } else if (activity.relatedToType === "company") {
          relatedEntity = await ctx.db.get(
            activity.relatedToId as Id<"companies">
          );
        } else if (activity.relatedToType === "deal") {
          relatedEntity = await ctx.db.get(activity.relatedToId as Id<"deals">);
        }

        const owner = activity.ownerId
          ? await ctx.db.get(activity.ownerId)
          : null;
        const assignedTo = activity.assignedToId
          ? await ctx.db.get(activity.assignedToId)
          : null;

        return {
          ...activity,
          relatedEntity,
          owner,
          assignedTo,
        };
      })
    );

    return {
      items: enrichedItems,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get activities for a specific contact, company, or deal
 */
export const byRelated = query({
  args: {
    relatedToType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    relatedToId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", args.relatedToType).eq("relatedToId", args.relatedToId)
      )
      .filter((q) => q.lt(q.field("createdAt"), cursor))
      .order("desc")
      .take(limit + 1);

    const hasMore = activities.length > limit;
    const items = activities.slice(0, limit);

    // Enrich with owner/assignee info
    const enrichedItems = await Promise.all(
      items.map(async (activity) => {
        const owner = activity.ownerId
          ? await ctx.db.get(activity.ownerId)
          : null;
        const assignedTo = activity.assignedToId
          ? await ctx.db.get(activity.assignedToId)
          : null;

        return {
          ...activity,
          owner,
          assignedTo,
        };
      })
    );

    return {
      items: enrichedItems,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get upcoming tasks (incomplete tasks with due dates)
 */
export const upcoming = query({
  args: {
    assignedToId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    includeOverdue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const now = Date.now();

    // Get tasks with due dates
    const tasks = await ctx.db
      .query("activities")
      .withIndex("by_due_date")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "task"),
          q.neq(q.field("completed"), true),
          q.neq(q.field("dueDate"), undefined)
        )
      )
      .order("asc")
      .take(100); // Get more to filter

    // Filter by assignee if specified
    let filtered = tasks;
    if (args.assignedToId) {
      filtered = filtered.filter((t) => t.assignedToId === args.assignedToId);
    }

    // Filter out overdue if not requested
    if (!args.includeOverdue) {
      filtered = filtered.filter((t) => t.dueDate! >= now);
    }

    const items = filtered.slice(0, limit);

    // Enrich with related entity and assignee
    const enrichedItems = await Promise.all(
      items.map(async (task) => {
        let relatedEntity = null;
        if (task.relatedToType === "contact") {
          relatedEntity = await ctx.db.get(task.relatedToId as Id<"contacts">);
        } else if (task.relatedToType === "company") {
          relatedEntity = await ctx.db.get(
            task.relatedToId as Id<"companies">
          );
        } else if (task.relatedToType === "deal") {
          relatedEntity = await ctx.db.get(task.relatedToId as Id<"deals">);
        }

        const assignedTo = task.assignedToId
          ? await ctx.db.get(task.assignedToId)
          : null;

        const isOverdue = task.dueDate! < now;

        return {
          ...task,
          relatedEntity,
          assignedTo,
          isOverdue,
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Get a single activity by ID
 */
export const get = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) return null;

    let relatedEntity = null;
    if (activity.relatedToType === "contact") {
      relatedEntity = await ctx.db.get(activity.relatedToId as Id<"contacts">);
    } else if (activity.relatedToType === "company") {
      relatedEntity = await ctx.db.get(
        activity.relatedToId as Id<"companies">
      );
    } else if (activity.relatedToType === "deal") {
      relatedEntity = await ctx.db.get(activity.relatedToId as Id<"deals">);
    }

    const owner = activity.ownerId ? await ctx.db.get(activity.ownerId) : null;
    const assignedTo = activity.assignedToId
      ? await ctx.db.get(activity.assignedToId)
      : null;

    return {
      ...activity,
      relatedEntity,
      owner,
      assignedTo,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new activity
 */
export const create = mutation({
  args: {
    type: v.union(
      v.literal("task"),
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note")
    ),
    subject: v.string(),
    description: v.optional(v.string()),
    relatedToType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    relatedToId: v.string(),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    duration: v.optional(v.number()),
    outcome: v.optional(v.string()),
    emailDirection: v.optional(
      v.union(v.literal("inbound"), v.literal("outbound"))
    ),
    ownerId: v.optional(v.id("users")),
    assignedToId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      subject: args.subject,
      description: args.description,
      relatedToType: args.relatedToType,
      relatedToId: args.relatedToId,
      dueDate: args.dueDate,
      priority: args.priority,
      duration: args.duration,
      outcome: args.outcome,
      emailDirection: args.emailDirection,
      ownerId: args.ownerId,
      assignedToId: args.assignedToId,
      completed: args.type === "task" ? false : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Update lastActivityAt on the related entity
    if (args.relatedToType === "contact") {
      const contactId = args.relatedToId as Id<"contacts">;
      const contact = await ctx.db.get(contactId);
      if (contact) {
        await ctx.db.patch(contactId, { lastActivityAt: now });
      }
    }

    // Trigger webhook
    const newActivity = await ctx.db.get(activityId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "activity.created",
      payload: {
        activity: newActivity,
      },
    });

    return activityId;
  },
});

/**
 * Update an activity
 */
export const update = mutation({
  args: {
    id: v.id("activities"),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    duration: v.optional(v.number()),
    outcome: v.optional(v.string()),
    assignedToId: v.optional(v.id("users")),
    aiSummary: v.optional(v.string()),
    sentiment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Activity not found");
    }

    // Build update object, only including defined values
    const updateData: Partial<Doc<"activities">> = {
      updatedAt: Date.now(),
    };

    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.outcome !== undefined) updateData.outcome = updates.outcome;
    if (updates.assignedToId !== undefined)
      updateData.assignedToId = updates.assignedToId;
    if (updates.aiSummary !== undefined)
      updateData.aiSummary = updates.aiSummary;
    if (updates.sentiment !== undefined)
      updateData.sentiment = updates.sentiment;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Mark a task as complete
 */
export const complete = mutation({
  args: {
    id: v.id("activities"),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) {
      throw new Error("Activity not found");
    }

    if (activity.type !== "task") {
      throw new Error("Only tasks can be marked as complete");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      completed: true,
      completedAt: now,
      outcome: args.outcome,
      updatedAt: now,
    });

    // Update lastActivityAt on the related contact
    if (activity.relatedToType === "contact") {
      const contactId = activity.relatedToId as Id<"contacts">;
      const contact = await ctx.db.get(contactId);
      if (contact) {
        await ctx.db.patch(contactId, { lastActivityAt: now });
      }
    }

    // Trigger webhook
    const completedActivity = await ctx.db.get(args.id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "activity.completed",
      payload: {
        activity: completedActivity,
      },
    });

    return args.id;
  },
});

/**
 * Delete an activity
 */
export const delete_ = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) {
      throw new Error("Activity not found");
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

/**
 * Reopen a completed task
 */
export const reopen = mutation({
  args: {
    id: v.id("activities"),
    newDueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) {
      throw new Error("Activity not found");
    }

    if (activity.type !== "task") {
      throw new Error("Only tasks can be reopened");
    }

    await ctx.db.patch(args.id, {
      completed: false,
      completedAt: undefined,
      dueDate: args.newDueDate ?? activity.dueDate,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
