import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

// ============================================================================
// WORKFLOW ENGINE - Execution engine for automated workflows
// ============================================================================

// Types for workflow step configurations
type StepType =
  | "send_message"
  | "send_email"
  | "create_task"
  | "wait"
  | "condition"
  | "ai_action";

interface WorkflowStep {
  id: string;
  type: StepType;
  config: any;
  order: number;
}

// Step execution result
interface StepResult {
  success: boolean;
  output?: any;
  error?: string;
  nextStepId?: string; // For conditional branching
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all workflow runs for a specific workflow
 */
export const getWorkflowRuns = query({
  args: {
    workflowId: v.id("workflows"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let runsQuery = ctx.db
      .query("workflowRuns")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId));

    const runs = await runsQuery.order("desc").collect();

    let filtered = runs;
    if (args.status) {
      filtered = runs.filter((r) => r.status === args.status);
    }

    const limit = args.limit ?? 50;
    return filtered.slice(0, limit);
  },
});

/**
 * Get a specific workflow run with full details
 */
export const getWorkflowRun = query({
  args: { id: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;

    const workflow = await ctx.db.get(run.workflowId);

    return {
      ...run,
      workflow,
    };
  },
});

/**
 * Get active workflow runs for a specific context (e.g., a contact or deal)
 */
export const getActiveRunsByContext = query({
  args: {
    contextType: v.string(),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_context", (q) =>
        q.eq("contextType", args.contextType).eq("contextId", args.contextId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return runs;
  },
});

/**
 * Get workflows by trigger type
 */
export const getWorkflowsByTrigger = query({
  args: {
    triggerType: v.union(
      v.literal("manual"),
      v.literal("deal_stage_change"),
      v.literal("new_contact"),
      v.literal("inbound_message"),
      v.literal("scheduled")
    ),
  },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("triggerType", args.triggerType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return workflows;
  },
});

// ============================================================================
// MUTATIONS - Public API
// ============================================================================

/**
 * Start a new workflow execution
 */
export const startWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    contextType: v.string(), // "contact", "deal", "conversation", etc.
    contextId: v.string(),
    initialData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      throw new Error("Workflow is not active");
    }

    if (workflow.steps.length === 0) {
      throw new Error("Workflow has no steps");
    }

    // Check if there's already an active run for this context
    const existingRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_context", (q) =>
        q.eq("contextType", args.contextType).eq("contextId", args.contextId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (existingRuns.some((r) => r.workflowId === args.workflowId)) {
      throw new Error("A run of this workflow is already active for this context");
    }

    const now = Date.now();

    // Sort steps by order and get the first one
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    const firstStep = sortedSteps[0];

    // Create the workflow run
    const runId = await ctx.db.insert("workflowRuns", {
      workflowId: args.workflowId,
      contextType: args.contextType,
      contextId: args.contextId,
      currentStepId: firstStep.id,
      status: "active",
      collectedData: args.initialData ?? {},
      startedAt: now,
    });

    // Log the start
    await ctx.db.insert("activityLog", {
      action: "workflow_started",
      entityType: args.contextType,
      entityId: args.contextId,
      metadata: {
        workflowId: args.workflowId,
        workflowName: workflow.name,
        runId: runId,
      },
      timestamp: now,
      system: true,
    });

    // Schedule execution of the first step
    await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
      runId,
    });

    return runId;
  },
});

/**
 * Pause a running workflow
 */
export const pauseWorkflow = mutation({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Workflow run not found");
    }

    if (run.status !== "active") {
      throw new Error("Workflow run is not active");
    }

    await ctx.db.patch(args.runId, {
      status: "paused",
    });

    await ctx.db.insert("activityLog", {
      action: "workflow_paused",
      entityType: run.contextType,
      entityId: run.contextId,
      metadata: { runId: args.runId },
      timestamp: Date.now(),
      system: true,
    });

    return args.runId;
  },
});

/**
 * Resume a paused workflow
 */
export const resumeWorkflow = mutation({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Workflow run not found");
    }

    if (run.status !== "paused") {
      throw new Error("Workflow run is not paused");
    }

    await ctx.db.patch(args.runId, {
      status: "active",
    });

    await ctx.db.insert("activityLog", {
      action: "workflow_resumed",
      entityType: run.contextType,
      entityId: run.contextId,
      metadata: { runId: args.runId },
      timestamp: Date.now(),
      system: true,
    });

    // Resume execution from current step
    await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
      runId: args.runId,
    });

    return args.runId;
  },
});

/**
 * Cancel a workflow run
 */
export const cancelWorkflow = mutation({
  args: {
    runId: v.id("workflowRuns"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Workflow run not found");
    }

    if (run.status === "completed" || run.status === "failed") {
      throw new Error("Workflow run has already ended");
    }

    const now = Date.now();

    await ctx.db.patch(args.runId, {
      status: "failed",
      completedAt: now,
      collectedData: {
        ...(run.collectedData ?? {}),
        cancelReason: args.reason ?? "Manually cancelled",
      },
    });

    await ctx.db.insert("activityLog", {
      action: "workflow_cancelled",
      entityType: run.contextType,
      entityId: run.contextId,
      metadata: {
        runId: args.runId,
        reason: args.reason,
      },
      timestamp: now,
      system: true,
    });

    // Clean up conversation status if it's a conversation-based workflow
    if (run.contextType === "conversation") {
      const conversationId = run.contextId as Id<"conversations">;
      const conversation = await ctx.db.get(conversationId);
      if (conversation && conversation.status === "workflow_active") {
        await ctx.db.patch(conversationId, {
          status: "active",
          activeWorkflowId: undefined,
        });
      }
    }

    return args.runId;
  },
});

/**
 * Advance workflow manually (skip current step)
 */
export const advanceWorkflow = mutation({
  args: {
    runId: v.id("workflowRuns"),
    providedData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Workflow run not found");
    }

    if (run.status !== "active" && run.status !== "paused") {
      throw new Error("Workflow run is not active or paused");
    }

    const workflow = await ctx.db.get(run.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Find next step
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex((s) => s.id === run.currentStepId);

    if (currentIndex === -1 || currentIndex >= sortedSteps.length - 1) {
      // No more steps - complete the workflow
      await ctx.db.patch(args.runId, {
        status: "completed",
        completedAt: Date.now(),
        collectedData: {
          ...(run.collectedData ?? {}),
          ...(args.providedData ?? {}),
        },
      });

      return { completed: true, runId: args.runId };
    }

    const nextStep = sortedSteps[currentIndex + 1];

    // Update to next step
    await ctx.db.patch(args.runId, {
      currentStepId: nextStep.id,
      status: "active",
      collectedData: {
        ...(run.collectedData ?? {}),
        ...(args.providedData ?? {}),
      },
    });

    // Schedule execution of next step
    await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
      runId: args.runId,
    });

    return { completed: false, runId: args.runId, nextStepId: nextStep.id };
  },
});

// ============================================================================
// INTERNAL MUTATIONS - Step Execution
// ============================================================================

/**
 * Internal: Execute the current step of a workflow run
 */
export const executeStepInternal = internalMutation({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      console.error("Workflow run not found:", args.runId);
      return;
    }

    // Check if run is still active
    if (run.status !== "active") {
      console.log("Workflow run is not active, skipping execution:", run.status);
      return;
    }

    const workflow = await ctx.db.get(run.workflowId);
    if (!workflow) {
      await ctx.db.patch(args.runId, {
        status: "failed",
        completedAt: Date.now(),
        collectedData: {
          ...(run.collectedData ?? {}),
          error: "Workflow not found",
        },
      });
      return;
    }

    // Find the current step
    const currentStep = workflow.steps.find((s) => s.id === run.currentStepId);
    if (!currentStep) {
      await ctx.db.patch(args.runId, {
        status: "failed",
        completedAt: Date.now(),
        collectedData: {
          ...(run.collectedData ?? {}),
          error: `Step ${run.currentStepId} not found in workflow`,
        },
      });
      return;
    }

    try {
      // Execute the step based on type
      const result = await executeStep(ctx, run, workflow, currentStep);

      if (!result.success) {
        // Step failed
        await ctx.db.patch(args.runId, {
          status: "failed",
          completedAt: Date.now(),
          collectedData: {
            ...(run.collectedData ?? {}),
            stepError: result.error,
            failedStepId: currentStep.id,
          },
        });

        await ctx.db.insert("activityLog", {
          action: "workflow_step_failed",
          entityType: run.contextType,
          entityId: run.contextId,
          metadata: {
            runId: args.runId,
            stepId: currentStep.id,
            stepType: currentStep.type,
            error: result.error,
          },
          timestamp: Date.now(),
          system: true,
        });

        return;
      }

      // Log step completion
      await ctx.db.insert("activityLog", {
        action: "workflow_step_completed",
        entityType: run.contextType,
        entityId: run.contextId,
        metadata: {
          runId: args.runId,
          stepId: currentStep.id,
          stepType: currentStep.type,
          output: result.output,
        },
        timestamp: Date.now(),
        system: true,
      });

      // Merge collected data
      const updatedData = {
        ...(run.collectedData ?? {}),
        [`step_${currentStep.id}_output`]: result.output,
      };

      // Find next step
      const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
      let nextStepId = result.nextStepId;

      if (!nextStepId) {
        // Find the next step by order
        const currentIndex = sortedSteps.findIndex((s) => s.id === currentStep.id);
        if (currentIndex < sortedSteps.length - 1) {
          nextStepId = sortedSteps[currentIndex + 1].id;
        }
      }

      if (!nextStepId) {
        // No more steps - workflow complete
        const now = Date.now();
        await ctx.db.patch(args.runId, {
          status: "completed",
          completedAt: now,
          collectedData: updatedData,
        });

        await ctx.db.insert("activityLog", {
          action: "workflow_completed",
          entityType: run.contextType,
          entityId: run.contextId,
          metadata: {
            runId: args.runId,
            workflowId: workflow._id,
            workflowName: workflow.name,
          },
          timestamp: now,
          system: true,
        });

        // Clean up conversation status if needed
        if (run.contextType === "conversation") {
          const conversationId = run.contextId as Id<"conversations">;
          const conversation = await ctx.db.get(conversationId);
          if (conversation && conversation.status === "workflow_active") {
            await ctx.db.patch(conversationId, {
              status: "active",
              activeWorkflowId: undefined,
            });
          }
        }

        return;
      }

      // Update run with next step
      await ctx.db.patch(args.runId, {
        currentStepId: nextStepId,
        collectedData: updatedData,
      });

      // Schedule next step (no delay by default, wait step handles its own delay)
      if (currentStep.type !== "wait") {
        await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
          runId: args.runId,
        });
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await ctx.db.patch(args.runId, {
        status: "failed",
        completedAt: Date.now(),
        collectedData: {
          ...(run.collectedData ?? {}),
          error: errorMessage,
          failedStepId: currentStep.id,
        },
      });

      await ctx.db.insert("activityLog", {
        action: "workflow_error",
        entityType: run.contextType,
        entityId: run.contextId,
        metadata: {
          runId: args.runId,
          stepId: currentStep.id,
          error: errorMessage,
        },
        timestamp: Date.now(),
        system: true,
      });
    }
  },
});

/**
 * Internal: Continue workflow after a wait step
 */
export const continueAfterWait = internalMutation({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      console.error("Workflow run not found:", args.runId);
      return;
    }

    // Re-check status in case it was cancelled during wait
    if (run.status !== "active") {
      console.log("Workflow run is no longer active after wait:", run.status);
      return;
    }

    const workflow = await ctx.db.get(run.workflowId);
    if (!workflow) {
      return;
    }

    // Find next step after current
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex((s) => s.id === run.currentStepId);

    if (currentIndex < sortedSteps.length - 1) {
      const nextStep = sortedSteps[currentIndex + 1];

      await ctx.db.patch(args.runId, {
        currentStepId: nextStep.id,
        nextStepAt: undefined,
      });

      // Execute next step
      await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
        runId: args.runId,
      });
    } else {
      // No more steps - complete workflow
      const now = Date.now();
      await ctx.db.patch(args.runId, {
        status: "completed",
        completedAt: now,
        nextStepAt: undefined,
      });

      await ctx.db.insert("activityLog", {
        action: "workflow_completed",
        entityType: run.contextType,
        entityId: run.contextId,
        metadata: {
          runId: args.runId,
          workflowId: workflow._id,
          workflowName: workflow.name,
        },
        timestamp: now,
        system: true,
      });
    }
  },
});

// ============================================================================
// STEP EXECUTORS
// ============================================================================

/**
 * Main step execution dispatcher
 */
async function executeStep(
  ctx: any,
  run: Doc<"workflowRuns">,
  workflow: Doc<"workflows">,
  step: WorkflowStep
): Promise<StepResult> {
  switch (step.type) {
    case "send_message":
      return executeSendMessage(ctx, run, step);
    case "send_email":
      return executeSendEmail(ctx, run, step);
    case "create_task":
      return executeCreateTask(ctx, run, step);
    case "wait":
      return executeWait(ctx, run, step);
    case "condition":
      return executeCondition(ctx, run, workflow, step);
    case "ai_action":
      return executeAiAction(ctx, run, step);
    default:
      return {
        success: false,
        error: `Unknown step type: ${(step as any).type}`,
      };
  }
}

/**
 * Execute send_message step
 * Config: { content: string, useTemplate?: boolean, templateId?: string }
 */
async function executeSendMessage(
  ctx: any,
  run: Doc<"workflowRuns">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    content?: string;
    useTemplate?: boolean;
    templateId?: string;
  };

  if (!config.content && !config.templateId) {
    return { success: false, error: "No message content or template specified" };
  }

  // Get the conversation
  if (run.contextType !== "conversation" && run.contextType !== "contact") {
    return {
      success: false,
      error: "send_message requires a conversation or contact context",
    };
  }

  let conversationId: Id<"conversations"> | null = null;

  if (run.contextType === "conversation") {
    conversationId = run.contextId as Id<"conversations">;
  } else if (run.contextType === "contact") {
    // Find conversation for this contact
    const contactId = run.contextId as Id<"contacts">;
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q: any) => q.eq("contactId", contactId))
      .collect();

    if (conversations.length > 0) {
      conversationId = conversations[0]._id;
    }
  }

  if (!conversationId) {
    return { success: false, error: "No conversation found for context" };
  }

  const conversation = await ctx.db.get(conversationId);
  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  // Process message content (replace placeholders)
  let content = config.content ?? "";

  // Get collected data for template replacement
  const data = run.collectedData ?? {};
  content = replaceTemplateVariables(content, data, run);

  const now = Date.now();

  // Create the message
  const messageId = await ctx.db.insert("messages", {
    conversationId,
    direction: "outbound",
    content,
    status: "pending",
    aiGenerated: true,
    workflowId: run.workflowId,
    timestamp: now,
  });

  // Update conversation stats
  await ctx.db.patch(conversationId, {
    messageCount: conversation.messageCount + 1,
    lastMessageAt: now,
    lastMessagePreview:
      content.length > 100 ? content.substring(0, 100) + "..." : content,
  });

  return {
    success: true,
    output: { messageId, content },
  };
}

/**
 * Execute send_email step
 * Config: { to?: string, subject: string, body: string, useContactEmail?: boolean }
 */
async function executeSendEmail(
  ctx: any,
  run: Doc<"workflowRuns">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    to?: string;
    subject?: string;
    body?: string;
    useContactEmail?: boolean;
  };

  if (!config.subject || !config.body) {
    return { success: false, error: "Email subject and body are required" };
  }

  let recipientEmail = config.to;

  // Get contact email if needed
  if (config.useContactEmail && run.contextType === "contact") {
    const contact = await ctx.db.get(run.contextId as Id<"contacts">);
    if (contact?.email) {
      recipientEmail = contact.email;
    }
  } else if (run.contextType === "deal") {
    // Try to get primary contact from deal
    const deal = await ctx.db.get(run.contextId as Id<"deals">);
    if (deal && deal.contactIds.length > 0) {
      const contact = await ctx.db.get(deal.contactIds[0]);
      if (contact?.email) {
        recipientEmail = contact.email;
      }
    }
  }

  if (!recipientEmail) {
    return { success: false, error: "No recipient email address available" };
  }

  // Process templates
  const data = run.collectedData ?? {};
  const subject = replaceTemplateVariables(config.subject, data, run);
  const body = replaceTemplateVariables(config.body, data, run);

  const now = Date.now();

  // Create an email activity record
  const activityId = await ctx.db.insert("activities", {
    type: "email",
    subject,
    description: body,
    relatedToType: run.contextType as "contact" | "company" | "deal",
    relatedToId: run.contextId,
    emailDirection: "outbound",
    createdAt: now,
    updatedAt: now,
  });

  // Note: Actual email sending would be done via an action or HTTP endpoint
  // This creates the record and would typically trigger an external email service

  return {
    success: true,
    output: {
      activityId,
      to: recipientEmail,
      subject,
      status: "queued",
    },
  };
}

/**
 * Execute create_task step
 * Config: { subject: string, description?: string, dueInDays?: number, priority?: string, assignToOwner?: boolean }
 */
async function executeCreateTask(
  ctx: any,
  run: Doc<"workflowRuns">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    subject?: string;
    description?: string;
    dueInDays?: number;
    priority?: "low" | "medium" | "high";
    assignToOwner?: boolean;
    assignedToId?: string;
  };

  if (!config.subject) {
    return { success: false, error: "Task subject is required" };
  }

  const now = Date.now();
  const dueDate = config.dueInDays
    ? now + config.dueInDays * 24 * 60 * 60 * 1000
    : undefined;

  // Get owner if assignToOwner is true
  let assignedToId: Id<"users"> | undefined;
  if (config.assignToOwner) {
    // Try to get owner from context
    if (run.contextType === "deal") {
      const deal = await ctx.db.get(run.contextId as Id<"deals">);
      assignedToId = deal?.ownerId;
    } else if (run.contextType === "contact") {
      const contact = await ctx.db.get(run.contextId as Id<"contacts">);
      assignedToId = contact?.ownerId;
    } else if (run.contextType === "conversation") {
      const conversation = await ctx.db.get(run.contextId as Id<"conversations">);
      assignedToId = conversation?.ownerId;
    }
  } else if (config.assignedToId) {
    assignedToId = config.assignedToId as Id<"users">;
  }

  // Process templates
  const data = run.collectedData ?? {};
  const subject = replaceTemplateVariables(config.subject, data, run);
  const description = config.description
    ? replaceTemplateVariables(config.description, data, run)
    : undefined;

  const taskId = await ctx.db.insert("activities", {
    type: "task",
    subject,
    description,
    relatedToType: run.contextType as "contact" | "company" | "deal",
    relatedToId: run.contextId,
    dueDate,
    priority: config.priority ?? "medium",
    completed: false,
    assignedToId,
    createdAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    output: { taskId, subject, dueDate },
  };
}

/**
 * Execute wait step
 * Config: { duration: number, unit: "minutes" | "hours" | "days" }
 */
async function executeWait(
  ctx: any,
  run: Doc<"workflowRuns">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    duration?: number;
    unit?: "minutes" | "hours" | "days";
  };

  const duration = config.duration ?? 1;
  const unit = config.unit ?? "hours";

  // Calculate delay in milliseconds
  let delayMs: number;
  switch (unit) {
    case "minutes":
      delayMs = duration * 60 * 1000;
      break;
    case "hours":
      delayMs = duration * 60 * 60 * 1000;
      break;
    case "days":
      delayMs = duration * 24 * 60 * 60 * 1000;
      break;
    default:
      delayMs = duration * 60 * 60 * 1000; // Default to hours
  }

  const nextStepAt = Date.now() + delayMs;

  // Update run with next step time
  await ctx.db.patch(run._id, {
    nextStepAt,
  });

  // Schedule continuation after delay
  await ctx.scheduler.runAfter(delayMs, internal.workflowEngine.continueAfterWait, {
    runId: run._id,
  });

  return {
    success: true,
    output: {
      waitDuration: duration,
      waitUnit: unit,
      resumeAt: nextStepAt,
    },
  };
}

/**
 * Execute condition step
 * Config: { field: string, operator: string, value: any, trueStepId?: string, falseStepId?: string }
 */
async function executeCondition(
  ctx: any,
  run: Doc<"workflowRuns">,
  workflow: Doc<"workflows">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    field?: string;
    operator?: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "exists";
    value?: any;
    trueStepId?: string;
    falseStepId?: string;
  };

  if (!config.field || !config.operator) {
    return { success: false, error: "Condition field and operator are required" };
  }

  // Get the value to check
  let actualValue: any;
  const data = run.collectedData ?? {};

  // Check if field refers to collected data or context entity
  if (config.field.startsWith("data.")) {
    const dataPath = config.field.substring(5);
    actualValue = getNestedValue(data, dataPath);
  } else if (config.field.startsWith("context.")) {
    // Get value from context entity
    const contextPath = config.field.substring(8);
    const contextEntity = await getContextEntity(ctx, run);
    if (contextEntity) {
      actualValue = getNestedValue(contextEntity, contextPath);
    }
  } else {
    // Default to collected data
    actualValue = getNestedValue(data, config.field);
  }

  // Evaluate condition
  let conditionMet = false;
  switch (config.operator) {
    case "equals":
      conditionMet = actualValue === config.value;
      break;
    case "notEquals":
      conditionMet = actualValue !== config.value;
      break;
    case "contains":
      conditionMet =
        typeof actualValue === "string" &&
        actualValue.includes(String(config.value));
      break;
    case "greaterThan":
      conditionMet = Number(actualValue) > Number(config.value);
      break;
    case "lessThan":
      conditionMet = Number(actualValue) < Number(config.value);
      break;
    case "exists":
      conditionMet = actualValue !== undefined && actualValue !== null;
      break;
    default:
      return { success: false, error: `Unknown operator: ${config.operator}` };
  }

  // Determine next step
  let nextStepId: string | undefined;
  if (conditionMet && config.trueStepId) {
    nextStepId = config.trueStepId;
  } else if (!conditionMet && config.falseStepId) {
    nextStepId = config.falseStepId;
  }

  // If no explicit branch step, continue to next sequential step
  if (!nextStepId) {
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex((s) => s.id === step.id);
    if (currentIndex < sortedSteps.length - 1) {
      nextStepId = sortedSteps[currentIndex + 1].id;
    }
  }

  return {
    success: true,
    output: {
      field: config.field,
      operator: config.operator,
      expectedValue: config.value,
      actualValue,
      conditionMet,
    },
    nextStepId,
  };
}

/**
 * Execute ai_action step (placeholder for AI integration)
 * Config: { action: string, prompt?: string, model?: string }
 */
async function executeAiAction(
  ctx: any,
  run: Doc<"workflowRuns">,
  step: WorkflowStep
): Promise<StepResult> {
  const config = step.config as {
    action?: string;
    prompt?: string;
    model?: string;
  };

  // This is a placeholder for AI integration
  // In a real implementation, this would call an AI service

  const now = Date.now();

  await ctx.db.insert("activityLog", {
    action: "ai_action_triggered",
    entityType: run.contextType,
    entityId: run.contextId,
    metadata: {
      runId: run._id,
      stepId: step.id,
      aiAction: config.action,
      prompt: config.prompt,
      model: config.model,
      status: "placeholder",
    },
    timestamp: now,
    system: true,
  });

  return {
    success: true,
    output: {
      action: config.action,
      status: "ai_integration_placeholder",
      message: "AI action would be executed here. Integrate with your AI service.",
    },
  };
}

// ============================================================================
// TRIGGER HANDLERS - Start workflows based on events
// ============================================================================

/**
 * Handle deal stage change trigger
 */
export const handleDealStageChange = mutation({
  args: {
    dealId: v.id("deals"),
    previousStageId: v.string(),
    newStageId: v.string(),
    pipelineId: v.id("pipelines"),
  },
  handler: async (ctx, args) => {
    // Find active workflows with deal_stage_change trigger
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("triggerType", "deal_stage_change"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const startedRuns: Id<"workflowRuns">[] = [];

    for (const workflow of workflows) {
      const triggerConfig = workflow.triggerConfig as {
        pipelineId?: string;
        fromStageId?: string;
        toStageId?: string;
      } | undefined;

      // Check if trigger config matches
      let shouldTrigger = true;

      if (triggerConfig) {
        if (triggerConfig.pipelineId && triggerConfig.pipelineId !== args.pipelineId) {
          shouldTrigger = false;
        }
        if (triggerConfig.fromStageId && triggerConfig.fromStageId !== args.previousStageId) {
          shouldTrigger = false;
        }
        if (triggerConfig.toStageId && triggerConfig.toStageId !== args.newStageId) {
          shouldTrigger = false;
        }
      }

      if (shouldTrigger) {
        // Check if workflow is already running for this deal
        const existingRuns = await ctx.db
          .query("workflowRuns")
          .withIndex("by_context", (q) =>
            q.eq("contextType", "deal").eq("contextId", args.dealId)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        if (!existingRuns.some((r) => r.workflowId === workflow._id)) {
          const now = Date.now();
          const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

          if (sortedSteps.length > 0) {
            const runId = await ctx.db.insert("workflowRuns", {
              workflowId: workflow._id,
              contextType: "deal",
              contextId: args.dealId,
              currentStepId: sortedSteps[0].id,
              status: "active",
              collectedData: {
                trigger: "deal_stage_change",
                previousStageId: args.previousStageId,
                newStageId: args.newStageId,
                pipelineId: args.pipelineId,
              },
              startedAt: now,
            });

            startedRuns.push(runId);

            await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
              runId,
            });
          }
        }
      }
    }

    return { startedWorkflows: startedRuns.length, runIds: startedRuns };
  },
});

/**
 * Handle new contact trigger
 */
export const handleNewContact = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return { startedWorkflows: 0, runIds: [] };

    // Find active workflows with new_contact trigger
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("triggerType", "new_contact"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const startedRuns: Id<"workflowRuns">[] = [];

    for (const workflow of workflows) {
      const triggerConfig = workflow.triggerConfig as {
        source?: string;
        tags?: string[];
      } | undefined;

      let shouldTrigger = true;

      if (triggerConfig) {
        // Check source filter
        if (triggerConfig.source && contact.source !== triggerConfig.source) {
          shouldTrigger = false;
        }
        // Check tags filter
        if (triggerConfig.tags && triggerConfig.tags.length > 0) {
          const hasMatchingTag = triggerConfig.tags.some((tag) =>
            contact.tags.includes(tag)
          );
          if (!hasMatchingTag) {
            shouldTrigger = false;
          }
        }
      }

      if (shouldTrigger) {
        const now = Date.now();
        const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

        if (sortedSteps.length > 0) {
          const runId = await ctx.db.insert("workflowRuns", {
            workflowId: workflow._id,
            contextType: "contact",
            contextId: args.contactId,
            currentStepId: sortedSteps[0].id,
            status: "active",
            collectedData: {
              trigger: "new_contact",
              contactEmail: contact.email,
              contactName: `${contact.firstName ?? ""} ${contact.lastName}`.trim(),
              source: contact.source,
            },
            startedAt: now,
          });

          startedRuns.push(runId);

          await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
            runId,
          });
        }
      }
    }

    return { startedWorkflows: startedRuns.length, runIds: startedRuns };
  },
});

/**
 * Handle inbound message trigger
 */
export const handleInboundMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageContent: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return { startedWorkflows: 0, runIds: [] };

    // Find active workflows with inbound_message trigger
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_trigger", (q) => q.eq("triggerType", "inbound_message"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const startedRuns: Id<"workflowRuns">[] = [];

    for (const workflow of workflows) {
      const triggerConfig = workflow.triggerConfig as {
        keywords?: string[];
        isFirstMessage?: boolean;
        aiEnabled?: boolean;
      } | undefined;

      let shouldTrigger = true;

      if (triggerConfig) {
        // Check keywords filter
        if (triggerConfig.keywords && triggerConfig.keywords.length > 0) {
          const contentLower = args.messageContent.toLowerCase();
          const hasMatchingKeyword = triggerConfig.keywords.some((kw) =>
            contentLower.includes(kw.toLowerCase())
          );
          if (!hasMatchingKeyword) {
            shouldTrigger = false;
          }
        }

        // Check if first message filter
        if (triggerConfig.isFirstMessage && conversation.messageCount > 1) {
          shouldTrigger = false;
        }

        // Check AI enabled filter
        if (triggerConfig.aiEnabled !== undefined) {
          if (triggerConfig.aiEnabled !== conversation.aiEnabled) {
            shouldTrigger = false;
          }
        }
      }

      // Check if workflow is already running for this conversation
      const existingRuns = await ctx.db
        .query("workflowRuns")
        .withIndex("by_context", (q) =>
          q.eq("contextType", "conversation").eq("contextId", args.conversationId)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (existingRuns.some((r) => r.workflowId === workflow._id)) {
        shouldTrigger = false;
      }

      if (shouldTrigger) {
        const now = Date.now();
        const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

        if (sortedSteps.length > 0) {
          const runId = await ctx.db.insert("workflowRuns", {
            workflowId: workflow._id,
            contextType: "conversation",
            contextId: args.conversationId,
            currentStepId: sortedSteps[0].id,
            status: "active",
            collectedData: {
              trigger: "inbound_message",
              messageContent: args.messageContent,
              messageId: args.messageId,
              phoneNumber: conversation.phoneNumber,
              contactId: conversation.contactId,
            },
            startedAt: now,
          });

          startedRuns.push(runId);

          // Update conversation status
          await ctx.db.patch(args.conversationId, {
            status: "workflow_active",
            activeWorkflowId: workflow._id,
          });

          await ctx.scheduler.runAfter(0, internal.workflowEngine.executeStepInternal, {
            runId,
          });
        }
      }
    }

    return { startedWorkflows: startedRuns.length, runIds: startedRuns };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Replace template variables in content
 * Supports: {{variable}}, {{data.path}}, {{context.field}}
 */
function replaceTemplateVariables(
  content: string,
  data: any,
  run: Doc<"workflowRuns">
): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    if (trimmedPath.startsWith("data.")) {
      const dataPath = trimmedPath.substring(5);
      return getNestedValue(data, dataPath) ?? match;
    }

    if (trimmedPath.startsWith("context.")) {
      // Context values would need async resolution
      // For now, return placeholder
      return match;
    }

    // Default to data lookup
    return getNestedValue(data, trimmedPath) ?? match;
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Get the context entity (contact, deal, etc.)
 */
async function getContextEntity(ctx: any, run: Doc<"workflowRuns">): Promise<any> {
  switch (run.contextType) {
    case "contact":
      return await ctx.db.get(run.contextId as Id<"contacts">);
    case "deal":
      return await ctx.db.get(run.contextId as Id<"deals">);
    case "company":
      return await ctx.db.get(run.contextId as Id<"companies">);
    case "conversation":
      return await ctx.db.get(run.contextId as Id<"conversations">);
    default:
      return null;
  }
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Create a new workflow
 */
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("manual"),
      v.literal("deal_stage_change"),
      v.literal("new_contact"),
      v.literal("inbound_message"),
      v.literal("scheduled")
    ),
    triggerConfig: v.optional(v.any()),
    steps: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("send_message"),
          v.literal("send_email"),
          v.literal("create_task"),
          v.literal("wait"),
          v.literal("condition"),
          v.literal("ai_action")
        ),
        config: v.any(),
        order: v.number(),
      })
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig,
      steps: args.steps,
      isActive: args.isActive ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return workflowId;
  },
});

/**
 * Update an existing workflow
 */
export const updateWorkflow = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerType: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("deal_stage_change"),
        v.literal("new_contact"),
        v.literal("inbound_message"),
        v.literal("scheduled")
      )
    ),
    triggerConfig: v.optional(v.any()),
    steps: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.union(
            v.literal("send_message"),
            v.literal("send_email"),
            v.literal("create_task"),
            v.literal("wait"),
            v.literal("condition"),
            v.literal("ai_action")
          ),
          config: v.any(),
          order: v.number(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const workflow = await ctx.db.get(id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updateData: Partial<Doc<"workflows">> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.triggerType !== undefined) updateData.triggerType = updates.triggerType;
    if (updates.triggerConfig !== undefined) updateData.triggerConfig = updates.triggerConfig;
    if (updates.steps !== undefined) updateData.steps = updates.steps;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a workflow
 */
export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Check for active runs
    const activeRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeRuns.length > 0) {
      throw new Error(
        `Cannot delete workflow with ${activeRuns.length} active run(s). Cancel them first.`
      );
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * List all workflows
 */
export const listWorkflows = query({
  args: {
    triggerType: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("deal_stage_change"),
        v.literal("new_contact"),
        v.literal("inbound_message"),
        v.literal("scheduled")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let workflows;

    if (args.triggerType) {
      workflows = await ctx.db
        .query("workflows")
        .withIndex("by_trigger", (q) => q.eq("triggerType", args.triggerType!))
        .collect();
    } else {
      workflows = await ctx.db.query("workflows").collect();
    }

    if (args.isActive !== undefined) {
      workflows = workflows.filter((w) => w.isActive === args.isActive);
    }

    // Get run counts for each workflow
    const workflowsWithStats = await Promise.all(
      workflows.map(async (workflow) => {
        const runs = await ctx.db
          .query("workflowRuns")
          .withIndex("by_workflow", (q) => q.eq("workflowId", workflow._id))
          .collect();

        return {
          ...workflow,
          totalRuns: runs.length,
          activeRuns: runs.filter((r) => r.status === "active").length,
          completedRuns: runs.filter((r) => r.status === "completed").length,
          failedRuns: runs.filter((r) => r.status === "failed").length,
        };
      })
    );

    return workflowsWithStats;
  },
});

/**
 * Get a single workflow by ID
 */
export const getWorkflow = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return null;

    // Get recent runs
    const recentRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.id))
      .order("desc")
      .take(10);

    return {
      ...workflow,
      recentRuns,
    };
  },
});
