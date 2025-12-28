import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// ENTITY TYPES
// =============================================================================

export const entityTypes = v.union(
  v.literal("contact"),
  v.literal("company"),
  v.literal("deal"),
  v.literal("activity")
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract @mentions from content
 * Matches patterns like @username or @[User Name]
 * Returns array of potential usernames/names to look up
 */
export function extractMentionsFromContent(content: string): string[] {
  const mentions: string[] = [];

  // Match @[Name with spaces] pattern
  const bracketPattern = /@\[([^\]]+)\]/g;
  let match;
  while ((match = bracketPattern.exec(content)) !== null) {
    mentions.push(match[1].trim());
  }

  // Match @username pattern (no spaces, alphanumeric + underscore)
  const simplePattern = /@(\w+)/g;
  while ((match = simplePattern.exec(content)) !== null) {
    // Don't include if it's part of a bracket mention
    if (!content.includes(`@[${match[1]}`)) {
      mentions.push(match[1].trim());
    }
  }

  return Array.from(new Set(mentions)); // Remove duplicates
}

/**
 * Get entity name for notification messages
 */
async function getEntityName(
  ctx: { db: { get: (id: any) => Promise<any> } },
  entityType: string,
  entityId: string
): Promise<string> {
  try {
    if (entityType === "contact") {
      const contact = await ctx.db.get(entityId as Id<"contacts">);
      if (contact) {
        return [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Contact";
      }
    } else if (entityType === "company") {
      const company = await ctx.db.get(entityId as Id<"companies">);
      if (company) {
        return company.name || "Company";
      }
    } else if (entityType === "deal") {
      const deal = await ctx.db.get(entityId as Id<"deals">);
      if (deal) {
        return deal.name || "Deal";
      }
    } else if (entityType === "activity") {
      const activity = await ctx.db.get(entityId as Id<"activities">);
      if (activity) {
        return activity.subject || "Activity";
      }
    }
  } catch {
    // Entity not found
  }
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

/**
 * Get entity link for notifications
 */
function getEntityLink(entityType: string, entityId: string): string {
  switch (entityType) {
    case "contact":
      return `/contacts/${entityId}`;
    case "company":
      return `/companies/${entityId}`;
    case "deal":
      return `/deals/${entityId}`;
    case "activity":
      return `/activities/${entityId}`;
    default:
      return "/";
  }
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List comments for a specific entity
 */
export const list = query({
  args: {
    entityType: entityTypes,
    entityId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    includeReplies: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const cursor = args.cursor ?? Date.now() + 1000; // Start from future to get all

    // Get comments for this entity
    let commentsQuery = ctx.db
      .query("comments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cursor),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .order("desc");

    // If not including replies, filter for top-level only
    if (!args.includeReplies) {
      commentsQuery = commentsQuery.filter((q) =>
        q.eq(q.field("parentId"), undefined)
      );
    }

    const comments = await commentsQuery.take(limit + 1);

    const hasMore = comments.length > limit;
    const items = comments.slice(0, limit);

    // Enrich with author info
    const enrichedComments = await Promise.all(
      items.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);

        // Get reply count for top-level comments
        let replyCount = 0;
        if (!comment.parentId) {
          const replies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q) => q.eq("parentId", comment._id))
            .filter((q) => q.eq(q.field("isDeleted"), false))
            .collect();
          replyCount = replies.length;
        }

        // Get mentioned users' info
        const mentionedUsers = await Promise.all(
          comment.mentions.map(async (userId) => {
            const user = await ctx.db.get(userId);
            return user
              ? {
                  _id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  avatarUrl: user.avatarUrl,
                }
              : null;
          })
        );

        return {
          ...comment,
          author: author
            ? {
                _id: author._id,
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
                avatarUrl: author.avatarUrl,
              }
            : null,
          mentionedUsers: mentionedUsers.filter(Boolean),
          replyCount,
        };
      })
    );

    return {
      items: enrichedComments,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get a single comment by ID
 */
export const get = query({
  args: {
    id: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment || comment.isDeleted) {
      return null;
    }

    const author = await ctx.db.get(comment.authorId);

    // Get mentioned users' info
    const mentionedUsers = await Promise.all(
      comment.mentions.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user
          ? {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }
          : null;
      })
    );

    return {
      ...comment,
      author: author
        ? {
            _id: author._id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            avatarUrl: author.avatarUrl,
          }
        : null,
      mentionedUsers: mentionedUsers.filter(Boolean),
    };
  },
});

/**
 * Get replies to a comment
 */
export const getReplies = query({
  args: {
    parentId: v.id("comments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("asc") // Oldest first for replies
      .take(limit);

    // Enrich with author info
    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);

        const mentionedUsers = await Promise.all(
          reply.mentions.map(async (userId) => {
            const user = await ctx.db.get(userId);
            return user
              ? {
                  _id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  avatarUrl: user.avatarUrl,
                }
              : null;
          })
        );

        return {
          ...reply,
          author: author
            ? {
                _id: author._id,
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
                avatarUrl: author.avatarUrl,
              }
            : null,
          mentionedUsers: mentionedUsers.filter(Boolean),
        };
      })
    );

    return enrichedReplies;
  },
});

/**
 * Get comments where a user is mentioned
 */
export const getMentions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now() + 1000;

    // Get all comments and filter by mentions (since we can't index into arrays)
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_created")
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cursor),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .order("desc")
      .take(200); // Get more to filter

    // Filter for comments that mention this user
    const mentioningComments = allComments.filter((comment) =>
      comment.mentions.some((mentionId) => mentionId === args.userId)
    );

    const hasMore = mentioningComments.length > limit;
    const items = mentioningComments.slice(0, limit);

    // Enrich with author and entity info
    const enrichedComments = await Promise.all(
      items.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const entityName = await getEntityName(ctx, comment.entityType, comment.entityId);

        return {
          ...comment,
          author: author
            ? {
                _id: author._id,
                firstName: author.firstName,
                lastName: author.lastName,
                email: author.email,
                avatarUrl: author.avatarUrl,
              }
            : null,
          entityName,
          entityLink: getEntityLink(comment.entityType, comment.entityId),
        };
      })
    );

    return {
      items: enrichedComments,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get comments by author
 */
export const getByAuthor = query({
  args: {
    authorId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now() + 1000;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .filter((q) =>
        q.and(
          q.lt(q.field("createdAt"), cursor),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .order("desc")
      .take(limit + 1);

    const hasMore = comments.length > limit;
    const items = comments.slice(0, limit);

    // Enrich with entity info
    const enrichedComments = await Promise.all(
      items.map(async (comment) => {
        const entityName = await getEntityName(ctx, comment.entityType, comment.entityId);

        return {
          ...comment,
          entityName,
          entityLink: getEntityLink(comment.entityType, comment.entityId),
        };
      })
    );

    return {
      items: enrichedComments,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new comment
 */
export const create = mutation({
  args: {
    content: v.string(),
    authorId: v.id("users"),
    entityType: entityTypes,
    entityId: v.string(),
    parentId: v.optional(v.id("comments")),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If parentId provided, verify the parent exists and is not deleted
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.isDeleted) {
        throw new Error("Parent comment not found");
      }
      // Ensure reply is to the same entity
      if (parent.entityType !== args.entityType || parent.entityId !== args.entityId) {
        throw new Error("Reply must be to the same entity");
      }
    }

    // Extract mentions from content if not provided
    let mentionedUserIds: Id<"users">[] = args.mentions || [];

    if (!args.mentions || args.mentions.length === 0) {
      // Parse mentions from content
      const mentionStrings = extractMentionsFromContent(args.content);

      // Look up users by name or email
      if (mentionStrings.length > 0) {
        const allUsers = await ctx.db.query("users").collect();

        for (const mention of mentionStrings) {
          const lowerMention = mention.toLowerCase();
          const user = allUsers.find((u) => {
            const fullName = [u.firstName, u.lastName]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return (
              fullName === lowerMention ||
              u.email?.toLowerCase() === lowerMention ||
              u.firstName?.toLowerCase() === lowerMention ||
              u.lastName?.toLowerCase() === lowerMention
            );
          });
          if (user) {
            mentionedUserIds.push(user._id);
          }
        }
      }
    }

    // Remove duplicates and the author from mentions
    mentionedUserIds = Array.from(new Set(mentionedUserIds)).filter(
      (id) => id !== args.authorId
    );

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      content: args.content,
      authorId: args.authorId,
      entityType: args.entityType,
      entityId: args.entityId,
      parentId: args.parentId,
      mentions: mentionedUserIds,
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const author = await ctx.db.get(args.authorId);
      const authorName = author
        ? [author.firstName, author.lastName].filter(Boolean).join(" ") ||
          author.email
        : "Someone";
      const entityName = await getEntityName(ctx, args.entityType, args.entityId);
      const entityLink = getEntityLink(args.entityType, args.entityId);

      await Promise.all(
        mentionedUserIds.map((userId) =>
          ctx.db.insert("notifications", {
            type: "mention",
            title: `${authorName} mentioned you`,
            message: `You were mentioned in a comment on ${entityName}`,
            link: entityLink,
            relatedEntityType: args.entityType === "activity" ? "task" : args.entityType as "deal" | "contact" | "company" | "task" | "message",
            relatedEntityId: args.entityId,
            userId,
            read: false,
            createdAt: now,
          })
        )
      );
    }

    return commentId;
  },
});

/**
 * Update an existing comment
 */
export const update = mutation({
  args: {
    id: v.id("comments"),
    content: v.string(),
    authorId: v.id("users"), // Used to verify ownership
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.isDeleted) {
      throw new Error("Cannot edit a deleted comment");
    }
    if (comment.authorId !== args.authorId) {
      throw new Error("You can only edit your own comments");
    }

    const now = Date.now();

    // Re-extract mentions from updated content
    const mentionStrings = extractMentionsFromContent(args.content);
    let mentionedUserIds: Id<"users">[] = [];

    if (mentionStrings.length > 0) {
      const allUsers = await ctx.db.query("users").collect();

      for (const mention of mentionStrings) {
        const lowerMention = mention.toLowerCase();
        const user = allUsers.find((u) => {
          const fullName = [u.firstName, u.lastName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return (
            fullName === lowerMention ||
            u.email?.toLowerCase() === lowerMention ||
            u.firstName?.toLowerCase() === lowerMention ||
            u.lastName?.toLowerCase() === lowerMention
          );
        });
        if (user) {
          mentionedUserIds.push(user._id);
        }
      }
    }

    // Remove duplicates and the author
    mentionedUserIds = Array.from(new Set(mentionedUserIds)).filter(
      (id) => id !== args.authorId
    );

    // Find newly mentioned users (for notifications)
    const newMentions = mentionedUserIds.filter(
      (id) => !comment.mentions.includes(id)
    );

    await ctx.db.patch(args.id, {
      content: args.content,
      mentions: mentionedUserIds,
      isEdited: true,
      updatedAt: now,
    });

    // Create notifications for newly mentioned users
    if (newMentions.length > 0) {
      const author = await ctx.db.get(args.authorId);
      const authorName = author
        ? [author.firstName, author.lastName].filter(Boolean).join(" ") ||
          author.email
        : "Someone";
      const entityName = await getEntityName(ctx, comment.entityType, comment.entityId);
      const entityLink = getEntityLink(comment.entityType, comment.entityId);

      await Promise.all(
        newMentions.map((userId) =>
          ctx.db.insert("notifications", {
            type: "mention",
            title: `${authorName} mentioned you`,
            message: `You were mentioned in a comment on ${entityName}`,
            link: entityLink,
            relatedEntityType: comment.entityType === "activity" ? "task" : comment.entityType as "deal" | "contact" | "company" | "task" | "message",
            relatedEntityId: comment.entityId,
            userId,
            read: false,
            createdAt: now,
          })
        )
      );
    }

    return args.id;
  },
});

/**
 * Soft delete a comment
 */
export const delete_ = mutation({
  args: {
    id: v.id("comments"),
    authorId: v.id("users"), // Used to verify ownership (or admin)
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.isDeleted) {
      return args.id; // Already deleted
    }

    // Verify ownership (in production, also check for admin role)
    if (comment.authorId !== args.authorId) {
      // Check if user is admin
      const user = await ctx.db.get(args.authorId);
      if (!user || user.role !== "admin") {
        throw new Error("You can only delete your own comments");
      }
    }

    await ctx.db.patch(args.id, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Get comment count for an entity
 */
export const count = query({
  args: {
    entityType: entityTypes,
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return comments.length;
  },
});

/**
 * Search users for mention autocomplete
 */
export const searchUsersForMention = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const queryLower = args.query.toLowerCase();

    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const matchingUsers = allUsers
      .filter((user) => {
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          fullName.includes(queryLower) ||
          user.email?.toLowerCase().includes(queryLower) ||
          user.firstName?.toLowerCase().includes(queryLower) ||
          user.lastName?.toLowerCase().includes(queryLower)
        );
      })
      .slice(0, limit);

    return matchingUsers.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }));
  },
});
