import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export const entityTypes = v.union(v.literal("quote"), v.literal("deal"));
export const approvalTypes = v.union(
  v.literal("any"),
  v.literal("all"),
  v.literal("sequential")
);
export const approvalStatuses = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);
export const conditionOperators = v.union(
  v.literal("equals"),
  v.literal("notEquals"),
  v.literal("greaterThan"),
  v.literal("lessThan"),
  v.literal("greaterThanOrEqual"),
  v.literal("lessThanOrEqual"),
  v.literal("contains"),
  v.literal("in")
);

// =============================================================================
// APPROVAL RULES - QUERIES
// =============================================================================

/**
 * List all approval rules with optional filtering
 */
export const listRules = query({
  args: {
    entityType: v.optional(entityTypes),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let rules;

    if (args.entityType && args.activeOnly !== false) {
      rules = await ctx.db
        .query("approvalRules")
        .withIndex("by_entity_active", (q) =>
          q.eq("entityType", args.entityType!).eq("isActive", true)
        )
        .collect();
    } else if (args.entityType) {
      rules = await ctx.db
        .query("approvalRules")
        .withIndex("by_entity_type", (q) => q.eq("entityType", args.entityType!))
        .collect();
    } else if (args.activeOnly !== false) {
      rules = await ctx.db
        .query("approvalRules")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    } else {
      rules = await ctx.db.query("approvalRules").collect();
    }

    // Sort by priority (higher first), then by name
    rules.sort((a, b) => {
      const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });

    // Fetch approver details
    const rulesWithApprovers = await Promise.all(
      rules.map(async (rule) => {
        const approvers = await Promise.all(
          rule.approvers.map((userId) => ctx.db.get(userId))
        );
        return {
          ...rule,
          approverDetails: approvers.filter(
            (u): u is Doc<"users"> => u !== null
          ),
        };
      })
    );

    return rulesWithApprovers;
  },
});

/**
 * Get a single approval rule by ID
 */
export const getRule = query({
  args: {
    id: v.id("approvalRules"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      return null;
    }

    // Fetch approver details
    const approvers = await Promise.all(
      rule.approvers.map((userId) => ctx.db.get(userId))
    );

    // Fetch creator details
    let creator: Doc<"users"> | null = null;
    if (rule.createdBy) {
      creator = await ctx.db.get(rule.createdBy);
    }

    return {
      ...rule,
      approverDetails: approvers.filter((u): u is Doc<"users"> => u !== null),
      creator,
    };
  },
});

// =============================================================================
// APPROVAL RULES - MUTATIONS
// =============================================================================

/**
 * Create a new approval rule
 */
export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityType: entityTypes,
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: conditionOperators,
        value: v.any(),
      })
    ),
    approvers: v.array(v.id("users")),
    approvalType: approvalTypes,
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate approvers exist
    for (const approverId of args.approvers) {
      const user = await ctx.db.get(approverId);
      if (!user) {
        throw new Error(`Approver ${approverId} not found`);
      }
    }

    if (args.approvers.length === 0) {
      throw new Error("At least one approver is required");
    }

    const ruleId = await ctx.db.insert("approvalRules", {
      name: args.name,
      description: args.description,
      entityType: args.entityType,
      conditions: args.conditions,
      approvers: args.approvers,
      approvalType: args.approvalType,
      priority: args.priority ?? 0,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_rule_created",
      entityType: "approval_rule",
      entityId: ruleId,
      metadata: {
        name: args.name,
        entityType: args.entityType,
        approvalType: args.approvalType,
      },
      timestamp: now,
      system: true,
    });

    return ruleId;
  },
});

/**
 * Update an existing approval rule
 */
export const updateRule = mutation({
  args: {
    id: v.id("approvalRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: conditionOperators,
          value: v.any(),
        })
      )
    ),
    approvers: v.optional(v.array(v.id("users"))),
    approvalType: v.optional(approvalTypes),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existingRule = await ctx.db.get(id);
    if (!existingRule) {
      throw new Error("Approval rule not found");
    }

    // Validate approvers if being updated
    if (updates.approvers !== undefined) {
      if (updates.approvers.length === 0) {
        throw new Error("At least one approver is required");
      }
      for (const approverId of updates.approvers) {
        const user = await ctx.db.get(approverId);
        if (!user) {
          throw new Error(`Approver ${approverId} not found`);
        }
      }
    }

    // Build update object
    const updateData: Partial<Doc<"approvalRules">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.conditions !== undefined)
      updateData.conditions = updates.conditions;
    if (updates.approvers !== undefined)
      updateData.approvers = updates.approvers;
    if (updates.approvalType !== undefined)
      updateData.approvalType = updates.approvalType;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_rule_updated",
      entityType: "approval_rule",
      entityId: id,
      changes: updates,
      timestamp: now,
      system: true,
    });

    return id;
  },
});

/**
 * Delete an approval rule
 */
export const deleteRule = mutation({
  args: {
    id: v.id("approvalRules"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Approval rule not found");
    }

    // Check for pending requests using this rule
    const pendingRequests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_rule", (q) => q.eq("ruleId", args.id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(1);

    if (pendingRequests.length > 0) {
      throw new Error(
        "Cannot delete rule with pending approval requests. Please resolve or reject pending requests first."
      );
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "approval_rule_deleted",
      entityType: "approval_rule",
      entityId: args.id,
      metadata: {
        deletedRule: {
          name: rule.name,
          entityType: rule.entityType,
        },
      },
      timestamp: Date.now(),
      system: true,
    });

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// =============================================================================
// APPROVAL REQUESTS - QUERIES
// =============================================================================

/**
 * List approval requests with filtering
 */
export const listRequests = query({
  args: {
    entityType: v.optional(entityTypes),
    entityId: v.optional(v.string()),
    status: v.optional(approvalStatuses),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let requests;

    if (args.entityId && args.entityType) {
      requests = await ctx.db
        .query("approvalRequests")
        .withIndex("by_entity", (q) =>
          q.eq("entityType", args.entityType!).eq("entityId", args.entityId!)
        )
        .order("desc")
        .take(limit);
    } else if (args.status) {
      requests = await ctx.db
        .query("approvalRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      requests = await ctx.db
        .query("approvalRequests")
        .withIndex("by_created")
        .order("desc")
        .take(limit);
    }

    // Fetch related data
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const requestedByUser = await ctx.db.get(request.requestedBy);
        const approvers = await Promise.all(
          request.requiredApprovers.map((id) => ctx.db.get(id))
        );

        // Get entity details
        let entityName = "";
        let entityDetails: any = null;
        if (request.entityType === "deal") {
          const deal = await ctx.db.get(request.entityId as Id<"deals">);
          if (deal) {
            entityName = deal.name;
            entityDetails = {
              amount: deal.amount,
              status: deal.status,
            };
          }
        } else if (request.entityType === "quote") {
          const quote = await ctx.db.get(request.entityId as Id<"quotes">);
          if (quote) {
            entityName = quote.name;
            entityDetails = {
              total: quote.total,
              status: quote.status,
            };
          }
        }

        return {
          ...request,
          requestedByUser,
          approverDetails: approvers.filter(
            (u): u is Doc<"users"> => u !== null
          ),
          entityName,
          entityDetails,
        };
      })
    );

    return requestsWithDetails;
  },
});

/**
 * Get approval requests pending for a specific user
 */
export const getMyPendingApprovals = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all pending requests
    const pendingRequests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter to requests where this user is a required approver
    // and hasn't already responded
    const myPendingRequests = pendingRequests.filter((request) => {
      // Check if user is in required approvers
      if (!request.requiredApprovers.includes(args.userId)) {
        return false;
      }

      // Check if user has already responded
      const hasResponded = request.responses.some(
        (r) => r.userId === args.userId
      );
      if (hasResponded) {
        return false;
      }

      // For sequential approval, check if it's this user's turn
      if (request.approvalType === "sequential") {
        const currentStep = request.currentStep ?? 0;
        const currentApproverId = request.requiredApprovers[currentStep];
        return currentApproverId === args.userId;
      }

      return true;
    });

    // Fetch details for each request
    const requestsWithDetails = await Promise.all(
      myPendingRequests.map(async (request) => {
        const requestedByUser = await ctx.db.get(request.requestedBy);

        // Get entity details
        let entityName = "";
        let entityDetails: any = null;
        if (request.entityType === "deal") {
          const deal = await ctx.db.get(request.entityId as Id<"deals">);
          if (deal) {
            entityName = deal.name;
            entityDetails = {
              amount: deal.amount,
              status: deal.status,
            };
          }
        } else if (request.entityType === "quote") {
          const quote = await ctx.db.get(request.entityId as Id<"quotes">);
          if (quote) {
            entityName = quote.name;
            entityDetails = {
              total: quote.total,
              status: quote.status,
            };
          }
        }

        return {
          ...request,
          requestedByUser,
          entityName,
          entityDetails,
        };
      })
    );

    return requestsWithDetails;
  },
});

/**
 * Get pending approval requests for a specific entity
 */
export const getPendingApprovalsByEntity = query({
  args: {
    entityType: entityTypes,
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Fetch details
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const requestedByUser = await ctx.db.get(request.requestedBy);
        const approvers = await Promise.all(
          request.requiredApprovers.map((id) => ctx.db.get(id))
        );

        return {
          ...request,
          requestedByUser,
          approverDetails: approvers.filter(
            (u): u is Doc<"users"> => u !== null
          ),
        };
      })
    );

    return requestsWithDetails;
  },
});

/**
 * Get a single approval request by ID
 */
export const getRequest = query({
  args: {
    id: v.id("approvalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      return null;
    }

    const requestedByUser = await ctx.db.get(request.requestedBy);
    const approvers = await Promise.all(
      request.requiredApprovers.map((id) => ctx.db.get(id))
    );

    // Get responder details
    const responsesWithUsers = await Promise.all(
      request.responses.map(async (response) => {
        const user = await ctx.db.get(response.userId);
        return {
          ...response,
          user,
        };
      })
    );

    // Get entity details
    let entityName = "";
    let entityDetails: any = null;
    if (request.entityType === "deal") {
      const deal = await ctx.db.get(request.entityId as Id<"deals">);
      if (deal) {
        entityName = deal.name;
        entityDetails = deal;
      }
    } else if (request.entityType === "quote") {
      const quote = await ctx.db.get(request.entityId as Id<"quotes">);
      if (quote) {
        entityName = quote.name;
        entityDetails = quote;
      }
    }

    return {
      ...request,
      requestedByUser,
      approverDetails: approvers.filter((u): u is Doc<"users"> => u !== null),
      responsesWithUsers,
      entityName,
      entityDetails,
    };
  },
});

// =============================================================================
// APPROVAL REQUESTS - MUTATIONS
// =============================================================================

/**
 * Check if approval is required for an entity based on active rules
 */
export const checkApprovalRequired = query({
  args: {
    entityType: entityTypes,
    entityData: v.any(),
  },
  handler: async (ctx, args) => {
    const { entityType, entityData } = args;

    // Get all active rules for this entity type
    const rules = await ctx.db
      .query("approvalRules")
      .withIndex("by_entity_active", (q) =>
        q.eq("entityType", entityType).eq("isActive", true)
      )
      .collect();

    // Sort by priority (higher first)
    rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Check each rule's conditions
    for (const rule of rules) {
      const conditionsMet = evaluateConditions(rule.conditions, entityData);
      if (conditionsMet) {
        return {
          required: true,
          rule: {
            _id: rule._id,
            name: rule.name,
            approvers: rule.approvers,
            approvalType: rule.approvalType,
          },
        };
      }
    }

    return { required: false, rule: null };
  },
});

/**
 * Helper function to evaluate conditions against entity data
 */
function evaluateConditions(
  conditions: Array<{ field: string; operator: string; value: any }>,
  entityData: any
): boolean {
  // All conditions must be met (AND logic)
  return conditions.every((condition) => {
    const fieldValue = getNestedValue(entityData, condition.field);
    return evaluateCondition(fieldValue, condition.operator, condition.value);
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function evaluateCondition(
  fieldValue: any,
  operator: string,
  conditionValue: any
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "notEquals":
      return fieldValue !== conditionValue;
    case "greaterThan":
      return Number(fieldValue) > Number(conditionValue);
    case "lessThan":
      return Number(fieldValue) < Number(conditionValue);
    case "greaterThanOrEqual":
      return Number(fieldValue) >= Number(conditionValue);
    case "lessThanOrEqual":
      return Number(fieldValue) <= Number(conditionValue);
    case "contains":
      return String(fieldValue)
        .toLowerCase()
        .includes(String(conditionValue).toLowerCase());
    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Request approval for an entity
 */
export const requestApproval = mutation({
  args: {
    ruleId: v.id("approvalRules"),
    entityType: entityTypes,
    entityId: v.string(),
    requestedBy: v.id("users"),
    entitySnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate rule exists and is active
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Approval rule not found");
    }
    if (!rule.isActive) {
      throw new Error("Approval rule is not active");
    }
    if (rule.entityType !== args.entityType) {
      throw new Error("Rule entity type does not match request entity type");
    }

    // Check for existing pending request
    const existingPending = await ctx.db
      .query("approvalRequests")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPending) {
      throw new Error(
        "There is already a pending approval request for this entity"
      );
    }

    // Create the approval request
    const requestId = await ctx.db.insert("approvalRequests", {
      ruleId: args.ruleId,
      ruleName: rule.name,
      entityType: args.entityType,
      entityId: args.entityId,
      status: "pending",
      requestedBy: args.requestedBy,
      requestedAt: now,
      currentStep: rule.approvalType === "sequential" ? 0 : undefined,
      requiredApprovers: rule.approvers,
      approvalType: rule.approvalType,
      responses: [],
      entitySnapshot: args.entitySnapshot,
    });

    // Create notifications for approvers
    const requester = await ctx.db.get(args.requestedBy);
    const requesterName = requester
      ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim() ||
        requester.email
      : "Someone";

    // Get entity name for notification
    let entityName = "";
    if (args.entityType === "deal") {
      const deal = await ctx.db.get(args.entityId as Id<"deals">);
      if (deal) entityName = deal.name;
    } else if (args.entityType === "quote") {
      const quote = await ctx.db.get(args.entityId as Id<"quotes">);
      if (quote) entityName = quote.name;
    }

    // Determine who to notify based on approval type
    const approversToNotify =
      rule.approvalType === "sequential"
        ? [rule.approvers[0]] // Only notify first approver for sequential
        : rule.approvers; // Notify all for "any" or "all"

    for (const approverId of approversToNotify) {
      await ctx.db.insert("notifications", {
        type: "system",
        title: "Approval Required",
        message: `${requesterName} requested approval for ${args.entityType} "${entityName}"`,
        link: `/${args.entityType}s/${args.entityId}`,
        relatedEntityType: args.entityType as "deal",
        relatedEntityId: args.entityId,
        userId: approverId,
        read: false,
        createdAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_requested",
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: {
        requestId,
        ruleName: rule.name,
        approvers: rule.approvers,
      },
      userId: args.requestedBy,
      timestamp: now,
    });

    return requestId;
  },
});

/**
 * Approve an approval request
 */
export const approve = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "pending") {
      throw new Error("This approval request is no longer pending");
    }

    // Validate user is an authorized approver
    if (!request.requiredApprovers.includes(args.userId)) {
      throw new Error("You are not authorized to approve this request");
    }

    // Check if user has already responded
    if (request.responses.some((r) => r.userId === args.userId)) {
      throw new Error("You have already responded to this request");
    }

    // For sequential approval, check if it's this user's turn
    if (request.approvalType === "sequential") {
      const currentStep = request.currentStep ?? 0;
      if (request.requiredApprovers[currentStep] !== args.userId) {
        throw new Error("It is not your turn to approve this request");
      }
    }

    // Add the approval response
    const newResponses = [
      ...request.responses,
      {
        userId: args.userId,
        decision: "approved" as const,
        comment: args.comment,
        decidedAt: now,
      },
    ];

    // Determine if the request is now fully approved
    let isFullyApproved = false;
    let newStatus: "pending" | "approved" = "pending";
    let newStep = request.currentStep;

    if (request.approvalType === "any") {
      // Any one approval is enough
      isFullyApproved = true;
      newStatus = "approved";
    } else if (request.approvalType === "all") {
      // Need all approvers
      isFullyApproved =
        newResponses.filter((r) => r.decision === "approved").length ===
        request.requiredApprovers.length;
      if (isFullyApproved) {
        newStatus = "approved";
      }
    } else if (request.approvalType === "sequential") {
      // Check if this was the last approver
      const currentStep = request.currentStep ?? 0;
      if (currentStep >= request.requiredApprovers.length - 1) {
        isFullyApproved = true;
        newStatus = "approved";
      } else {
        newStep = currentStep + 1;
        // Notify next approver
        const nextApproverId = request.requiredApprovers[newStep];
        await ctx.db.insert("notifications", {
          type: "system",
          title: "Approval Required",
          message: `Your approval is needed for ${request.entityType} (Step ${newStep + 1})`,
          link: `/${request.entityType}s/${request.entityId}`,
          relatedEntityType: request.entityType as "deal",
          relatedEntityId: request.entityId,
          userId: nextApproverId,
          read: false,
          createdAt: now,
        });
      }
    }

    // Update the request
    await ctx.db.patch(args.requestId, {
      responses: newResponses,
      status: newStatus,
      currentStep: newStep,
      ...(isFullyApproved
        ? {
            completedAt: now,
            completedBy: args.userId,
          }
        : {}),
    });

    // If fully approved, notify the requester
    if (isFullyApproved) {
      const approver = await ctx.db.get(args.userId);
      const approverName = approver
        ? `${approver.firstName ?? ""} ${approver.lastName ?? ""}`.trim() ||
          approver.email
        : "An approver";

      await ctx.db.insert("notifications", {
        type: "system",
        title: "Approval Granted",
        message: `Your ${request.entityType} has been approved${request.approvalType === "all" ? " by all approvers" : ""}`,
        link: `/${request.entityType}s/${request.entityId}`,
        relatedEntityType: request.entityType as "deal",
        relatedEntityId: request.entityId,
        userId: request.requestedBy,
        read: false,
        createdAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_granted",
      entityType: request.entityType,
      entityId: request.entityId,
      metadata: {
        requestId: args.requestId,
        isFullyApproved,
        comment: args.comment,
      },
      userId: args.userId,
      timestamp: now,
    });

    return {
      requestId: args.requestId,
      isFullyApproved,
      status: newStatus,
    };
  },
});

/**
 * Reject an approval request
 */
export const reject = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "pending") {
      throw new Error("This approval request is no longer pending");
    }

    // Validate user is an authorized approver
    if (!request.requiredApprovers.includes(args.userId)) {
      throw new Error("You are not authorized to reject this request");
    }

    // Check if user has already responded
    if (request.responses.some((r) => r.userId === args.userId)) {
      throw new Error("You have already responded to this request");
    }

    // For sequential approval, check if it's this user's turn
    if (request.approvalType === "sequential") {
      const currentStep = request.currentStep ?? 0;
      if (request.requiredApprovers[currentStep] !== args.userId) {
        throw new Error("It is not your turn to respond to this request");
      }
    }

    // Add the rejection response
    const newResponses = [
      ...request.responses,
      {
        userId: args.userId,
        decision: "rejected" as const,
        comment: args.reason,
        decidedAt: now,
      },
    ];

    // Update the request - any rejection marks the whole request as rejected
    await ctx.db.patch(args.requestId, {
      responses: newResponses,
      status: "rejected",
      completedAt: now,
      completedBy: args.userId,
    });

    // Notify the requester
    const rejecter = await ctx.db.get(args.userId);
    const rejecterName = rejecter
      ? `${rejecter.firstName ?? ""} ${rejecter.lastName ?? ""}`.trim() ||
        rejecter.email
      : "An approver";

    await ctx.db.insert("notifications", {
      type: "system",
      title: "Approval Rejected",
      message: `Your ${request.entityType} was rejected by ${rejecterName}: ${args.reason}`,
      link: `/${request.entityType}s/${request.entityId}`,
      relatedEntityType: request.entityType as "deal",
      relatedEntityId: request.entityId,
      userId: request.requestedBy,
      read: false,
      createdAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_rejected",
      entityType: request.entityType,
      entityId: request.entityId,
      metadata: {
        requestId: args.requestId,
        reason: args.reason,
      },
      userId: args.userId,
      timestamp: now,
    });

    return {
      requestId: args.requestId,
      status: "rejected" as const,
    };
  },
});

/**
 * Cancel a pending approval request (by the requester)
 */
export const cancelRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Approval request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be cancelled");
    }

    if (request.requestedBy !== args.userId) {
      throw new Error("Only the requester can cancel this request");
    }

    // Delete the request
    await ctx.db.delete(args.requestId);

    // Log activity
    await ctx.db.insert("activityLog", {
      action: "approval_cancelled",
      entityType: request.entityType,
      entityId: request.entityId,
      metadata: {
        requestId: args.requestId,
      },
      userId: args.userId,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get count of pending approvals for a user
 */
export const getPendingApprovalCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all pending requests
    const pendingRequests = await ctx.db
      .query("approvalRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Count requests where this user needs to respond
    let count = 0;
    for (const request of pendingRequests) {
      if (!request.requiredApprovers.includes(args.userId)) {
        continue;
      }

      const hasResponded = request.responses.some(
        (r) => r.userId === args.userId
      );
      if (hasResponded) {
        continue;
      }

      if (request.approvalType === "sequential") {
        const currentStep = request.currentStep ?? 0;
        if (request.requiredApprovers[currentStep] === args.userId) {
          count++;
        }
      } else {
        count++;
      }
    }

    return count;
  },
});
