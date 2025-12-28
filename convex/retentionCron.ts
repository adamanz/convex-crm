import { internalMutation, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Run all active retention policies
 * Called by cron job daily
 */
export const runAllActiveRetentionPolicies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all active policies
    const activePolicies = await ctx.db
      .query("retentionPolicies")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const results: { policyId: string; name: string; success: boolean; recordsAffected: number; error?: string }[] = [];

    for (const policy of activePolicies) {
      try {
        // Get matching records
        const cutoffDate = now - policy.retentionDays * 24 * 60 * 60 * 1000;
        const tableName = getTableName(policy.entityType);

        // Get all records from the table
        let records = await ctx.db.query(tableName as any).collect();

        // Filter by retention period
        records = records.filter((record: any) => {
          const dateField = getDateField(policy.entityType, record);
          return dateField && dateField < cutoffDate;
        });

        // Apply conditions
        for (const condition of policy.conditions) {
          records = records.filter((record: any) =>
            evaluateCondition(record, condition)
          );
        }

        // Process matching records (limit to 500 per run to avoid timeout)
        const recordsToProcess = records.slice(0, 500);
        let recordsAffected = 0;
        const affectedRecordIds: string[] = [];
        const errors: string[] = [];

        for (const record of recordsToProcess) {
          try {
            switch (policy.action) {
              case "delete":
                await ctx.db.delete(record._id);
                break;
              case "archive":
                await ctx.db.patch(record._id, {
                  tags: [...(record.tags || []), "_archived"],
                  updatedAt: now,
                });
                break;
              case "anonymize":
                await anonymizeRecord(ctx, policy.entityType, record._id, policy._id);
                break;
            }
            affectedRecordIds.push(record._id);
            recordsAffected++;
          } catch (error) {
            errors.push(`${record._id}: ${error}`);
          }
        }

        // Update policy last run info
        await ctx.db.patch(policy._id, {
          lastRunAt: now,
          lastRunResult: {
            recordsProcessed: recordsToProcess.length,
            recordsAffected,
            errors: errors.length > 0 ? errors : undefined,
          },
        });

        // Create retention log entry
        await ctx.db.insert("retentionLogs", {
          policyId: policy._id,
          policyName: policy.name,
          executedAt: now,
          entityType: policy.entityType,
          action: policy.action,
          recordsProcessed: recordsToProcess.length,
          recordsAffected,
          affectedRecordIds,
          status: errors.length === 0 ? "completed" : errors.length < recordsToProcess.length ? "partial" : "failed",
          errors: errors.length > 0 ? errors : undefined,
        });

        results.push({
          policyId: policy._id,
          name: policy.name,
          success: errors.length === 0,
          recordsAffected,
          error: errors.length > 0 ? `${errors.length} errors` : undefined,
        });
      } catch (error) {
        results.push({
          policyId: policy._id,
          name: policy.name,
          success: false,
          recordsAffected: 0,
          error: String(error),
        });
      }
    }

    // Log the cron run
    await ctx.db.insert("activityLog", {
      system: true,
      action: "retention_cron_completed",
      entityType: "system",
      entityId: "cron",
      metadata: {
        policiesRun: results.length,
        totalRecordsAffected: results.reduce((sum, r) => sum + r.recordsAffected, 0),
        successfulPolicies: results.filter((r) => r.success).length,
      },
      timestamp: now,
    });

    return results;
  },
});

/**
 * Expire old data export requests
 * Called by cron job daily
 */
export const expireDataExports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find completed exports that have passed their expiration date
    const completedExports = await ctx.db
      .query("dataExportRequests")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    let expiredCount = 0;

    for (const exportRequest of completedExports) {
      if (exportRequest.expiresAt && exportRequest.expiresAt < now) {
        await ctx.db.patch(exportRequest._id, {
          status: "expired",
          downloadUrl: undefined,
        });

        // If there's a storage file, we would delete it here
        // await ctx.storage.delete(exportRequest.storageId);

        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      await ctx.db.insert("activityLog", {
        system: true,
        action: "exports_expired",
        entityType: "dataExportRequests",
        entityId: "cron",
        metadata: { expiredCount },
        timestamp: now,
      });
    }

    return { expiredCount };
  },
});

/**
 * Check for overdue DSR requests and create notifications
 * Called by cron job daily
 */
export const checkOverdueDsrs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days before due

    // Find pending/in_progress DSRs that are overdue or near due
    const pendingDsrs = await ctx.db
      .query("dataSubjectRequests")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "verified"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .collect();

    const overdue: string[] = [];
    const nearDue: string[] = [];

    for (const dsr of pendingDsrs) {
      if (dsr.dueDate < now) {
        overdue.push(dsr._id);

        // Create notification for admins
        await ctx.db.insert("notifications", {
          type: "system",
          title: "Overdue Data Subject Request",
          message: `DSR from ${dsr.email} (${dsr.type}) is overdue. GDPR requires response within 30 days.`,
          link: `/settings/retention?tab=dsr&id=${dsr._id}`,
          read: false,
          createdAt: now,
        });
      } else if (dsr.dueDate - now < warningThreshold) {
        nearDue.push(dsr._id);

        // Create warning notification
        await ctx.db.insert("notifications", {
          type: "system",
          title: "Data Subject Request Due Soon",
          message: `DSR from ${dsr.email} (${dsr.type}) is due in less than 7 days.`,
          link: `/settings/retention?tab=dsr&id=${dsr._id}`,
          read: false,
          createdAt: now,
        });
      }
    }

    if (overdue.length > 0 || nearDue.length > 0) {
      await ctx.db.insert("activityLog", {
        system: true,
        action: "dsr_check_completed",
        entityType: "dataSubjectRequests",
        entityId: "cron",
        metadata: { overdueCount: overdue.length, nearDueCount: nearDue.length },
        timestamp: now,
      });
    }

    return { overdueCount: overdue.length, nearDueCount: nearDue.length };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type EntityType = "contact" | "company" | "deal" | "activity" | "message";

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

function evaluateCondition(record: any, condition: any): boolean {
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

async function anonymizeRecord(
  ctx: any,
  entityType: EntityType,
  recordId: any,
  policyId: any
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

      const random = Math.random().toString(36).substring(2, 8);
      await ctx.db.patch(recordId, {
        firstName: "[REDACTED]",
        lastName: "[REDACTED]",
        email: `anonymized-${random}@privacy.local`,
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
    triggeredBy: "retention_policy",
    policyId,
    anonymizedFields,
    performedAt: now,
  });
}
