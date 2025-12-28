import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// WEB FORMS - Query and Mutation Functions
// ============================================================================

/**
 * List all forms with optional filtering
 */
export const listForms = query({
  args: {
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let formsQuery;

    if (args.isActive !== undefined) {
      formsQuery = ctx.db
        .query("webForms")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!));
    } else if (args.createdBy) {
      formsQuery = ctx.db
        .query("webForms")
        .withIndex("by_created_by", (q) => q.eq("createdBy", args.createdBy));
    } else {
      formsQuery = ctx.db.query("webForms").withIndex("by_created");
    }

    const forms = await formsQuery.order("desc").collect();
    return forms;
  },
});

/**
 * Get a single form by ID
 */
export const getForm = query({
  args: {
    id: v.id("webForms"),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.id);
    if (!form) {
      return null;
    }

    // Fetch creator info if available
    let creator = null;
    if (form.createdBy) {
      creator = await ctx.db.get(form.createdBy);
    }

    return {
      ...form,
      creator,
    };
  },
});

/**
 * Get form for public access (minimal data)
 */
export const getFormPublic = query({
  args: {
    id: v.id("webForms"),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.id);
    if (!form || !form.isActive) {
      return null;
    }

    // Return only what's needed for public display
    return {
      _id: form._id,
      name: form.name,
      description: form.description,
      fields: form.fields,
      submitButtonText: form.submitButtonText,
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl,
      primaryColor: form.primaryColor,
      backgroundColor: form.backgroundColor,
      fontFamily: form.fontFamily,
    };
  },
});

/**
 * Create a new form
 */
export const createForm = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    fields: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("email"),
          v.literal("phone"),
          v.literal("textarea"),
          v.literal("select"),
          v.literal("checkbox"),
          v.literal("number"),
          v.literal("date"),
          v.literal("url"),
          v.literal("hidden")
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        placeholder: v.optional(v.string()),
        defaultValue: v.optional(v.string()),
        validation: v.optional(
          v.object({
            minLength: v.optional(v.number()),
            maxLength: v.optional(v.number()),
            pattern: v.optional(v.string()),
            message: v.optional(v.string()),
          })
        ),
      })
    ),
    submitButtonText: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    notifications: v.optional(v.array(v.string())),
    primaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const formId = await ctx.db.insert("webForms", {
      name: args.name,
      description: args.description,
      fields: args.fields,
      submitButtonText: args.submitButtonText || "Submit",
      successMessage: args.successMessage || "Thank you for your submission!",
      redirectUrl: args.redirectUrl,
      notifyEmails: [],
      notifications: args.notifications || [],
      primaryColor: args.primaryColor || "#3b82f6",
      backgroundColor: args.backgroundColor || "#ffffff",
      fontFamily: args.fontFamily || "Inter, system-ui, sans-serif",
      createContact: true,
      tags: [],
      isActive: args.isActive ?? true,
      createdBy: args.createdBy,
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "form_created",
      entityType: "webForm",
      entityId: formId,
      userId: args.createdBy,
      timestamp: now,
    });

    return formId;
  },
});

/**
 * Update an existing form
 */
export const updateForm = mutation({
  args: {
    id: v.id("webForms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    fields: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          label: v.string(),
          type: v.union(
            v.literal("text"),
            v.literal("email"),
            v.literal("phone"),
            v.literal("textarea"),
            v.literal("select"),
            v.literal("checkbox"),
            v.literal("number"),
            v.literal("date"),
            v.literal("url"),
            v.literal("hidden")
          ),
          required: v.boolean(),
          options: v.optional(v.array(v.string())),
          placeholder: v.optional(v.string()),
          defaultValue: v.optional(v.string()),
          validation: v.optional(
            v.object({
              minLength: v.optional(v.number()),
              maxLength: v.optional(v.number()),
              pattern: v.optional(v.string()),
              message: v.optional(v.string()),
            })
          ),
        })
      )
    ),
    submitButtonText: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    notifications: v.optional(v.array(v.string())),
    primaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existingForm = await ctx.db.get(id);
    if (!existingForm) {
      throw new Error("Form not found");
    }

    // Build update object
    const updateData: Partial<Doc<"webForms">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.fields !== undefined) updateData.fields = updates.fields;
    if (updates.submitButtonText !== undefined) updateData.submitButtonText = updates.submitButtonText;
    if (updates.successMessage !== undefined) updateData.successMessage = updates.successMessage;
    if (updates.redirectUrl !== undefined) updateData.redirectUrl = updates.redirectUrl;
    if (updates.notifications !== undefined) updateData.notifications = updates.notifications;
    if (updates.primaryColor !== undefined) updateData.primaryColor = updates.primaryColor;
    if (updates.backgroundColor !== undefined) updateData.backgroundColor = updates.backgroundColor;
    if (updates.fontFamily !== undefined) updateData.fontFamily = updates.fontFamily;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "form_updated",
      entityType: "webForm",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete a form
 */
export const deleteForm = mutation({
  args: {
    id: v.id("webForms"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const form = await ctx.db.get(args.id);
    if (!form) {
      throw new Error("Form not found");
    }

    // Delete all associated submissions
    const submissions = await ctx.db
      .query("formSubmissions")
      .withIndex("by_form", (q) => q.eq("formId", args.id))
      .collect();

    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "form_deleted",
      entityType: "webForm",
      entityId: args.id,
      metadata: {
        formName: form.name,
        submissionCount: form.submissionCount,
      },
      timestamp: now,
      system: true,
    });

    // Delete the form
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Duplicate a form
 */
export const duplicateForm = mutation({
  args: {
    id: v.id("webForms"),
    newName: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const originalForm = await ctx.db.get(args.id);
    if (!originalForm) {
      throw new Error("Form not found");
    }

    const newFormId = await ctx.db.insert("webForms", {
      name: args.newName || `${originalForm.name} (Copy)`,
      description: originalForm.description,
      fields: originalForm.fields,
      submitButtonText: originalForm.submitButtonText,
      successMessage: originalForm.successMessage,
      redirectUrl: originalForm.redirectUrl,
      notifyEmails: originalForm.notifyEmails,
      notifications: originalForm.notifications,
      primaryColor: originalForm.primaryColor,
      backgroundColor: originalForm.backgroundColor,
      fontFamily: originalForm.fontFamily,
      createContact: originalForm.createContact,
      assignToUserId: originalForm.assignToUserId,
      tags: originalForm.tags,
      isActive: false, // Start as inactive
      createdBy: args.createdBy || originalForm.createdBy,
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "form_duplicated",
      entityType: "webForm",
      entityId: newFormId,
      metadata: {
        originalFormId: args.id,
        originalFormName: originalForm.name,
      },
      userId: args.createdBy,
      timestamp: now,
    });

    return newFormId;
  },
});

// ============================================================================
// FORM SUBMISSIONS
// ============================================================================

/**
 * Internal mutation to create a submission (called from HTTP action)
 */
export const createSubmissionInternal = internalMutation({
  args: {
    formId: v.id("webForms"),
    data: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify form exists and is active
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new Error("Form not found");
    }
    if (!form.isActive) {
      throw new Error("Form is not active");
    }

    // Create submission
    const submissionId = await ctx.db.insert("formSubmissions", {
      formId: args.formId,
      data: args.data,
      submittedAt: now,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      source: args.source,
      status: "new",
      createdAt: now,
    });

    // Update form submission count
    await ctx.db.patch(args.formId, {
      submissionCount: form.submissionCount + 1,
      lastSubmissionAt: now,
    });

    return {
      submissionId,
      successMessage: form.successMessage,
      redirectUrl: form.redirectUrl,
    };
  },
});

/**
 * List submissions for a form
 */
export const listSubmissions = query({
  args: {
    formId: v.id("webForms"),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("reviewed"),
        v.literal("converted"),
        v.literal("spam"),
        v.literal("archived")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { formId, status, limit = 50 } = args;

    let submissionsQuery;

    if (status) {
      submissionsQuery = ctx.db
        .query("formSubmissions")
        .withIndex("by_form_status", (q) => q.eq("formId", formId).eq("status", status));
    } else {
      submissionsQuery = ctx.db
        .query("formSubmissions")
        .withIndex("by_form", (q) => q.eq("formId", formId));
    }

    const submissions = await submissionsQuery.order("desc").take(limit);

    // Fetch contact info for converted submissions
    const submissionsWithContacts = await Promise.all(
      submissions.map(async (submission) => {
        let contact = null;
        if (submission.convertedToContactId) {
          contact = await ctx.db.get(submission.convertedToContactId);
        }
        return {
          ...submission,
          contact,
        };
      })
    );

    return submissionsWithContacts;
  },
});

/**
 * Get a single submission
 */
export const getSubmission = query({
  args: {
    id: v.id("formSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      return null;
    }

    // Fetch form info
    const form = await ctx.db.get(submission.formId);

    // Fetch contact info if converted
    let contact = null;
    if (submission.convertedToContactId) {
      contact = await ctx.db.get(submission.convertedToContactId);
    }

    // Fetch converter info
    let converter = null;
    if (submission.convertedBy) {
      converter = await ctx.db.get(submission.convertedBy);
    }

    return {
      ...submission,
      form,
      contact,
      converter,
    };
  },
});

/**
 * Update submission status
 */
export const updateSubmissionStatus = mutation({
  args: {
    id: v.id("formSubmissions"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("converted"),
      v.literal("spam"),
      v.literal("archived")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      notes: args.notes !== undefined ? args.notes : submission.notes,
    });

    return args.id;
  },
});

/**
 * Convert a submission to a contact
 */
export const convertToContact = mutation({
  args: {
    submissionId: v.id("formSubmissions"),
    userId: v.optional(v.id("users")),
    additionalData: v.optional(
      v.object({
        companyId: v.optional(v.id("companies")),
        ownerId: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status === "converted") {
      throw new Error("Submission already converted");
    }

    const form = await ctx.db.get(submission.formId);
    if (!form) {
      throw new Error("Form not found");
    }

    // Extract contact data from submission
    const data = submission.data as Record<string, string>;

    // Try to find email and name fields
    let email: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let phone: string | undefined;

    for (const field of form.fields) {
      const value = data[field.name];
      if (!value) continue;

      if (field.type === "email" || field.name.toLowerCase().includes("email")) {
        email = value;
      } else if (field.name.toLowerCase().includes("firstname") || field.name.toLowerCase() === "first_name") {
        firstName = value;
      } else if (field.name.toLowerCase().includes("lastname") || field.name.toLowerCase() === "last_name") {
        lastName = value;
      } else if (field.name.toLowerCase() === "name" || field.name.toLowerCase() === "full_name") {
        // Split full name into first and last
        const parts = value.trim().split(/\s+/);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        } else {
          lastName = value;
        }
      } else if (field.type === "phone" || field.name.toLowerCase().includes("phone")) {
        phone = value;
      }
    }

    // Ensure we have at least a last name
    if (!lastName) {
      lastName = email?.split("@")[0] || "Unknown";
    }

    // Check for duplicate email
    if (email) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (existingContact) {
        throw new Error("A contact with this email already exists");
      }
    }

    // Create the contact
    const contactId = await ctx.db.insert("contacts", {
      firstName,
      lastName,
      email,
      phone,
      source: `Web Form: ${form.name}`,
      companyId: args.additionalData?.companyId,
      ownerId: args.additionalData?.ownerId,
      tags: args.additionalData?.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Update the submission
    await ctx.db.patch(args.submissionId, {
      status: "converted",
      convertedToContactId: contactId,
      convertedAt: now,
      convertedBy: args.userId,
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      action: "submission_converted",
      entityType: "formSubmission",
      entityId: args.submissionId,
      metadata: {
        contactId,
        formId: form._id,
        formName: form.name,
      },
      userId: args.userId,
      timestamp: now,
    });

    return contactId;
  },
});

/**
 * Bulk convert submissions to contacts
 */
export const bulkConvert = mutation({
  args: {
    submissionIds: v.array(v.id("formSubmissions")),
    userId: v.optional(v.id("users")),
    additionalData: v.optional(
      v.object({
        ownerId: v.optional(v.id("users")),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: { submissionId: Id<"formSubmissions">; contactId?: Id<"contacts">; error?: string }[] = [];

    for (const submissionId of args.submissionIds) {
      try {
        // We can't call mutations from mutations, so we inline the logic
        const now = Date.now();

        const submission = await ctx.db.get(submissionId);
        if (!submission) {
          results.push({ submissionId, error: "Submission not found" });
          continue;
        }

        if (submission.status === "converted") {
          results.push({ submissionId, error: "Already converted" });
          continue;
        }

        const form = await ctx.db.get(submission.formId);
        if (!form) {
          results.push({ submissionId, error: "Form not found" });
          continue;
        }

        const data = submission.data as Record<string, string>;
        let email: string | undefined;
        let firstName: string | undefined;
        let lastName: string | undefined;
        let phone: string | undefined;

        for (const field of form.fields) {
          const value = data[field.name];
          if (!value) continue;

          if (field.type === "email" || field.name.toLowerCase().includes("email")) {
            email = value;
          } else if (field.name.toLowerCase().includes("firstname")) {
            firstName = value;
          } else if (field.name.toLowerCase().includes("lastname")) {
            lastName = value;
          } else if (field.name.toLowerCase() === "name") {
            const parts = value.trim().split(/\s+/);
            if (parts.length >= 2) {
              firstName = parts[0];
              lastName = parts.slice(1).join(" ");
            } else {
              lastName = value;
            }
          } else if (field.type === "phone" || field.name.toLowerCase().includes("phone")) {
            phone = value;
          }
        }

        if (!lastName) {
          lastName = email?.split("@")[0] || "Unknown";
        }

        if (email) {
          const existingContact = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
          if (existingContact) {
            results.push({ submissionId, error: "Duplicate email" });
            continue;
          }
        }

        const contactId = await ctx.db.insert("contacts", {
          firstName,
          lastName,
          email,
          phone,
          source: `Web Form: ${form.name}`,
          ownerId: args.additionalData?.ownerId,
          tags: args.additionalData?.tags || [],
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.patch(submissionId, {
          status: "converted",
          convertedToContactId: contactId,
          convertedAt: now,
          convertedBy: args.userId,
        });

        results.push({ submissionId, contactId });
      } catch (error) {
        results.push({
          submissionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Get form statistics
 */
export const getFormStats = query({
  args: {
    formId: v.id("webForms"),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) {
      return null;
    }

    // Get all submissions for this form
    const submissions = await ctx.db
      .query("formSubmissions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();

    const totalSubmissions = submissions.length;
    const newCount = submissions.filter((s) => s.status === "new").length;
    const reviewedCount = submissions.filter((s) => s.status === "reviewed").length;
    const convertedCount = submissions.filter((s) => s.status === "converted").length;
    const spamCount = submissions.filter((s) => s.status === "spam").length;
    const archivedCount = submissions.filter((s) => s.status === "archived").length;

    const conversionRate = totalSubmissions > 0 ? (convertedCount / totalSubmissions) * 100 : 0;

    // Get submissions by day for the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSubmissions = submissions.filter((s) => s.submittedAt >= thirtyDaysAgo);

    // Group by day
    const submissionsByDay: Record<string, number> = {};
    for (const submission of recentSubmissions) {
      const date = new Date(submission.submittedAt).toISOString().split("T")[0];
      submissionsByDay[date] = (submissionsByDay[date] || 0) + 1;
    }

    return {
      totalSubmissions,
      statusCounts: {
        new: newCount,
        reviewed: reviewedCount,
        converted: convertedCount,
        spam: spamCount,
        archived: archivedCount,
      },
      conversionRate: Math.round(conversionRate * 100) / 100,
      lastSubmissionAt: form.lastSubmissionAt,
      submissionsByDay,
    };
  },
});

/**
 * Delete a submission
 */
export const deleteSubmission = mutation({
  args: {
    id: v.id("formSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Update form submission count
    const form = await ctx.db.get(submission.formId);
    if (form && form.submissionCount > 0) {
      await ctx.db.patch(submission.formId, {
        submissionCount: form.submissionCount - 1,
      });
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Bulk delete submissions
 */
export const bulkDeleteSubmissions = mutation({
  args: {
    ids: v.array(v.id("formSubmissions")),
  },
  handler: async (ctx, args) => {
    // Group by form to update counts efficiently
    const formCounts: Record<string, number> = {};

    for (const id of args.ids) {
      const submission = await ctx.db.get(id);
      if (submission) {
        const formIdStr = submission.formId.toString();
        formCounts[formIdStr] = (formCounts[formIdStr] || 0) + 1;
        await ctx.db.delete(id);
      }
    }

    // Update form submission counts
    for (const [formIdStr, count] of Object.entries(formCounts)) {
      const formId = formIdStr as Id<"webForms">;
      const form = await ctx.db.get(formId);
      if (form) {
        await ctx.db.patch(formId, {
          submissionCount: Math.max(0, form.submissionCount - count),
        });
      }
    }

    return { success: true, deletedCount: args.ids.length };
  },
});
