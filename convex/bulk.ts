import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// BULK OPERATIONS - Mutations for batch updates and deletions
// ============================================================================

/**
 * Bulk update multiple contacts with the same field values
 */
export const bulkUpdateContacts = mutation({
  args: {
    ids: v.array(v.id("contacts")),
    updates: v.object({
      companyId: v.optional(v.id("companies")),
      ownerId: v.optional(v.id("users")),
      source: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      // Address fields
      address: v.optional(
        v.object({
          street: v.optional(v.string()),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          postalCode: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { ids, updates } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No contacts selected");
    }

    if (ids.length > 100) {
      throw new Error("Cannot update more than 100 contacts at once");
    }

    // Validate company exists if being updated
    if (updates.companyId !== undefined) {
      const company = await ctx.db.get(updates.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"contacts">> = {
      updatedAt: now,
    };

    if (updates.companyId !== undefined) updateData.companyId = updates.companyId;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.address !== undefined) updateData.address = updates.address;

    // Update all contacts
    const results: { id: Id<"contacts">; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const contact = await ctx.db.get(id);
        if (!contact) {
          results.push({ id, success: false, error: "Contact not found" });
          continue;
        }

        await ctx.db.patch(id, updateData);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log the bulk activity
    await ctx.db.insert("activityLog", {
      action: "bulk_contacts_updated",
      entityType: "contact",
      entityId: ids[0], // Reference the first contact
      metadata: {
        totalCount: ids.length,
        successCount: results.filter((r) => r.success).length,
        updates: Object.keys(updates),
      },
      timestamp: now,
      system: true,
    });

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Bulk update multiple deals with the same field values
 */
export const bulkUpdateDeals = mutation({
  args: {
    ids: v.array(v.id("deals")),
    updates: v.object({
      ownerId: v.optional(v.id("users")),
      stageId: v.optional(v.string()),
      pipelineId: v.optional(v.id("pipelines")),
      status: v.optional(
        v.union(v.literal("open"), v.literal("won"), v.literal("lost"))
      ),
      tags: v.optional(v.array(v.string())),
      probability: v.optional(v.number()),
      expectedCloseDate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { ids, updates } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No deals selected");
    }

    if (ids.length > 100) {
      throw new Error("Cannot update more than 100 deals at once");
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Validate pipeline and stage if being updated
    if (updates.pipelineId !== undefined || updates.stageId !== undefined) {
      // We need a pipeline to validate the stage
      const pipelineId = updates.pipelineId;
      if (pipelineId) {
        const pipeline = await ctx.db.get(pipelineId);
        if (!pipeline) {
          throw new Error("Pipeline not found");
        }

        if (updates.stageId !== undefined) {
          const stageExists = pipeline.stages.some(
            (s) => s.id === updates.stageId
          );
          if (!stageExists) {
            throw new Error("Invalid stage for this pipeline");
          }
        }
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"deals">> = {
      updatedAt: now,
    };

    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.probability !== undefined) updateData.probability = updates.probability;
    if (updates.expectedCloseDate !== undefined)
      updateData.expectedCloseDate = updates.expectedCloseDate;

    // Handle stage change
    const stageChange = updates.stageId !== undefined;
    if (stageChange) {
      updateData.stageId = updates.stageId;
      updateData.stageChangedAt = now;
    }

    if (updates.pipelineId !== undefined) updateData.pipelineId = updates.pipelineId;

    // Update all deals
    const results: { id: Id<"deals">; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const deal = await ctx.db.get(id);
        if (!deal) {
          results.push({ id, success: false, error: "Deal not found" });
          continue;
        }

        // For stage changes without a pipeline update, validate against deal's current pipeline
        if (updates.stageId !== undefined && updates.pipelineId === undefined) {
          const pipeline = await ctx.db.get(deal.pipelineId);
          if (pipeline) {
            const stageExists = pipeline.stages.some(
              (s) => s.id === updates.stageId
            );
            if (!stageExists) {
              results.push({
                id,
                success: false,
                error: "Invalid stage for deal's pipeline",
              });
              continue;
            }
          }
        }

        await ctx.db.patch(id, updateData);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log the bulk activity
    await ctx.db.insert("activityLog", {
      action: "bulk_deals_updated",
      entityType: "deal",
      entityId: ids[0],
      metadata: {
        totalCount: ids.length,
        successCount: results.filter((r) => r.success).length,
        updates: Object.keys(updates),
      },
      timestamp: now,
      system: true,
    });

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Bulk delete multiple contacts
 */
export const bulkDeleteContacts = mutation({
  args: {
    ids: v.array(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const { ids } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No contacts selected");
    }

    if (ids.length > 100) {
      throw new Error("Cannot delete more than 100 contacts at once");
    }

    const results: { id: Id<"contacts">; success: boolean; error?: string }[] = [];
    const deletedContacts: Array<{
      id: Id<"contacts">;
      firstName?: string;
      lastName: string;
      email?: string;
    }> = [];

    for (const id of ids) {
      try {
        const contact = await ctx.db.get(id);
        if (!contact) {
          results.push({ id, success: false, error: "Contact not found" });
          continue;
        }

        // Check if contact is associated with any deals
        const allDeals = await ctx.db.query("deals").collect();
        const associatedDeals = allDeals.filter((deal) =>
          deal.contactIds.includes(id)
        );

        if (associatedDeals.length > 0) {
          results.push({
            id,
            success: false,
            error: `Associated with ${associatedDeals.length} deal(s)`,
          });
          continue;
        }

        // Check if contact has a conversation
        const conversation = await ctx.db
          .query("conversations")
          .withIndex("by_contact", (q) => q.eq("contactId", id))
          .first();

        if (conversation) {
          results.push({
            id,
            success: false,
            error: "Has an active conversation",
          });
          continue;
        }

        // Store contact info before deletion
        deletedContacts.push({
          id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        });

        // Delete the contact
        await ctx.db.delete(id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log the bulk delete activity
    if (deletedContacts.length > 0) {
      await ctx.db.insert("activityLog", {
        action: "bulk_contacts_deleted",
        entityType: "contact",
        entityId: ids[0],
        metadata: {
          totalCount: ids.length,
          deletedCount: deletedContacts.length,
          deletedContacts: deletedContacts.slice(0, 10), // Limit metadata size
        },
        timestamp: now,
        system: true,
      });
    }

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Bulk delete multiple deals
 */
export const bulkDeleteDeals = mutation({
  args: {
    ids: v.array(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const { ids } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No deals selected");
    }

    if (ids.length > 100) {
      throw new Error("Cannot delete more than 100 deals at once");
    }

    const results: { id: Id<"deals">; success: boolean; error?: string }[] = [];
    const deletedDeals: Array<{
      id: Id<"deals">;
      name: string;
      amount?: number;
      status: string;
    }> = [];

    for (const id of ids) {
      try {
        const deal = await ctx.db.get(id);
        if (!deal) {
          results.push({ id, success: false, error: "Deal not found" });
          continue;
        }

        // Store deal info before deletion
        deletedDeals.push({
          id,
          name: deal.name,
          amount: deal.amount,
          status: deal.status,
        });

        // Delete related activities
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_related", (q) =>
            q.eq("relatedToType", "deal").eq("relatedToId", id)
          )
          .collect();

        for (const activity of activities) {
          await ctx.db.delete(activity._id);
        }

        // Delete the deal
        await ctx.db.delete(id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log the bulk delete activity
    if (deletedDeals.length > 0) {
      await ctx.db.insert("activityLog", {
        action: "bulk_deals_deleted",
        entityType: "deal",
        entityId: ids[0],
        metadata: {
          totalCount: ids.length,
          deletedCount: deletedDeals.length,
          deletedDeals: deletedDeals.slice(0, 10),
        },
        timestamp: now,
        system: true,
      });
    }

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Bulk assign owner to contacts or deals
 */
export const bulkAssignOwner = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("deals")),
    ids: v.array(v.string()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { entityType, ids, ownerId } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No items selected");
    }

    if (ids.length > 100) {
      throw new Error("Cannot assign more than 100 items at once");
    }

    // Validate owner exists
    const owner = await ctx.db.get(ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    if (entityType === "contacts") {
      for (const idStr of ids) {
        const id = idStr as Id<"contacts">;
        try {
          const contact = await ctx.db.get(id);
          if (!contact) {
            results.push({ id: idStr, success: false, error: "Contact not found" });
            continue;
          }

          await ctx.db.patch(id, {
            ownerId,
            updatedAt: now,
          });
          results.push({ id: idStr, success: true });
        } catch (error) {
          results.push({
            id: idStr,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } else {
      for (const idStr of ids) {
        const id = idStr as Id<"deals">;
        try {
          const deal = await ctx.db.get(id);
          if (!deal) {
            results.push({ id: idStr, success: false, error: "Deal not found" });
            continue;
          }

          await ctx.db.patch(id, {
            ownerId,
            updatedAt: now,
          });
          results.push({ id: idStr, success: true });
        } catch (error) {
          results.push({
            id: idStr,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    // Log the bulk assign activity
    await ctx.db.insert("activityLog", {
      action: "bulk_owner_assigned",
      entityType,
      entityId: ids[0],
      metadata: {
        totalCount: ids.length,
        successCount: results.filter((r) => r.success).length,
        ownerId,
        ownerName: `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim() || owner.email,
      },
      timestamp: now,
      system: true,
    });

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

/**
 * Bulk add tags to contacts or deals
 */
export const bulkAddTags = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("deals")),
    ids: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { entityType, ids, tags } = args;
    const now = Date.now();

    if (ids.length === 0) {
      throw new Error("No items selected");
    }

    if (tags.length === 0) {
      throw new Error("No tags provided");
    }

    if (ids.length > 100) {
      throw new Error("Cannot update more than 100 items at once");
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    if (entityType === "contacts") {
      for (const idStr of ids) {
        const id = idStr as Id<"contacts">;
        try {
          const contact = await ctx.db.get(id);
          if (!contact) {
            results.push({ id: idStr, success: false, error: "Contact not found" });
            continue;
          }

          // Merge existing tags with new tags (avoid duplicates)
          const existingTags = contact.tags || [];
          const mergedTags = [...new Set([...existingTags, ...tags])];

          await ctx.db.patch(id, {
            tags: mergedTags,
            updatedAt: now,
          });
          results.push({ id: idStr, success: true });
        } catch (error) {
          results.push({
            id: idStr,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } else {
      for (const idStr of ids) {
        const id = idStr as Id<"deals">;
        try {
          const deal = await ctx.db.get(id);
          if (!deal) {
            results.push({ id: idStr, success: false, error: "Deal not found" });
            continue;
          }

          const existingTags = deal.tags || [];
          const mergedTags = [...new Set([...existingTags, ...tags])];

          await ctx.db.patch(id, {
            tags: mergedTags,
            updatedAt: now,
          });
          results.push({ id: idStr, success: true });
        } catch (error) {
          results.push({
            id: idStr,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    // Log the bulk tag activity
    await ctx.db.insert("activityLog", {
      action: "bulk_tags_added",
      entityType,
      entityId: ids[0],
      metadata: {
        totalCount: ids.length,
        successCount: results.filter((r) => r.success).length,
        tags,
      },
      timestamp: now,
      system: true,
    });

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});
