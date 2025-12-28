import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// ============================================================================
// USERS - Query and Mutation Functions
// ============================================================================

/**
 * List all users with optional filtering by role or active status
 */
export const list = query({
  args: {
    filter: v.optional(
      v.object({
        role: v.optional(
          v.union(v.literal("admin"), v.literal("manager"), v.literal("member"))
        ),
        isActive: v.optional(v.boolean()),
      })
    ),
    includeInactive: v.optional(v.boolean()),
    includeStats: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { filter, includeInactive, includeStats } = args;

    let users = await ctx.db.query("users").collect();

    // Apply filters
    if (filter?.role) {
      users = users.filter((user) => user.role === filter.role);
    }
    if (filter?.isActive !== undefined) {
      users = users.filter((user) => user.isActive === filter.isActive);
    }
    // Legacy support for includeInactive
    if (!includeInactive && !filter?.isActive) {
      users = users.filter((user) => user.isActive);
    }

    // Sort by name
    users.sort((a, b) => {
      const nameA = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim().toLowerCase();
      const nameB = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // If stats not requested, return users without stats
    if (!includeStats) {
      return users;
    }

    // Fetch stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count contacts owned
        const contactsOwned = await ctx.db
          .query("contacts")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();

        // Count deals owned
        const dealsOwned = await ctx.db
          .query("deals")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();

        // Calculate total deal value
        const totalDealValue = dealsOwned.reduce(
          (sum, deal) => sum + (deal.amount || 0),
          0
        );

        // Count activities created
        const activitiesCreated = await ctx.db
          .query("activities")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();

        return {
          ...user,
          stats: {
            contactsOwned: contactsOwned.length,
            dealsOwned: dealsOwned.length,
            activitiesCreated: activitiesCreated.length,
            totalDealValue,
          },
        };
      })
    );

    return usersWithStats;
  },
});

/**
 * Get a single user by ID with related stats
 */
export const get = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      return null;
    }

    // Count contacts owned
    const contactsOwned = await ctx.db
      .query("contacts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Count deals owned
    const dealsOwned = await ctx.db
      .query("deals")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Calculate total deal value
    const totalDealValue = dealsOwned.reduce(
      (sum, deal) => sum + (deal.amount || 0),
      0
    );

    // Count activities created
    const activitiesCreated = await ctx.db
      .query("activities")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Recent activities by this user
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(10);

    return {
      ...user,
      stats: {
        contactsOwned: contactsOwned.length,
        dealsOwned: dealsOwned.length,
        activitiesCreated: activitiesCreated.length,
        totalDealValue,
      },
      recentActivities,
    };
  },
});

/**
 * Get current user by Clerk ID
 */
export const getByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

/**
 * Get user by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

/**
 * Get team statistics
 */
export const getTeamStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stats = {
      totalMembers: users.length,
      activeMembers: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
      managers: users.filter((u) => u.role === "manager").length,
      members: users.filter((u) => u.role === "member").length,
      recentlyActive: users.filter((u) => u.lastActiveAt > oneWeekAgo).length,
    };

    return stats;
  },
});

/**
 * Create a new user (invite)
 */
export const create = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("member"))),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for duplicate email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      avatarUrl: args.avatarUrl,
      role: args.role ?? "member",
      clerkId: args.clerkId,
      isActive: true,
      lastActiveAt: now,
      createdAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "user_created",
      entityType: "user",
      entityId: userId,
      timestamp: now,
      system: true,
    });

    return userId;
  },
});

/**
 * Update an existing user
 */
export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    preferences: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check user exists
    const existingUser = await ctx.db.get(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check for duplicate email if being updated
    if (updates.email !== undefined && updates.email !== existingUser.email) {
      const duplicateUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      if (duplicateUser) {
        throw new Error("A user with this email already exists");
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"users">> = {
      lastActiveAt: now,
    };

    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "user_updated",
      entityType: "user",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Update a user's role
 */
export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { id, role } = args;
    const now = Date.now();

    // Check user exists
    const user = await ctx.db.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const previousRole = user.role;

    await ctx.db.patch(id, {
      role,
      lastActiveAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "user_role_updated",
      entityType: "user",
      entityId: id,
      changes: {
        previousRole,
        newRole: role,
      },
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Deactivate a user (soft delete)
 */
export const deactivate = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      lastActiveAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "user_deactivated",
      entityType: "user",
      entityId: args.id,
      timestamp: now,
      system: true,
    });

    return { success: true };
  },
});

/**
 * Reactivate a user
 */
export const reactivate = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      lastActiveAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "user_reactivated",
      entityType: "user",
      entityId: args.id,
      timestamp: now,
      system: true,
    });

    return { success: true };
  },
});

/**
 * Update last active timestamp
 */
export const updateLastActive = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.id, {
      lastActiveAt: now,
    });

    return args.id;
  },
});
