import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// WEBHOOK EVENT TYPES
// ============================================================================

export const WEBHOOK_EVENT_TYPES = {
  // Contact events
  "contact.created": "Contact Created",
  "contact.updated": "Contact Updated",
  "contact.deleted": "Contact Deleted",

  // Company events
  "company.created": "Company Created",
  "company.updated": "Company Updated",
  "company.deleted": "Company Deleted",

  // Deal events
  "deal.created": "Deal Created",
  "deal.updated": "Deal Updated",
  "deal.stage_changed": "Deal Stage Changed",
  "deal.won": "Deal Won",
  "deal.lost": "Deal Lost",

  // Activity events
  "activity.created": "Activity Created",
  "activity.completed": "Activity Completed",

  // Message events
  "message.received": "Message Received",
  "message.sent": "Message Sent",
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENT_TYPES;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random secret for HMAC signing
 */
function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "whsec_";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempts: number): number {
  // Exponential backoff: 1min, 5min, 30min, 2hr, 12hr
  const delays = [60000, 300000, 1800000, 7200000, 43200000];
  return delays[Math.min(attempts - 1, delays.length - 1)];
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all webhook subscriptions
 */
export const listSubscriptions = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let subscriptions;

    if (args.isActive !== undefined) {
      subscriptions = await ctx.db
        .query("webhookSubscriptions")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .order("desc")
        .collect();
    } else {
      subscriptions = await ctx.db
        .query("webhookSubscriptions")
        .withIndex("by_created")
        .order("desc")
        .collect();
    }

    // Fetch creator info for each subscription
    const subscriptionsWithCreator = await Promise.all(
      subscriptions.map(async (sub) => {
        let creator: Doc<"users"> | null = null;
        if (sub.createdBy) {
          creator = await ctx.db.get(sub.createdBy);
        }

        // Get recent delivery stats
        const recentDeliveries = await ctx.db
          .query("webhookDeliveries")
          .withIndex("by_subscription", (q) => q.eq("subscriptionId", sub._id))
          .order("desc")
          .take(10);

        const successCount = recentDeliveries.filter((d) => d.status === "success").length;
        const failedCount = recentDeliveries.filter((d) => d.status === "failed").length;

        return {
          ...sub,
          creator,
          recentStats: {
            total: recentDeliveries.length,
            success: successCount,
            failed: failedCount,
          },
        };
      })
    );

    return subscriptionsWithCreator;
  },
});

/**
 * Get a single webhook subscription by ID
 */
export const getSubscription = query({
  args: {
    id: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.id);
    if (!subscription) {
      return null;
    }

    let creator: Doc<"users"> | null = null;
    if (subscription.createdBy) {
      creator = await ctx.db.get(subscription.createdBy);
    }

    return {
      ...subscription,
      creator,
    };
  },
});

/**
 * Get webhook event types
 */
export const getEventTypes = query({
  args: {},
  handler: async () => {
    return WEBHOOK_EVENT_TYPES;
  },
});

/**
 * Get delivery history for a subscription
 */
export const getDeliveryHistory = query({
  args: {
    subscriptionId: v.id("webhookSubscriptions"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const cursor = args.cursor ?? Date.now();

    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .filter((q) => q.lt(q.field("createdAt"), cursor))
      .order("desc")
      .take(limit + 1);

    const hasMore = deliveries.length > limit;
    const items = deliveries.slice(0, limit);

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get pending deliveries that need retry
 */
export const getPendingDeliveries = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const now = Date.now();

    // Get deliveries that are pending and ready for retry
    const pendingDeliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) =>
        q.or(
          q.eq(q.field("nextRetryAt"), undefined),
          q.lte(q.field("nextRetryAt"), now)
        )
      )
      .take(limit);

    return pendingDeliveries;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new webhook subscription
 */
export const createSubscription = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error("Invalid webhook URL");
    }

    // Validate events
    const validEvents = Object.keys(WEBHOOK_EVENT_TYPES);
    for (const event of args.events) {
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }

    if (args.events.length === 0) {
      throw new Error("At least one event type is required");
    }

    const secret = generateSecret();

    const subscriptionId = await ctx.db.insert("webhookSubscriptions", {
      name: args.name,
      url: args.url,
      events: args.events,
      secret,
      isActive: args.isActive ?? true,
      createdBy: args.createdBy,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { subscriptionId, secret };
  },
});

/**
 * Update an existing webhook subscription
 */
export const updateSubscription = mutation({
  args: {
    id: v.id("webhookSubscriptions"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Webhook subscription not found");
    }

    // Validate URL format if provided
    if (updates.url) {
      try {
        new URL(updates.url);
      } catch {
        throw new Error("Invalid webhook URL");
      }
    }

    // Validate events if provided
    if (updates.events) {
      const validEvents = Object.keys(WEBHOOK_EVENT_TYPES);
      for (const event of updates.events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event type: ${event}`);
        }
      }

      if (updates.events.length === 0) {
        throw new Error("At least one event type is required");
      }
    }

    const updateData: Partial<Doc<"webhookSubscriptions">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.events !== undefined) updateData.events = updates.events;
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
      // Reset failure count when re-enabling
      if (updates.isActive && !existing.isActive) {
        updateData.failureCount = 0;
      }
    }

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a webhook subscription
 */
export const deleteSubscription = mutation({
  args: {
    id: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Webhook subscription not found");
    }

    // Delete all associated deliveries
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.id))
      .collect();

    for (const delivery of deliveries) {
      await ctx.db.delete(delivery._id);
    }

    // Delete the subscription
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Regenerate the secret for a webhook subscription
 */
export const regenerateSecret = mutation({
  args: {
    id: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Webhook subscription not found");
    }

    const newSecret = generateSecret();

    await ctx.db.patch(args.id, {
      secret: newSecret,
      updatedAt: Date.now(),
    });

    return { secret: newSecret };
  },
});

/**
 * Queue a webhook delivery
 */
export const triggerWebhook = internalMutation({
  args: {
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find all active subscriptions that listen to this event
    const activeSubscriptions = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const matchingSubscriptions = activeSubscriptions.filter((sub) =>
      sub.events.includes(args.event)
    );

    // Create delivery records for each matching subscription
    const deliveryIds: Id<"webhookDeliveries">[] = [];

    for (const subscription of matchingSubscriptions) {
      const deliveryId = await ctx.db.insert("webhookDeliveries", {
        subscriptionId: subscription._id,
        event: args.event,
        payload: args.payload,
        status: "pending",
        attempts: 0,
        createdAt: now,
      });

      deliveryIds.push(deliveryId);

      // Update subscription's lastTriggeredAt
      await ctx.db.patch(subscription._id, {
        lastTriggeredAt: now,
      });
    }

    // Schedule delivery attempts
    for (const deliveryId of deliveryIds) {
      await ctx.scheduler.runAfter(0, internal.webhooks.processDelivery, {
        deliveryId,
      });
    }

    return { deliveryCount: deliveryIds.length };
  },
});

/**
 * Process a single webhook delivery
 */
export const processDelivery = internalAction({
  args: {
    deliveryId: v.id("webhookDeliveries"),
  },
  handler: async (ctx, args) => {
    // Get the delivery record
    const delivery = await ctx.runQuery(internal.webhooks.getDeliveryInternal, {
      deliveryId: args.deliveryId,
    });

    if (!delivery) {
      console.error("Delivery not found:", args.deliveryId);
      return;
    }

    if (delivery.status !== "pending") {
      return; // Already processed
    }

    // Get the subscription
    const subscription = await ctx.runQuery(internal.webhooks.getSubscriptionInternal, {
      subscriptionId: delivery.subscriptionId,
    });

    if (!subscription || !subscription.isActive) {
      // Subscription deleted or disabled - mark as failed
      await ctx.runMutation(internal.webhooks.updateDeliveryStatus, {
        deliveryId: args.deliveryId,
        status: "failed",
        errorMessage: "Subscription not found or disabled",
      });
      return;
    }

    const now = Date.now();
    const attemptNumber = delivery.attempts + 1;

    // Build the webhook payload
    const webhookPayload = {
      id: delivery._id,
      event: delivery.event,
      timestamp: now,
      data: delivery.payload,
    };

    // Create HMAC signature
    const payloadString = JSON.stringify(webhookPayload);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(subscription.secret);
    const payloadData = encoder.encode(payloadString);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    try {
      // Make the HTTP request
      const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": delivery.event,
          "X-Webhook-Timestamp": now.toString(),
          "X-Webhook-Delivery-Id": delivery._id,
        },
        body: payloadString,
      });

      const responseBody = await response.text().catch(() => "");

      if (response.ok) {
        // Success
        await ctx.runMutation(internal.webhooks.updateDeliveryStatus, {
          deliveryId: args.deliveryId,
          status: "success",
          responseCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit response body size
          attempts: attemptNumber,
        });

        // Reset failure count on success
        await ctx.runMutation(internal.webhooks.resetFailureCount, {
          subscriptionId: subscription._id,
        });
      } else {
        // HTTP error - schedule retry
        await handleDeliveryFailure(
          ctx,
          args.deliveryId,
          subscription._id,
          attemptNumber,
          `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
          response.status,
          responseBody.substring(0, 1000)
        );
      }
    } catch (error) {
      // Network or other error - schedule retry
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await handleDeliveryFailure(
        ctx,
        args.deliveryId,
        subscription._id,
        attemptNumber,
        errorMessage,
        undefined,
        undefined
      );
    }
  },
});

/**
 * Handle delivery failure with retry logic
 */
async function handleDeliveryFailure(
  ctx: any,
  deliveryId: Id<"webhookDeliveries">,
  subscriptionId: Id<"webhookSubscriptions">,
  attemptNumber: number,
  errorMessage: string,
  responseCode?: number,
  responseBody?: string
) {
  const maxAttempts = 5;

  if (attemptNumber >= maxAttempts) {
    // Max retries reached - mark as failed
    await ctx.runMutation(internal.webhooks.updateDeliveryStatus, {
      deliveryId,
      status: "failed",
      errorMessage: `Max retries exceeded. Last error: ${errorMessage}`,
      responseCode,
      responseBody,
      attempts: attemptNumber,
    });

    // Increment failure count on subscription
    await ctx.runMutation(internal.webhooks.incrementFailureCount, {
      subscriptionId,
    });
  } else {
    // Schedule retry with exponential backoff
    const retryDelay = getRetryDelay(attemptNumber);
    const nextRetryAt = Date.now() + retryDelay;

    await ctx.runMutation(internal.webhooks.updateDeliveryForRetry, {
      deliveryId,
      attempts: attemptNumber,
      nextRetryAt,
      errorMessage,
      responseCode,
      responseBody,
    });

    // Schedule the retry
    await ctx.scheduler.runAt(nextRetryAt, internal.webhooks.processDelivery, {
      deliveryId,
    });
  }
}

/**
 * Send a test webhook
 */
export const testWebhook = mutation({
  args: {
    id: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.id);
    if (!subscription) {
      throw new Error("Webhook subscription not found");
    }

    const now = Date.now();

    // Create a test delivery
    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      subscriptionId: args.id,
      event: "test",
      payload: {
        type: "test",
        message: "This is a test webhook from your CRM",
        timestamp: now,
      },
      status: "pending",
      attempts: 0,
      createdAt: now,
    });

    // Schedule immediate delivery
    await ctx.scheduler.runAfter(0, internal.webhooks.processDelivery, {
      deliveryId,
    });

    return { deliveryId };
  },
});

/**
 * Retry all failed deliveries for a subscription
 */
export const retryFailedDeliveries = mutation({
  args: {
    subscriptionId: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get failed deliveries for this subscription
    const failedDeliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    let retriedCount = 0;

    for (const delivery of failedDeliveries) {
      // Reset delivery for retry
      await ctx.db.patch(delivery._id, {
        status: "pending",
        attempts: 0,
        nextRetryAt: undefined,
        errorMessage: undefined,
        responseCode: undefined,
        responseBody: undefined,
      });

      // Schedule delivery
      await ctx.scheduler.runAfter(0, internal.webhooks.processDelivery, {
        deliveryId: delivery._id,
      });

      retriedCount++;
    }

    return { retriedCount };
  },
});

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

/**
 * Get delivery for internal use
 */
export const getDeliveryInternal = internalQuery({
  args: {
    deliveryId: v.id("webhookDeliveries"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deliveryId);
  },
});

/**
 * Get subscription for internal use
 */
export const getSubscriptionInternal = internalQuery({
  args: {
    subscriptionId: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subscriptionId);
  },
});

/**
 * Update delivery status
 */
export const updateDeliveryStatus = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    responseCode: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    attempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { deliveryId, ...updates } = args;

    const updateData: Partial<Doc<"webhookDeliveries">> = {
      status: updates.status,
    };

    if (updates.errorMessage !== undefined) updateData.errorMessage = updates.errorMessage;
    if (updates.responseCode !== undefined) updateData.responseCode = updates.responseCode;
    if (updates.responseBody !== undefined) updateData.responseBody = updates.responseBody;
    if (updates.attempts !== undefined) updateData.attempts = updates.attempts;

    if (updates.status === "success") {
      updateData.deliveredAt = now;
      updateData.nextRetryAt = undefined;
    }

    await ctx.db.patch(deliveryId, updateData);
  },
});

/**
 * Update delivery for retry
 */
export const updateDeliveryForRetry = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    attempts: v.number(),
    nextRetryAt: v.number(),
    errorMessage: v.optional(v.string()),
    responseCode: v.optional(v.number()),
    responseBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deliveryId, ...updates } = args;

    await ctx.db.patch(deliveryId, {
      attempts: updates.attempts,
      nextRetryAt: updates.nextRetryAt,
      errorMessage: updates.errorMessage,
      responseCode: updates.responseCode,
      responseBody: updates.responseBody,
    });
  },
});

/**
 * Reset failure count on subscription
 */
export const resetFailureCount = internalMutation({
  args: {
    subscriptionId: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      failureCount: 0,
    });
  },
});

/**
 * Increment failure count on subscription
 */
export const incrementFailureCount = internalMutation({
  args: {
    subscriptionId: v.id("webhookSubscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (subscription) {
      const newCount = subscription.failureCount + 1;

      // Auto-disable after 10 consecutive failures
      const updates: Partial<Doc<"webhookSubscriptions">> = {
        failureCount: newCount,
      };

      if (newCount >= 10) {
        updates.isActive = false;
      }

      await ctx.db.patch(args.subscriptionId, updates);
    }
  },
});
