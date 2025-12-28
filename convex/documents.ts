import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List all documents with optional filtering by related entity
 */
export const list = query({
  args: {
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal"),
        v.literal("activity")
      )
    ),
    relatedToId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const cursor = args.cursor ?? Date.now();

    let documentsQuery;

    if (args.relatedToType && args.relatedToId) {
      // Filter by related entity
      documentsQuery = ctx.db
        .query("documents")
        .withIndex("by_related", (q) =>
          q
            .eq("relatedToType", args.relatedToType)
            .eq("relatedToId", args.relatedToId)
        );
    } else {
      // Get all documents ordered by creation date
      documentsQuery = ctx.db
        .query("documents")
        .withIndex("by_created")
        .filter((q) => q.lt(q.field("createdAt"), cursor));
    }

    const documents = await documentsQuery.order("desc").take(limit + 1);

    const hasMore = documents.length > limit;
    const items = documents.slice(0, limit);

    // Get file URLs for each document
    const documentsWithUrls = await Promise.all(
      items.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploader = doc.uploadedBy
          ? await ctx.db.get(doc.uploadedBy)
          : null;
        return {
          ...doc,
          url,
          uploader,
        };
      })
    );

    return {
      items: documentsWithUrls,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].createdAt : null,
    };
  },
});

/**
 * Get a single document by ID
 */
export const get = query({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      return null;
    }

    const url = await ctx.storage.getUrl(document.storageId);
    const uploader = document.uploadedBy
      ? await ctx.db.get(document.uploadedBy)
      : null;

    return {
      ...document,
      url,
      uploader,
    };
  },
});

/**
 * Get documents for a specific entity (contact, company, deal, activity)
 */
export const byEntity = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal"),
      v.literal("activity")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", args.entityType).eq("relatedToId", args.entityId)
      )
      .order("desc")
      .collect();

    // Get file URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return {
          ...doc,
          url,
        };
      })
    );

    return documentsWithUrls;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Generate an upload URL for file upload
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a document record after file upload
 */
export const create = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal"),
        v.literal("activity")
      )
    ),
    relatedToId: v.optional(v.string()),
    description: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const documentId = await ctx.db.insert("documents", {
      name: args.name,
      storageId: args.storageId,
      mimeType: args.mimeType,
      size: args.size,
      relatedToType: args.relatedToType,
      relatedToId: args.relatedToId,
      description: args.description,
      uploadedBy: args.uploadedBy,
      tags: args.tags ?? [],
      createdAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "document_uploaded",
      entityType: "document",
      entityId: documentId,
      metadata: {
        fileName: args.name,
        fileSize: args.size,
        mimeType: args.mimeType,
        relatedToType: args.relatedToType,
        relatedToId: args.relatedToId,
      },
      timestamp: now,
      system: true,
    });

    return documentId;
  },
});

/**
 * Delete a document
 */
export const remove = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Delete the file from storage
    await ctx.storage.delete(document.storageId);

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "document_deleted",
      entityType: "document",
      entityId: args.id,
      metadata: {
        deletedDocument: {
          name: document.name,
          mimeType: document.mimeType,
          size: document.size,
        },
      },
      timestamp: Date.now(),
      system: true,
    });

    // Delete the document record
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Update document metadata
 */
export const update = mutation({
  args: {
    id: v.id("documents"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal"),
        v.literal("activity")
      )
    ),
    relatedToId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const document = await ctx.db.get(id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Build update object with only defined fields
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.relatedToType !== undefined)
      updateData.relatedToType = updates.relatedToType;
    if (updates.relatedToId !== undefined)
      updateData.relatedToId = updates.relatedToId;

    await ctx.db.patch(id, updateData);

    return id;
  },
});
