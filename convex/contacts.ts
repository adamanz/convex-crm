import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// CONTACTS - Query and Mutation Functions
// ============================================================================

/**
 * List contacts with pagination and optional filtering
 */
export const list = query({
  args: {
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.number(),
    }),
    filter: v.optional(
      v.object({
        companyId: v.optional(v.id("companies")),
        ownerId: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filter } = args;

    let contactsQuery;

    // Use appropriate index based on filter
    if (filter?.companyId) {
      contactsQuery = ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", filter.companyId));
    } else if (filter?.ownerId) {
      contactsQuery = ctx.db
        .query("contacts")
        .withIndex("by_owner", (q) => q.eq("ownerId", filter.ownerId));
    } else {
      contactsQuery = ctx.db.query("contacts").withIndex("by_created");
    }

    // Get paginated results
    const results = await contactsQuery
      .order("desc")
      .paginate({
        cursor: paginationOpts.cursor ?? null,
        numItems: paginationOpts.numItems,
      });

    // Filter by tags if specified (post-query filter since tags aren't indexed)
    let filteredPage = results.page;
    if (filter?.tags && filter.tags.length > 0) {
      filteredPage = results.page.filter((contact) =>
        filter.tags!.some((tag) => contact.tags.includes(tag))
      );
    }

    // Fetch related companies for each contact
    const contactsWithCompanies = await Promise.all(
      filteredPage.map(async (contact) => {
        let company: Doc<"companies"> | null = null;
        if (contact.companyId) {
          company = await ctx.db.get(contact.companyId);
        }
        return {
          ...contact,
          company,
        };
      })
    );

    return {
      page: contactsWithCompanies,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

/**
 * Get a single contact by ID with related company data
 */
export const get = query({
  args: {
    id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      return null;
    }

    // Fetch related company
    let company: Doc<"companies"> | null = null;
    if (contact.companyId) {
      company = await ctx.db.get(contact.companyId);
    }

    // Fetch owner info
    let owner: Doc<"users"> | null = null;
    if (contact.ownerId) {
      owner = await ctx.db.get(contact.ownerId);
    }

    // Fetch related activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", "contact").eq("relatedToId", args.id)
      )
      .order("desc")
      .take(10);

    // Fetch related deals
    const deals = await ctx.db
      .query("deals")
      .filter((q) =>
        q.or(
          ...([args.id] as Id<"contacts">[]).map((contactId) =>
            q.eq(q.field("contactIds"), [contactId])
          )
        )
      )
      .take(10);

    // Manual filter for deals that include this contact
    const relatedDeals = [];
    const allDeals = await ctx.db.query("deals").collect();
    for (const deal of allDeals) {
      if (deal.contactIds.includes(args.id)) {
        relatedDeals.push(deal);
        if (relatedDeals.length >= 10) break;
      }
    }

    return {
      ...contact,
      company,
      owner,
      recentActivities: activities,
      deals: relatedDeals,
    };
  },
});

/**
 * Full-text search for contacts
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    ownerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, ownerId, limit = 20 } = args;

    let searchQuery = ctx.db
      .query("contacts")
      .withSearchIndex("search_contacts", (q) => {
        let search = q.search("lastName", searchTerm);
        if (ownerId) {
          search = search.eq("ownerId", ownerId);
        }
        return search;
      });

    const contacts = await searchQuery.take(limit);

    // Fetch related companies
    const contactsWithCompanies = await Promise.all(
      contacts.map(async (contact) => {
        let company: Doc<"companies"> | null = null;
        if (contact.companyId) {
          company = await ctx.db.get(contact.companyId);
        }
        return {
          ...contact,
          company,
        };
      })
    );

    return contactsWithCompanies;
  },
});

/**
 * Create a new contact
 */
export const create = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    title: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    linkedinUrl: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    source: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate company exists if provided
    if (args.companyId) {
      const company = await ctx.db.get(args.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate owner exists if provided
    if (args.ownerId) {
      const owner = await ctx.db.get(args.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Check for duplicate email if provided
    if (args.email) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      if (existingContact) {
        throw new Error("A contact with this email already exists");
      }
    }

    const contactId = await ctx.db.insert("contacts", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      avatarUrl: args.avatarUrl,
      companyId: args.companyId,
      title: args.title,
      address: args.address,
      linkedinUrl: args.linkedinUrl,
      twitterHandle: args.twitterHandle,
      source: args.source,
      ownerId: args.ownerId,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "contact_created",
      entityType: "contact",
      entityId: contactId,
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const newContact = await ctx.db.get(contactId);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "contact.created",
      payload: {
        contact: newContact,
      },
    });

    return contactId;
  },
});

/**
 * Update an existing contact
 */
export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    title: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    linkedinUrl: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    source: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    // Check contact exists
    const existingContact = await ctx.db.get(id);
    if (!existingContact) {
      throw new Error("Contact not found");
    }

    // Validate company exists if being updated
    if (updates.companyId !== undefined && updates.companyId !== null) {
      const company = await ctx.db.get(updates.companyId);
      if (!company) {
        throw new Error("Company not found");
      }
    }

    // Validate owner exists if being updated
    if (updates.ownerId !== undefined && updates.ownerId !== null) {
      const owner = await ctx.db.get(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Check for duplicate email if being updated
    if (updates.email && updates.email !== existingContact.email) {
      const duplicateContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", updates.email))
        .first();
      if (duplicateContact) {
        throw new Error("A contact with this email already exists");
      }
    }

    // Build update object with only defined fields
    const updateData: Partial<Doc<"contacts">> = {
      updatedAt: now,
    };

    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
    if (updates.companyId !== undefined) updateData.companyId = updates.companyId;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.linkedinUrl !== undefined) updateData.linkedinUrl = updates.linkedinUrl;
    if (updates.twitterHandle !== undefined) updateData.twitterHandle = updates.twitterHandle;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.ownerId !== undefined) updateData.ownerId = updates.ownerId;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "contact_updated",
      entityType: "contact",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    // Trigger webhook
    const updatedContact = await ctx.db.get(id);
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "contact.updated",
      payload: {
        contact: updatedContact,
        changes: updates,
      },
    });

    return id;
  },
});

/**
 * Soft delete a contact (we don't actually delete, just log and could add a deletedAt field)
 * For now, this performs a hard delete but logs the action
 */
export const delete_ = mutation({
  args: {
    id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check contact exists
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Check if contact is associated with any deals
    const allDeals = await ctx.db.query("deals").collect();
    const associatedDeals = allDeals.filter((deal) =>
      deal.contactIds.includes(args.id)
    );

    if (associatedDeals.length > 0) {
      throw new Error(
        `Cannot delete contact: associated with ${associatedDeals.length} deal(s)`
      );
    }

    // Check if contact has a conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.id))
      .first();

    if (conversation) {
      throw new Error("Cannot delete contact: has an active conversation");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "contact_deleted",
      entityType: "contact",
      entityId: args.id,
      metadata: {
        deletedContact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        },
      },
      timestamp: now,
      system: true,
    });

    // Trigger webhook before deletion
    await ctx.scheduler.runAfter(0, internal.webhooks.triggerWebhook, {
      event: "contact.deleted",
      payload: {
        contactId: args.id,
        deletedContact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        },
      },
    });

    // Delete the contact
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Get contacts by company
 */
export const byCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return contacts;
  },
});

/**
 * Update last activity timestamp for a contact
 */
export const updateLastActivity = mutation({
  args: {
    id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    await ctx.db.patch(args.id, {
      lastActivityAt: now,
      updatedAt: now,
    });

    return args.id;
  },
});
