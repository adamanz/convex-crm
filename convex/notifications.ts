import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export const notificationTypes = v.union(
  v.literal("deal_won"),
  v.literal("deal_lost"),
  v.literal("deal_stage_change"),
  v.literal("task_assigned"),
  v.literal("task_due_soon"),
  v.literal("task_overdue"),
  v.literal("contact_created"),
  v.literal("message_received"),
  v.literal("mention"),
  v.literal("system")
);

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List notifications with pagination (cursor-based)
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), cursor))
      .order("desc")
      .take(limit + 1);

    // Filter unread only if requested
    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    const hasMore = notifications.length > limit;
    const items = notifications.slice(0, limit);

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get unread notification count
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_read")
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return notifications.length;
  },
});

/**
 * Get notification settings for current user
 */
export const getSettings = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real app, you'd fetch from a notificationSettings table
    return {
      dealUpdates: true,
      taskReminders: true,
      mentions: true,
      systemAlerts: true,
      emailNotifications: false,
      pushNotifications: true,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new notification
 */
export const create = mutation({
  args: {
    type: notificationTypes,
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    relatedEntityType: v.optional(
      v.union(
        v.literal("deal"),
        v.literal("contact"),
        v.literal("company"),
        v.literal("task"),
        v.literal("message")
      )
    ),
    relatedEntityId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      userId: args.userId,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark a single notification as read
 */
export const markRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.id, {
      read: true,
      readAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mark all notifications as read
 */
export const markAllRead = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read")
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    const now = Date.now();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
          readAt: now,
        })
      )
    );

    return unreadNotifications.length;
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

/**
 * Delete all read notifications
 */
export const clearRead = mutation({
  args: {},
  handler: async (ctx) => {
    const readNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read")
      .filter((q) => q.eq(q.field("read"), true))
      .collect();

    await Promise.all(
      readNotifications.map((notification) =>
        ctx.db.delete(notification._id)
      )
    );

    return readNotifications.length;
  },
});
