import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Types
// =============================================================================

export type SequenceStepType = "email" | "sms" | "call" | "wait" | "task";
export type EnrollmentStatus = "active" | "paused" | "completed" | "replied" | "bounced" | "unsubscribed";
export type StepExecutionStatus = "sent" | "failed" | "opened" | "clicked" | "replied";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List all sequences with optional filtering
 */
export const listSequences = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let sequences;

    if (args.activeOnly) {
      sequences = await ctx.db
        .query("sequences")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .collect();
    } else {
      sequences = await ctx.db
        .query("sequences")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Get enrollment counts for each sequence
    const sequencesWithStats = await Promise.all(
      sequences.map(async (sequence) => {
        const enrollments = await ctx.db
          .query("sequenceEnrollments")
          .withIndex("by_sequence", (q) => q.eq("sequenceId", sequence._id))
          .collect();

        const activeEnrollments = enrollments.filter((e) => e.status === "active");
        const completedEnrollments = enrollments.filter((e) => e.status === "completed");

        return {
          ...sequence,
          activeEnrollments: activeEnrollments.length,
          totalEnrollments: enrollments.length,
          completedEnrollments: completedEnrollments.length,
        };
      })
    );

    return sequencesWithStats;
  },
});

/**
 * Get a single sequence by ID with full details
 */
export const getSequence = query({
  args: {
    id: v.id("sequences"),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.id);
    if (!sequence) return null;

    // Get enrollments
    const enrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.id))
      .collect();

    // Get contacts for enrollments
    const enrollmentsWithContacts = await Promise.all(
      enrollments.map(async (enrollment) => {
        const contact = await ctx.db.get(enrollment.contactId);
        return {
          ...enrollment,
          contact,
        };
      })
    );

    // Calculate stats
    const activeCount = enrollments.filter((e) => e.status === "active").length;
    const completedCount = enrollments.filter((e) => e.status === "completed").length;
    const repliedCount = enrollments.filter((e) => e.status === "replied").length;

    return {
      ...sequence,
      enrollments: enrollmentsWithContacts,
      stats: {
        activeCount,
        completedCount,
        repliedCount,
        totalEnrollments: enrollments.length,
      },
    };
  },
});

/**
 * Get sequence stats with per-step analytics
 */
export const getSequenceStats = query({
  args: {
    sequenceId: v.id("sequences"),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) return null;

    // Get all enrollments
    const enrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();

    // Get all step executions for these enrollments
    const allExecutions = await Promise.all(
      enrollments.map(async (enrollment) => {
        return await ctx.db
          .query("sequenceStepExecutions")
          .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
          .collect();
      })
    );

    const flatExecutions = allExecutions.flat();

    // Calculate per-step stats
    const stepStats = sequence.steps.map((step, index) => {
      const stepExecutions = flatExecutions.filter((e) => e.stepIndex === index);
      const sentCount = stepExecutions.filter((e) => e.status === "sent").length;
      const openedCount = stepExecutions.filter((e) => e.status === "opened").length;
      const clickedCount = stepExecutions.filter((e) => e.status === "clicked").length;
      const repliedCount = stepExecutions.filter((e) => e.status === "replied").length;
      const failedCount = stepExecutions.filter((e) => e.status === "failed").length;

      return {
        stepId: step.id,
        stepIndex: index,
        stepType: step.type,
        totalExecutions: stepExecutions.length,
        sentCount,
        openedCount,
        clickedCount,
        repliedCount,
        failedCount,
        openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
        clickRate: openedCount > 0 ? (clickedCount / openedCount) * 100 : 0,
        replyRate: sentCount > 0 ? (repliedCount / sentCount) * 100 : 0,
      };
    });

    // Overall stats
    const totalSent = flatExecutions.filter((e) => e.status === "sent").length;
    const totalOpened = flatExecutions.filter((e) => e.status === "opened").length;
    const totalReplied = flatExecutions.filter((e) => e.status === "replied").length;

    return {
      sequenceId: args.sequenceId,
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === "active").length,
      completedEnrollments: enrollments.filter((e) => e.status === "completed").length,
      repliedEnrollments: enrollments.filter((e) => e.status === "replied").length,
      overallOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      overallReplyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
      stepStats,
    };
  },
});

/**
 * Get enrollments for a sequence
 */
export const getEnrollments = query({
  args: {
    sequenceId: v.id("sequences"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed"),
        v.literal("replied"),
        v.literal("bounced"),
        v.literal("unsubscribed")
      )
    ),
  },
  handler: async (ctx, args) => {
    let enrollments;

    if (args.status) {
      enrollments = await ctx.db
        .query("sequenceEnrollments")
        .withIndex("by_sequence_status", (q) =>
          q.eq("sequenceId", args.sequenceId).eq("status", args.status!)
        )
        .collect();
    } else {
      enrollments = await ctx.db
        .query("sequenceEnrollments")
        .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
        .collect();
    }

    // Enrich with contact data
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const contact = await ctx.db.get(enrollment.contactId);
        const sequence = await ctx.db.get(enrollment.sequenceId);

        // Get step executions
        const executions = await ctx.db
          .query("sequenceStepExecutions")
          .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
          .collect();

        return {
          ...enrollment,
          contact,
          sequence,
          executions,
          currentStep: sequence?.steps[enrollment.currentStepIndex],
        };
      })
    );

    return enrichedEnrollments;
  },
});

/**
 * Get contact's active enrollments
 */
export const getContactEnrollments = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const sequence = await ctx.db.get(enrollment.sequenceId);
        return {
          ...enrollment,
          sequence,
        };
      })
    );

    return enrichedEnrollments;
  },
});

/**
 * Get due step executions (for cron job)
 */
export const getDueSteps = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const dueEnrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.neq(q.field("nextStepAt"), undefined),
          q.lte(q.field("nextStepAt"), now)
        )
      )
      .collect();

    return dueEnrollments;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new sequence
 */
export const createSequence = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    steps: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("email"),
          v.literal("sms"),
          v.literal("call"),
          v.literal("wait"),
          v.literal("task")
        ),
        delayDays: v.number(),
        delayHours: v.number(),
        templateId: v.optional(v.id("emailTemplates")),
        subject: v.optional(v.string()),
        content: v.optional(v.string()),
        taskDescription: v.optional(v.string()),
      })
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sequenceId = await ctx.db.insert("sequences", {
      name: args.name,
      description: args.description,
      steps: args.steps,
      isActive: args.isActive ?? false,
      enrollmentCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return sequenceId;
  },
});

/**
 * Update a sequence
 */
export const updateSequence = mutation({
  args: {
    id: v.id("sequences"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    steps: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.union(
            v.literal("email"),
            v.literal("sms"),
            v.literal("call"),
            v.literal("wait"),
            v.literal("task")
          ),
          delayDays: v.number(),
          delayHours: v.number(),
          templateId: v.optional(v.id("emailTemplates")),
          subject: v.optional(v.string()),
          content: v.optional(v.string()),
          taskDescription: v.optional(v.string()),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Sequence not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete a sequence
 */
export const deleteSequence = mutation({
  args: {
    id: v.id("sequences"),
  },
  handler: async (ctx, args) => {
    // Check for active enrollments
    const activeEnrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_sequence_status", (q) =>
        q.eq("sequenceId", args.id).eq("status", "active")
      )
      .first();

    if (activeEnrollments) {
      throw new Error("Cannot delete sequence with active enrollments");
    }

    // Delete all enrollments and their executions
    const enrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.id))
      .collect();

    for (const enrollment of enrollments) {
      const executions = await ctx.db
        .query("sequenceStepExecutions")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
        .collect();

      for (const execution of executions) {
        await ctx.db.delete(execution._id);
      }

      await ctx.db.delete(enrollment._id);
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Duplicate a sequence
 */
export const duplicateSequence = mutation({
  args: {
    id: v.id("sequences"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new Error("Sequence not found");
    }

    const now = Date.now();

    const newSequenceId = await ctx.db.insert("sequences", {
      name: `${original.name} (Copy)`,
      description: original.description,
      steps: original.steps.map((step) => ({
        ...step,
        id: crypto.randomUUID(),
      })),
      isActive: false,
      enrollmentCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return newSequenceId;
  },
});

/**
 * Enroll a contact in a sequence
 */
export const enrollContact = mutation({
  args: {
    sequenceId: v.id("sequences"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) {
      throw new Error("Sequence not found");
    }

    if (!sequence.isActive) {
      throw new Error("Cannot enroll in inactive sequence");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) =>
        q.and(
          q.eq(q.field("sequenceId"), args.sequenceId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (existingEnrollment) {
      throw new Error("Contact is already enrolled in this sequence");
    }

    const now = Date.now();

    // Calculate first step execution time
    const firstStep = sequence.steps[0];
    const delayMs = firstStep
      ? (firstStep.delayDays * 24 * 60 * 60 * 1000) + (firstStep.delayHours * 60 * 60 * 1000)
      : 0;
    const nextStepAt = now + delayMs;

    const enrollmentId = await ctx.db.insert("sequenceEnrollments", {
      sequenceId: args.sequenceId,
      contactId: args.contactId,
      currentStepIndex: 0,
      status: "active",
      enrolledAt: now,
      nextStepAt,
    });

    // Update sequence enrollment count
    await ctx.db.patch(args.sequenceId, {
      enrollmentCount: sequence.enrollmentCount + 1,
      updatedAt: now,
    });

    return enrollmentId;
  },
});

/**
 * Bulk enroll multiple contacts
 */
export const bulkEnroll = mutation({
  args: {
    sequenceId: v.id("sequences"),
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) {
      throw new Error("Sequence not found");
    }

    if (!sequence.isActive) {
      throw new Error("Cannot enroll in inactive sequence");
    }

    const now = Date.now();
    const results: { contactId: Id<"contacts">; success: boolean; error?: string }[] = [];

    for (const contactId of args.contactIds) {
      try {
        const contact = await ctx.db.get(contactId);
        if (!contact) {
          results.push({ contactId, success: false, error: "Contact not found" });
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await ctx.db
          .query("sequenceEnrollments")
          .withIndex("by_contact", (q) => q.eq("contactId", contactId))
          .filter((q) =>
            q.and(
              q.eq(q.field("sequenceId"), args.sequenceId),
              q.eq(q.field("status"), "active")
            )
          )
          .first();

        if (existingEnrollment) {
          results.push({ contactId, success: false, error: "Already enrolled" });
          continue;
        }

        const firstStep = sequence.steps[0];
        const delayMs = firstStep
          ? (firstStep.delayDays * 24 * 60 * 60 * 1000) + (firstStep.delayHours * 60 * 60 * 1000)
          : 0;
        const nextStepAt = now + delayMs;

        await ctx.db.insert("sequenceEnrollments", {
          sequenceId: args.sequenceId,
          contactId,
          currentStepIndex: 0,
          status: "active",
          enrolledAt: now,
          nextStepAt,
        });

        results.push({ contactId, success: true });
      } catch (error) {
        results.push({ contactId, success: false, error: String(error) });
      }
    }

    // Update enrollment count
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await ctx.db.patch(args.sequenceId, {
        enrollmentCount: sequence.enrollmentCount + successCount,
        updatedAt: now,
      });
    }

    return results;
  },
});

/**
 * Pause an enrollment
 */
export const pauseEnrollment = mutation({
  args: {
    enrollmentId: v.id("sequenceEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.status !== "active") {
      throw new Error("Can only pause active enrollments");
    }

    await ctx.db.patch(args.enrollmentId, {
      status: "paused",
      pausedAt: Date.now(),
    });
  },
});

/**
 * Resume a paused enrollment
 */
export const resumeEnrollment = mutation({
  args: {
    enrollmentId: v.id("sequenceEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.status !== "paused") {
      throw new Error("Can only resume paused enrollments");
    }

    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (!sequence) {
      throw new Error("Sequence not found");
    }

    const now = Date.now();
    const currentStep = sequence.steps[enrollment.currentStepIndex];
    const delayMs = currentStep
      ? (currentStep.delayDays * 24 * 60 * 60 * 1000) + (currentStep.delayHours * 60 * 60 * 1000)
      : 0;
    const nextStepAt = now + delayMs;

    await ctx.db.patch(args.enrollmentId, {
      status: "active",
      pausedAt: undefined,
      nextStepAt,
    });
  },
});

/**
 * Remove contact from sequence
 */
export const removeFromSequence = mutation({
  args: {
    enrollmentId: v.id("sequenceEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Delete step executions
    const executions = await ctx.db
      .query("sequenceStepExecutions")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .collect();

    for (const execution of executions) {
      await ctx.db.delete(execution._id);
    }

    // Update sequence count
    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (sequence && sequence.enrollmentCount > 0) {
      await ctx.db.patch(enrollment.sequenceId, {
        enrollmentCount: sequence.enrollmentCount - 1,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.enrollmentId);
  },
});

/**
 * Mark enrollment as replied (typically called when contact responds)
 */
export const markAsReplied = mutation({
  args: {
    enrollmentId: v.id("sequenceEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    await ctx.db.patch(args.enrollmentId, {
      status: "replied",
      completedAt: Date.now(),
    });
  },
});

/**
 * Execute the next step in a sequence (internal mutation for cron)
 */
export const executeNextStep = internalMutation({
  args: {
    enrollmentId: v.id("sequenceEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.status !== "active") {
      return { success: false, reason: "Enrollment not active" };
    }

    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (!sequence) {
      return { success: false, reason: "Sequence not found" };
    }

    const currentStep = sequence.steps[enrollment.currentStepIndex];
    if (!currentStep) {
      // No more steps, mark as completed
      await ctx.db.patch(args.enrollmentId, {
        status: "completed",
        completedAt: Date.now(),
        nextStepAt: undefined,
      });
      return { success: true, completed: true };
    }

    const contact = await ctx.db.get(enrollment.contactId);
    if (!contact) {
      return { success: false, reason: "Contact not found" };
    }

    const now = Date.now();
    let executionStatus: StepExecutionStatus = "sent";
    let errorMessage: string | undefined;

    try {
      // Execute step based on type
      switch (currentStep.type) {
        case "email":
          // In a real implementation, this would send an email
          // For now, we just record the execution
          console.log(`Sending email to ${contact.email}: ${currentStep.subject}`);
          break;

        case "sms":
          // In a real implementation, this would send an SMS via Sendblue
          console.log(`Sending SMS to ${contact.phone}: ${currentStep.content}`);
          break;

        case "call":
          // Create a task for the call
          await ctx.db.insert("activities", {
            type: "call",
            subject: `Sequence call: ${currentStep.content || "Follow up call"}`,
            description: currentStep.content,
            relatedToType: "contact",
            relatedToId: enrollment.contactId,
            createdAt: now,
            updatedAt: now,
          });
          break;

        case "task":
          // Create a task
          await ctx.db.insert("activities", {
            type: "task",
            subject: currentStep.taskDescription || "Sequence task",
            relatedToType: "contact",
            relatedToId: enrollment.contactId,
            dueDate: now + (24 * 60 * 60 * 1000), // Due tomorrow
            completed: false,
            createdAt: now,
            updatedAt: now,
          });
          break;

        case "wait":
          // Wait steps don't need execution, just advance
          break;
      }
    } catch (error) {
      executionStatus = "failed";
      errorMessage = String(error);
    }

    // Record the execution
    await ctx.db.insert("sequenceStepExecutions", {
      enrollmentId: args.enrollmentId,
      stepIndex: enrollment.currentStepIndex,
      executedAt: now,
      status: executionStatus,
      errorMessage,
    });

    // Advance to next step
    const nextStepIndex = enrollment.currentStepIndex + 1;
    const nextStep = sequence.steps[nextStepIndex];

    if (nextStep) {
      const delayMs = (nextStep.delayDays * 24 * 60 * 60 * 1000) + (nextStep.delayHours * 60 * 60 * 1000);
      await ctx.db.patch(args.enrollmentId, {
        currentStepIndex: nextStepIndex,
        nextStepAt: now + delayMs,
      });
    } else {
      // No more steps, mark as completed
      await ctx.db.patch(args.enrollmentId, {
        currentStepIndex: nextStepIndex,
        status: "completed",
        completedAt: now,
        nextStepAt: undefined,
      });
    }

    return { success: true, stepExecuted: currentStep.type };
  },
});

/**
 * Process all due steps (called by cron)
 */
export const processDueSteps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const dueEnrollments = await ctx.db
      .query("sequenceEnrollments")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.neq(q.field("nextStepAt"), undefined),
          q.lte(q.field("nextStepAt"), now)
        )
      )
      .take(100); // Process up to 100 at a time

    const results = [];
    for (const enrollment of dueEnrollments) {
      // Call executeNextStep for each due enrollment
      // Note: In production, you'd want to use a scheduler for this
      const sequence = await ctx.db.get(enrollment.sequenceId);
      if (!sequence) continue;

      const currentStep = sequence.steps[enrollment.currentStepIndex];
      if (!currentStep) {
        await ctx.db.patch(enrollment._id, {
          status: "completed",
          completedAt: now,
          nextStepAt: undefined,
        });
        continue;
      }

      // Execute the step
      let executionStatus: StepExecutionStatus = "sent";

      await ctx.db.insert("sequenceStepExecutions", {
        enrollmentId: enrollment._id,
        stepIndex: enrollment.currentStepIndex,
        executedAt: now,
        status: executionStatus,
      });

      // Advance to next step
      const nextStepIndex = enrollment.currentStepIndex + 1;
      const nextStep = sequence.steps[nextStepIndex];

      if (nextStep) {
        const delayMs = (nextStep.delayDays * 24 * 60 * 60 * 1000) + (nextStep.delayHours * 60 * 60 * 1000);
        await ctx.db.patch(enrollment._id, {
          currentStepIndex: nextStepIndex,
          nextStepAt: now + delayMs,
        });
      } else {
        await ctx.db.patch(enrollment._id, {
          currentStepIndex: nextStepIndex,
          status: "completed",
          completedAt: now,
          nextStepAt: undefined,
        });
      }

      results.push({ enrollmentId: enrollment._id, success: true });
    }

    return { processed: results.length, results };
  },
});

/**
 * Update step execution status (e.g., when email is opened)
 */
export const updateStepExecutionStatus = mutation({
  args: {
    executionId: v.id("sequenceStepExecutions"),
    status: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("replied")
    ),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }

    await ctx.db.patch(args.executionId, {
      status: args.status,
    });

    // If replied, also update the enrollment status
    if (args.status === "replied") {
      await ctx.db.patch(execution.enrollmentId, {
        status: "replied",
        completedAt: Date.now(),
      });
    }
  },
});
