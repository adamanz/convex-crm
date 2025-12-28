import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalAction } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// TYPES
// ============================================================================

type EntityType = "contact" | "company" | "deal" | "activity" | "message";
type ActionType = "archive" | "delete" | "anonymize";
type ConditionOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "contains"
  | "isEmpty"
  | "isNotEmpty"
  | "daysSinceGreaterThan"
  | "daysSinceLessThan";

interface PolicyCondition {
  field: string;
  operator: ConditionOperator;
  value?: any;
}

// ============================================================================
// RETENTION POLICY QUERIES
// ============================================================================

/**
 * List all retention policies with optional filtering
 */
export const listPolicies = query({
  args: {
    entityType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal"),
        v.literal("activity"),
        v.literal("message")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let policies;

    if (args.entityType) {
      policies = await ctx.db
        .query("retentionPolicies")
        .withIndex("by_entity_type", (q) => q.eq("entityType", args.entityType!))
        .collect();
    } else if (args.isActive !== undefined) {
      policies = await ctx.db
        .query("retentionPolicies")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      policies = await ctx.db
        .query("retentionPolicies")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Optionally filter by active status if entityType was used
    if (args.entityType && args.isActive !== undefined) {
      policies = policies.filter((p) => p.isActive === args.isActive);
    }

    return policies;
  },
});

/**
 * Get a single retention policy by ID
 */
export const getPolicy = query({
  args: {
    id: v.id("retentionPolicies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get retention logs for a policy
 */
export const getRetentionLogs = query({
  args: {
    policyId: v.optional(v.id("retentionPolicies")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.policyId) {
      return await ctx.db
        .query("retentionLogs")
        .withIndex("by_policy", (q) => q.eq("policyId", args.policyId!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("retentionLogs")
      .withIndex("by_executed")
      .order("desc")
      .take(limit);
  },
});

// ============================================================================
// RETENTION POLICY MUTATIONS
// ============================================================================

/**
 * Create a new retention policy
 */
export const createPolicy = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal"),
      v.literal("activity"),
      v.literal("message")
    ),
    retentionDays: v.number(),
    action: v.union(
      v.literal("archive"),
      v.literal("delete"),
      v.literal("anonymize")
    ),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("notEquals"),
          v.literal("greaterThan"),
          v.literal("lessThan"),
          v.literal("contains"),
          v.literal("isEmpty"),
          v.literal("isNotEmpty"),
          v.literal("daysSinceGreaterThan"),
          v.literal("daysSinceLessThan")
        ),
        value: v.optional(v.any()),
      })
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const policyId = await ctx.db.insert("retentionPolicies", {
      name: args.name,
      description: args.description,
      entityType: args.entityType,
      retentionDays: args.retentionDays,
      action: args.action,
      conditions: args.conditions,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });

    // Log the creation in activity log
    await ctx.db.insert("activityLog", {
      system: true,
      action: "retention_policy_created",
      entityType: "retentionPolicies",
      entityId: policyId,
      metadata: { name: args.name, entityType: args.entityType },
      timestamp: now,
    });

    return policyId;
  },
});

/**
 * Update an existing retention policy
 */
export const updatePolicy = mutation({
  args: {
    id: v.id("retentionPolicies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    retentionDays: v.optional(v.number()),
    action: v.optional(
      v.union(
        v.literal("archive"),
        v.literal("delete"),
        v.literal("anonymize")
      )
    ),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.union(
            v.literal("equals"),
            v.literal("notEquals"),
            v.literal("greaterThan"),
            v.literal("lessThan"),
            v.literal("contains"),
            v.literal("isEmpty"),
            v.literal("isNotEmpty"),
            v.literal("daysSinceGreaterThan"),
            v.literal("daysSinceLessThan")
          ),
          value: v.optional(v.any()),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Policy not found");
    }

    const now = Date.now();
    const changes: Record<string, any> = {};

    if (updates.name !== undefined) changes.name = updates.name;
    if (updates.description !== undefined)
      changes.description = updates.description;
    if (updates.retentionDays !== undefined)
      changes.retentionDays = updates.retentionDays;
    if (updates.action !== undefined) changes.action = updates.action;
    if (updates.conditions !== undefined)
      changes.conditions = updates.conditions;
    if (updates.isActive !== undefined) changes.isActive = updates.isActive;

    await ctx.db.patch(id, {
      ...changes,
      updatedAt: now,
    });

    // Log the update
    await ctx.db.insert("activityLog", {
      system: true,
      action: "retention_policy_updated",
      entityType: "retentionPolicies",
      entityId: id,
      changes,
      timestamp: now,
    });

    return id;
  },
});

/**
 * Delete a retention policy
 */
export const deletePolicy = mutation({
  args: {
    id: v.id("retentionPolicies"),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.id);
    if (!policy) {
      throw new Error("Policy not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      system: true,
      action: "retention_policy_deleted",
      entityType: "retentionPolicies",
      entityId: args.id,
      metadata: { name: policy.name, entityType: policy.entityType },
      timestamp: Date.now(),
    });

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================================================
// RETENTION EXECUTION
// ============================================================================

/**
 * Preview records that would be affected by a policy
 */
export const getRecordsAffected = query({
  args: {
    policyId: v.id("retentionPolicies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    const limit = args.limit ?? 100;
    const records = await getMatchingRecords(
      ctx,
      policy.entityType,
      policy.conditions,
      policy.retentionDays,
      limit
    );

    return {
      count: records.length,
      hasMore: records.length >= limit,
      records: records.map((r) => ({
        id: r._id,
        createdAt: r.createdAt,
        // Include identifying info based on entity type
        ...(policy.entityType === "contact" && {
          name: `${(r as any).firstName || ""} ${(r as any).lastName || ""}`.trim(),
          email: (r as any).email,
        }),
        ...(policy.entityType === "company" && {
          name: (r as any).name,
          domain: (r as any).domain,
        }),
        ...(policy.entityType === "deal" && {
          name: (r as any).name,
          status: (r as any).status,
        }),
        ...(policy.entityType === "activity" && {
          subject: (r as any).subject,
          type: (r as any).type,
        }),
        ...(policy.entityType === "message" && {
          content: (r as any).content?.substring(0, 50),
          timestamp: (r as any).timestamp,
        }),
      })),
    };
  },
});

/**
 * Execute a retention policy manually
 */
export const executePolicy = mutation({
  args: {
    policyId: v.id("retentionPolicies"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) {
      throw new Error("Policy not found");
    }

    const now = Date.now();
    const errors: string[] = [];
    const affectedRecordIds: string[] = [];

    // Get all matching records
    const records = await getMatchingRecords(
      ctx,
      policy.entityType,
      policy.conditions,
      policy.retentionDays,
      1000 // Process up to 1000 records at a time
    );

    let recordsAffected = 0;

    for (const record of records) {
      try {
        switch (policy.action) {
          case "delete":
            await deleteRecord(ctx, policy.entityType, record._id);
            break;
          case "archive":
            await archiveRecord(ctx, policy.entityType, record._id);
            break;
          case "anonymize":
            await anonymizeRecord(
              ctx,
              policy.entityType,
              record._id,
              args.policyId,
              args.userId
            );
            break;
        }
        affectedRecordIds.push(record._id);
        recordsAffected++;
      } catch (error) {
        errors.push(`Failed to process ${record._id}: ${error}`);
      }
    }

    // Update policy last run info
    await ctx.db.patch(args.policyId, {
      lastRunAt: now,
      lastRunResult: {
        recordsProcessed: records.length,
        recordsAffected,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    // Create retention log entry
    await ctx.db.insert("retentionLogs", {
      policyId: args.policyId,
      policyName: policy.name,
      executedAt: now,
      executedBy: args.userId,
      entityType: policy.entityType,
      action: policy.action,
      recordsProcessed: records.length,
      recordsAffected,
      affectedRecordIds,
      status: errors.length === 0 ? "completed" : errors.length < records.length ? "partial" : "failed",
      errors: errors.length > 0 ? errors : undefined,
    });

    return {
      recordsProcessed: records.length,
      recordsAffected,
      errors,
    };
  },
});

// ============================================================================
// DATA SUBJECT REQUESTS
// ============================================================================

/**
 * List all data subject requests
 */
export const listDataSubjectRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("verified"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("rejected")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      return await ctx.db
        .query("dataSubjectRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("dataSubjectRequests")
      .withIndex("by_requested")
      .order("desc")
      .take(limit);
  },
});

/**
 * Create a new data subject request (public API for DSR portal)
 */
export const createDataSubjectRequest = mutation({
  args: {
    type: v.union(
      v.literal("access"),
      v.literal("delete"),
      v.literal("portability"),
      v.literal("rectification"),
      v.literal("restriction")
    ),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dueDate = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now (GDPR requirement)

    // Generate verification token
    const verificationToken = generateVerificationToken();

    const requestId = await ctx.db.insert("dataSubjectRequests", {
      type: args.type,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      status: "pending",
      verificationToken,
      requestedAt: now,
      dueDate,
    });

    // Log the request
    await ctx.db.insert("activityLog", {
      system: true,
      action: "dsr_created",
      entityType: "dataSubjectRequests",
      entityId: requestId,
      metadata: { type: args.type, email: args.email },
      timestamp: now,
    });

    return { requestId, verificationToken };
  },
});

/**
 * Verify a data subject request with token
 */
export const verifyDataSubjectRequest = mutation({
  args: {
    requestId: v.id("dataSubjectRequests"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.verificationToken !== args.token) {
      throw new Error("Invalid verification token");
    }

    if (request.status !== "pending") {
      throw new Error("Request has already been verified or processed");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "verified",
      verifiedAt: now,
    });

    await ctx.db.insert("activityLog", {
      system: true,
      action: "dsr_verified",
      entityType: "dataSubjectRequests",
      entityId: args.requestId,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Process a data subject request (admin action)
 */
export const processDataSubjectRequest = mutation({
  args: {
    requestId: v.id("dataSubjectRequests"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const now = Date.now();

    // Update status to in_progress
    await ctx.db.patch(args.requestId, {
      status: "in_progress",
      assignedTo: args.userId,
      notes: args.notes,
    });

    // Find all records associated with this email
    let recordsFound = 0;
    let recordsProcessed = 0;

    // Find contacts with this email
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", request.email))
      .collect();
    recordsFound += contacts.length;

    // Process based on request type
    switch (request.type) {
      case "delete":
        // Anonymize or delete all related records
        for (const contact of contacts) {
          await anonymizeRecord(ctx, "contact", contact._id, undefined, request._id);
          recordsProcessed++;
        }
        break;

      case "access":
      case "portability":
        // Create an export request
        const exportRequestId = await ctx.db.insert("dataExportRequests", {
          requestedEmail: request.email,
          status: "pending",
          entityTypes: ["all"],
          format: "json",
          requestedAt: now,
        });
        await ctx.db.patch(args.requestId, {
          exportRequestId,
        });
        recordsProcessed = recordsFound;
        break;

      case "rectification":
      case "restriction":
        // These require manual intervention
        recordsProcessed = 0;
        break;
    }

    // Update request with results
    await ctx.db.patch(args.requestId, {
      status: "completed",
      recordsFound,
      recordsProcessed,
      completedAt: now,
      resultSummary: `Found ${recordsFound} records, processed ${recordsProcessed}`,
    });

    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "dsr_completed",
      entityType: "dataSubjectRequests",
      entityId: args.requestId,
      metadata: { recordsFound, recordsProcessed },
      timestamp: now,
    });

    return { recordsFound, recordsProcessed };
  },
});

/**
 * Reject a data subject request
 */
export const rejectDataSubjectRequest = mutation({
  args: {
    requestId: v.id("dataSubjectRequests"),
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      assignedTo: args.userId,
      notes: args.reason,
      completedAt: now,
    });

    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "dsr_rejected",
      entityType: "dataSubjectRequests",
      entityId: args.requestId,
      metadata: { reason: args.reason },
      timestamp: now,
    });

    return { success: true };
  },
});

// ============================================================================
// DATA EXPORT
// ============================================================================

/**
 * List data export requests
 */
export const listDataExportRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("expired")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      return await ctx.db
        .query("dataExportRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("dataExportRequests")
      .withIndex("by_requested")
      .order("desc")
      .take(limit);
  },
});

/**
 * Create a data export request
 */
export const createDataExportRequest = mutation({
  args: {
    email: v.string(),
    entityTypes: v.array(
      v.union(
        v.literal("contacts"),
        v.literal("companies"),
        v.literal("deals"),
        v.literal("activities"),
        v.literal("messages"),
        v.literal("all")
      )
    ),
    format: v.union(v.literal("json"), v.literal("csv")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const requestId = await ctx.db.insert("dataExportRequests", {
      userId: args.userId,
      requestedEmail: args.email,
      status: "pending",
      entityTypes: args.entityTypes,
      format: args.format,
      requestedAt: now,
    });

    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "export_requested",
      entityType: "dataExportRequests",
      entityId: requestId,
      metadata: { email: args.email, entityTypes: args.entityTypes },
      timestamp: now,
    });

    return requestId;
  },
});

/**
 * Generate user data export (internal mutation called by action)
 */
export const generateExportData = internalMutation({
  args: {
    requestId: v.id("dataExportRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Export request not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "processing",
      startedAt: now,
    });

    try {
      const exportData: Record<string, any[]> = {};
      const shouldExportAll = request.entityTypes.includes("all");

      // Export contacts
      if (shouldExportAll || request.entityTypes.includes("contacts")) {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", request.requestedEmail))
          .collect();
        exportData.contacts = contacts.map(sanitizeForExport);
      }

      // Export companies (if contact is associated)
      if (shouldExportAll || request.entityTypes.includes("companies")) {
        const contacts = exportData.contacts || [];
        const companyIds = contacts
          .map((c) => c.companyId)
          .filter(Boolean);
        const companies = [];
        for (const companyId of companyIds) {
          const company = await ctx.db.get(companyId);
          if (company) companies.push(sanitizeForExport(company));
        }
        exportData.companies = companies;
      }

      // Export deals (if contact is associated)
      if (shouldExportAll || request.entityTypes.includes("deals")) {
        const contacts = exportData.contacts || [];
        const contactIds = contacts.map((c) => c._id);
        const deals = await ctx.db.query("deals").collect();
        exportData.deals = deals
          .filter((d) => d.contactIds.some((id: any) => contactIds.includes(id)))
          .map(sanitizeForExport);
      }

      // Export activities related to contact
      if (shouldExportAll || request.entityTypes.includes("activities")) {
        const contacts = exportData.contacts || [];
        const activities = [];
        for (const contact of contacts) {
          const contactActivities = await ctx.db
            .query("activities")
            .withIndex("by_related", (q) =>
              q.eq("relatedToType", "contact").eq("relatedToId", contact._id)
            )
            .collect();
          activities.push(...contactActivities.map(sanitizeForExport));
        }
        exportData.activities = activities;
      }

      // Store export data (in production, upload to storage)
      const exportJson = JSON.stringify(exportData, null, 2);
      const fileSize = new Blob([exportJson]).size;

      // Mark as completed
      await ctx.db.patch(args.requestId, {
        status: "completed",
        completedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        fileSize,
        // In production, store to _storage and set downloadUrl
      });

      return { success: true, data: exportData };
    } catch (error) {
      await ctx.db.patch(args.requestId, {
        status: "failed",
        errorMessage: String(error),
        completedAt: Date.now(),
      });
      throw error;
    }
  },
});

// ============================================================================
// ANONYMIZATION
// ============================================================================

/**
 * Anonymize a specific contact (for GDPR compliance)
 */
export const anonymizeContact = mutation({
  args: {
    contactId: v.id("contacts"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const now = Date.now();
    const anonymizedFields: string[] = [];

    // Anonymize PII fields
    const anonymizedData: Partial<Doc<"contacts">> = {
      firstName: "[REDACTED]",
      lastName: "[REDACTED]",
      email: generateAnonymizedEmail(),
      phone: undefined,
      avatarUrl: undefined,
      linkedinUrl: undefined,
      twitterHandle: undefined,
      address: undefined,
      enrichmentData: undefined,
      updatedAt: now,
    };

    if (contact.firstName) anonymizedFields.push("firstName");
    if (contact.lastName) anonymizedFields.push("lastName");
    if (contact.email) anonymizedFields.push("email");
    if (contact.phone) anonymizedFields.push("phone");
    if (contact.avatarUrl) anonymizedFields.push("avatarUrl");
    if (contact.linkedinUrl) anonymizedFields.push("linkedinUrl");
    if (contact.twitterHandle) anonymizedFields.push("twitterHandle");
    if (contact.address) anonymizedFields.push("address");
    if (contact.enrichmentData) anonymizedFields.push("enrichmentData");

    await ctx.db.patch(args.contactId, anonymizedData);

    // Create anonymization record
    await ctx.db.insert("anonymizationRecords", {
      entityType: "contact",
      entityId: args.contactId,
      triggeredBy: "manual",
      anonymizedFields,
      performedBy: args.userId,
      performedAt: now,
    });

    // Log the action
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "contact_anonymized",
      entityType: "contacts",
      entityId: args.contactId,
      metadata: { anonymizedFields },
      timestamp: now,
    });

    return { success: true, anonymizedFields };
  },
});

/**
 * Preview what fields would be anonymized for a contact
 */
export const getAnonymizationPreview = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    const fieldsToAnonymize: { field: string; currentValue: any; newValue: string }[] = [];

    if (contact.firstName) {
      fieldsToAnonymize.push({ field: "firstName", currentValue: contact.firstName, newValue: "[REDACTED]" });
    }
    if (contact.lastName) {
      fieldsToAnonymize.push({ field: "lastName", currentValue: contact.lastName, newValue: "[REDACTED]" });
    }
    if (contact.email) {
      fieldsToAnonymize.push({ field: "email", currentValue: contact.email, newValue: "anonymized-xxxxx@privacy.local" });
    }
    if (contact.phone) {
      fieldsToAnonymize.push({ field: "phone", currentValue: contact.phone, newValue: "[REMOVED]" });
    }
    if (contact.avatarUrl) {
      fieldsToAnonymize.push({ field: "avatarUrl", currentValue: "[URL]", newValue: "[REMOVED]" });
    }
    if (contact.linkedinUrl) {
      fieldsToAnonymize.push({ field: "linkedinUrl", currentValue: contact.linkedinUrl, newValue: "[REMOVED]" });
    }
    if (contact.twitterHandle) {
      fieldsToAnonymize.push({ field: "twitterHandle", currentValue: contact.twitterHandle, newValue: "[REMOVED]" });
    }
    if (contact.address) {
      fieldsToAnonymize.push({ field: "address", currentValue: "[ADDRESS]", newValue: "[REMOVED]" });
    }

    return {
      contactId: args.contactId,
      fieldsToAnonymize,
      relatedRecords: {
        // Count related records that will also be affected
        activities: (await ctx.db
          .query("activities")
          .withIndex("by_related", (q) =>
            q.eq("relatedToType", "contact").eq("relatedToId", args.contactId)
          )
          .collect()).length,
      },
    };
  },
});

// ============================================================================
// COMPLIANCE REPORT
// ============================================================================

/**
 * Get compliance report data
 */
export const getRetentionReport = query({
  args: {},
  handler: async (ctx) => {
    // Get all policies
    const policies = await ctx.db.query("retentionPolicies").collect();
    const activePolicies = policies.filter((p) => p.isActive);

    // Get recent retention logs
    const recentLogs = await ctx.db
      .query("retentionLogs")
      .withIndex("by_executed")
      .order("desc")
      .take(100);

    // Get DSR stats
    const allDsrs = await ctx.db.query("dataSubjectRequests").collect();
    const pendingDsrs = allDsrs.filter((d) => d.status === "pending" || d.status === "verified");
    const overdueDsrs = allDsrs.filter(
      (d) => (d.status === "pending" || d.status === "in_progress") && d.dueDate < Date.now()
    );

    // Get anonymization stats
    const anonymizationRecords = await ctx.db
      .query("anonymizationRecords")
      .withIndex("by_performed")
      .order("desc")
      .take(100);

    // Calculate stats by entity type
    const statsByEntity: Record<string, { processed: number; affected: number }> = {};
    for (const log of recentLogs) {
      if (!statsByEntity[log.entityType]) {
        statsByEntity[log.entityType] = { processed: 0, affected: 0 };
      }
      statsByEntity[log.entityType].processed += log.recordsProcessed;
      statsByEntity[log.entityType].affected += log.recordsAffected;
    }

    return {
      summary: {
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        totalDsrs: allDsrs.length,
        pendingDsrs: pendingDsrs.length,
        overdueDsrs: overdueDsrs.length,
        totalAnonymizations: anonymizationRecords.length,
      },
      policies: policies.map((p) => ({
        id: p._id,
        name: p.name,
        entityType: p.entityType,
        action: p.action,
        retentionDays: p.retentionDays,
        isActive: p.isActive,
        lastRunAt: p.lastRunAt,
        lastRunResult: p.lastRunResult,
      })),
      recentActivity: recentLogs.slice(0, 20).map((l) => ({
        policyName: l.policyName,
        action: l.action,
        entityType: l.entityType,
        recordsAffected: l.recordsAffected,
        executedAt: l.executedAt,
        status: l.status,
      })),
      dsrsByType: {
        access: allDsrs.filter((d) => d.type === "access").length,
        delete: allDsrs.filter((d) => d.type === "delete").length,
        portability: allDsrs.filter((d) => d.type === "portability").length,
        rectification: allDsrs.filter((d) => d.type === "rectification").length,
        restriction: allDsrs.filter((d) => d.type === "restriction").length,
      },
      statsByEntity,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get matching records based on conditions
 */
async function getMatchingRecords(
  ctx: any,
  entityType: EntityType,
  conditions: PolicyCondition[],
  retentionDays: number,
  limit: number
): Promise<any[]> {
  const tableName = getTableName(entityType);
  const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  // Get all records from the table
  let records = await ctx.db.query(tableName).collect();

  // Filter by retention period (based on createdAt or relevant date field)
  records = records.filter((record: any) => {
    const dateField = getDateField(entityType, record);
    return dateField && dateField < cutoffDate;
  });

  // Apply conditions
  for (const condition of conditions) {
    records = records.filter((record: any) =>
      evaluateCondition(record, condition)
    );
  }

  return records.slice(0, limit);
}

function getTableName(entityType: EntityType): string {
  const mapping: Record<EntityType, string> = {
    contact: "contacts",
    company: "companies",
    deal: "deals",
    activity: "activities",
    message: "messages",
  };
  return mapping[entityType];
}

function getDateField(entityType: EntityType, record: any): number | null {
  switch (entityType) {
    case "contact":
    case "company":
    case "deal":
    case "activity":
      return record.createdAt || record.updatedAt;
    case "message":
      return record.timestamp;
    default:
      return record.createdAt;
  }
}

function evaluateCondition(record: any, condition: PolicyCondition): boolean {
  const value = record[condition.field];
  const now = Date.now();

  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "notEquals":
      return value !== condition.value;
    case "greaterThan":
      return value > condition.value;
    case "lessThan":
      return value < condition.value;
    case "contains":
      return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
    case "isEmpty":
      return value === null || value === undefined || value === "";
    case "isNotEmpty":
      return value !== null && value !== undefined && value !== "";
    case "daysSinceGreaterThan":
      if (typeof value !== "number") return false;
      const daysSince = (now - value) / (24 * 60 * 60 * 1000);
      return daysSince > (condition.value as number);
    case "daysSinceLessThan":
      if (typeof value !== "number") return false;
      const daysSinceLt = (now - value) / (24 * 60 * 60 * 1000);
      return daysSinceLt < (condition.value as number);
    default:
      return true;
  }
}

async function deleteRecord(ctx: any, entityType: EntityType, recordId: any): Promise<void> {
  const tableName = getTableName(entityType);
  await ctx.db.delete(recordId);
}

async function archiveRecord(ctx: any, entityType: EntityType, recordId: any): Promise<void> {
  // For archiving, we add an "archived" flag or move to archive table
  // This is a simplified implementation - in production, you might move to a separate archive table
  const tableName = getTableName(entityType);
  await ctx.db.patch(recordId, {
    tags: [...((await ctx.db.get(recordId))?.tags || []), "_archived"],
    updatedAt: Date.now(),
  });
}

async function anonymizeRecord(
  ctx: any,
  entityType: EntityType,
  recordId: any,
  policyId?: Id<"retentionPolicies">,
  dsrId?: any
): Promise<void> {
  const now = Date.now();
  const anonymizedFields: string[] = [];

  switch (entityType) {
    case "contact":
      const contact = await ctx.db.get(recordId);
      if (!contact) return;

      if (contact.firstName) anonymizedFields.push("firstName");
      if (contact.lastName) anonymizedFields.push("lastName");
      if (contact.email) anonymizedFields.push("email");
      if (contact.phone) anonymizedFields.push("phone");
      if (contact.address) anonymizedFields.push("address");

      await ctx.db.patch(recordId, {
        firstName: "[REDACTED]",
        lastName: "[REDACTED]",
        email: generateAnonymizedEmail(),
        phone: undefined,
        avatarUrl: undefined,
        linkedinUrl: undefined,
        twitterHandle: undefined,
        address: undefined,
        enrichmentData: undefined,
        updatedAt: now,
      });
      break;

    case "company":
      await ctx.db.patch(recordId, {
        phone: undefined,
        address: undefined,
        enrichmentData: undefined,
        updatedAt: now,
      });
      anonymizedFields.push("phone", "address", "enrichmentData");
      break;

    case "deal":
      // Deals don't contain PII directly, but we can redact notes
      await ctx.db.patch(recordId, {
        aiInsights: undefined,
        updatedAt: now,
      });
      anonymizedFields.push("aiInsights");
      break;

    case "activity":
      await ctx.db.patch(recordId, {
        description: "[REDACTED]",
        aiSummary: undefined,
        updatedAt: now,
      });
      anonymizedFields.push("description", "aiSummary");
      break;

    case "message":
      await ctx.db.patch(recordId, {
        content: "[MESSAGE CONTENT REDACTED]",
        mediaUrl: undefined,
      });
      anonymizedFields.push("content", "mediaUrl");
      break;
  }

  // Create anonymization record
  await ctx.db.insert("anonymizationRecords", {
    entityType,
    entityId: recordId,
    triggeredBy: policyId ? "retention_policy" : dsrId ? "dsr_request" : "manual",
    policyId,
    dsrId,
    anonymizedFields,
    performedAt: now,
  });
}

function generateAnonymizedEmail(): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `anonymized-${random}@privacy.local`;
}

function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

function sanitizeForExport(record: any): any {
  // Remove internal Convex fields and sensitive system data
  const { _id, _creationTime, ...rest } = record;
  return { id: _id, ...rest };
}
