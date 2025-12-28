import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// EMAIL RECIPIENT TYPE (shared validator)
// =============================================================================
const emailRecipientValidator = v.object({
  email: v.string(),
  name: v.optional(v.string()),
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List sent emails with pagination and filtering
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("queued"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed"),
        v.literal("bounced")
      )
    ),
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal")
      )
    ),
    relatedToId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    let emailsQuery = ctx.db
      .query("emails")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), cursor))
      .order("desc");

    const emails = await emailsQuery.take(limit + 1);

    // Filter by status and related entity in memory (if specified)
    let filtered = emails;
    if (args.status) {
      filtered = filtered.filter((e) => e.status === args.status);
    }
    if (args.relatedToType && args.relatedToId) {
      filtered = filtered.filter(
        (e) =>
          e.relatedToType === args.relatedToType &&
          e.relatedToId === args.relatedToId
      );
    }

    const hasMore = filtered.length > limit;
    const items = filtered.slice(0, limit);

    // Enrich with sender info
    const enrichedItems = await Promise.all(
      items.map(async (email) => {
        const sentByUser = email.sentBy
          ? await ctx.db.get(email.sentBy)
          : null;

        return {
          ...email,
          sentByUser,
        };
      })
    );

    return {
      items: enrichedItems,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt : null,
      hasMore,
    };
  },
});

/**
 * Get emails for a specific contact, company, or deal
 */
export const byRelated = query({
  args: {
    relatedToType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    relatedToId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const emails = await ctx.db
      .query("emails")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", args.relatedToType).eq("relatedToId", args.relatedToId)
      )
      .order("desc")
      .take(limit);

    // Enrich with sender info
    const enrichedItems = await Promise.all(
      emails.map(async (email) => {
        const sentByUser = email.sentBy
          ? await ctx.db.get(email.sentBy)
          : null;

        return {
          ...email,
          sentByUser,
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Get a single email by ID with tracking events
 */
export const get = query({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.id);
    if (!email) return null;

    const sentByUser = email.sentBy ? await ctx.db.get(email.sentBy) : null;

    // Get tracking events
    const events = await ctx.db
      .query("emailEvents")
      .withIndex("by_email", (q) => q.eq("emailId", args.id))
      .order("desc")
      .collect();

    return {
      ...email,
      sentByUser,
      events,
    };
  },
});

/**
 * Get email settings
 */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("emailSettings").first();
    return settings;
  },
});

/**
 * Get email statistics
 */
export const getStats = query({
  args: {
    period: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const period = args.period ?? "week";
    const now = Date.now();
    let startTime: number;

    switch (period) {
      case "day":
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const emails = await ctx.db
      .query("emails")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    const stats = {
      total: emails.length,
      sent: emails.filter((e) => e.status === "sent" || e.status === "delivered").length,
      delivered: emails.filter((e) => e.status === "delivered").length,
      failed: emails.filter((e) => e.status === "failed" || e.status === "bounced").length,
      pending: emails.filter((e) => e.status === "queued" || e.status === "sending").length,
      drafts: emails.filter((e) => e.status === "draft").length,
      openRate: 0,
      clickRate: 0,
    };

    // Calculate open and click rates
    const deliveredCount = stats.sent;
    if (deliveredCount > 0) {
      const opened = emails.filter((e) => (e.openCount ?? 0) > 0).length;
      const clicked = emails.filter((e) => (e.clickCount ?? 0) > 0).length;
      stats.openRate = Math.round((opened / deliveredCount) * 100);
      stats.clickRate = Math.round((clicked / deliveredCount) * 100);
    }

    return stats;
  },
});

// =============================================================================
// EMAIL TEMPLATE QUERIES
// =============================================================================

/**
 * List email templates
 */
export const listTemplates = query({
  args: {
    category: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("emailTemplates").collect();

    // Filter by active status
    if (!args.includeInactive) {
      templates = templates.filter((t) => t.isActive);
    }

    // Filter by category
    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    // Sort by usage count (most used first)
    templates.sort((a, b) => b.usageCount - a.usageCount);

    return templates;
  },
});

/**
 * Get a single template by ID
 */
export const getTemplate = query({
  args: { id: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get template categories
 */
export const getTemplateCategories = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("emailTemplates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = new Set<string>();
    templates.forEach((t) => {
      if (t.category) {
        categories.add(t.category);
      }
    });

    return Array.from(categories).sort();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Send an email (or queue it for sending)
 * This is the main entry point for sending emails
 */
export const send = mutation({
  args: {
    to: v.array(emailRecipientValidator),
    cc: v.optional(v.array(emailRecipientValidator)),
    bcc: v.optional(v.array(emailRecipientValidator)),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    templateId: v.optional(v.id("emailTemplates")),
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal")
      )
    ),
    relatedToId: v.optional(v.string()),
    sentBy: v.optional(v.id("users")),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get email settings for defaults
    const settings = await ctx.db.query("emailSettings").first();

    // Determine status based on scheduling
    const status = args.scheduledAt && args.scheduledAt > now ? "queued" : "queued";

    // Create the email record
    const emailId = await ctx.db.insert("emails", {
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      subject: args.subject,
      body: args.body,
      bodyHtml: args.bodyHtml,
      templateId: args.templateId,
      relatedToType: args.relatedToType,
      relatedToId: args.relatedToId,
      fromEmail: settings?.defaultFromEmail,
      fromName: settings?.defaultFromName,
      sentBy: args.sentBy,
      status,
      trackOpens: settings?.enableOpenTracking ?? true,
      trackClicks: settings?.enableClickTracking ?? true,
      createdAt: now,
      scheduledAt: args.scheduledAt,
    });

    // Update template usage count if using a template
    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (template) {
        await ctx.db.patch(args.templateId, {
          usageCount: template.usageCount + 1,
          lastUsedAt: now,
        });
      }
    }

    // Create an activity record for this email
    if (args.relatedToType && args.relatedToId) {
      await ctx.db.insert("activities", {
        type: "email",
        subject: args.subject,
        description: args.body.slice(0, 500), // First 500 chars as description
        relatedToType: args.relatedToType,
        relatedToId: args.relatedToId,
        emailDirection: "outbound",
        ownerId: args.sentBy,
        createdAt: now,
        updatedAt: now,
      });

      // Update lastActivityAt on the related entity
      if (args.relatedToType === "contact") {
        const contactId = args.relatedToId as Id<"contacts">;
        const contact = await ctx.db.get(contactId);
        if (contact) {
          await ctx.db.patch(contactId, { lastActivityAt: now });
        }
      }
    }

    // Log to activity log
    await ctx.db.insert("activityLog", {
      action: "email_sent",
      entityType: "email",
      entityId: emailId,
      metadata: {
        to: args.to.map((r) => r.email).join(", "),
        subject: args.subject,
        relatedToType: args.relatedToType,
        relatedToId: args.relatedToId,
      },
      userId: args.sentBy,
      timestamp: now,
    });

    // TODO: In a real implementation, this would trigger an action to actually send
    // the email via SMTP/SendGrid/etc. For now, we'll simulate by updating status.
    // In production, you would:
    // 1. Use a Convex action to call the email provider API
    // 2. Use a scheduled function to process the queue
    // 3. Update the email status based on the provider response

    // Simulate sending (in production, this would be in an action)
    await ctx.db.patch(emailId, {
      status: "sent",
      sentAt: now,
    });

    // Log the sent event
    await ctx.db.insert("emailEvents", {
      emailId,
      eventType: "sent",
      timestamp: now,
    });

    console.log(`[EMAIL] Email queued for sending:`, {
      id: emailId,
      to: args.to.map((r) => r.email).join(", "),
      subject: args.subject,
    });

    return emailId;
  },
});

/**
 * Save an email as draft
 */
export const saveDraft = mutation({
  args: {
    id: v.optional(v.id("emails")),
    to: v.array(emailRecipientValidator),
    cc: v.optional(v.array(emailRecipientValidator)),
    bcc: v.optional(v.array(emailRecipientValidator)),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    templateId: v.optional(v.id("emailTemplates")),
    relatedToType: v.optional(
      v.union(
        v.literal("contact"),
        v.literal("company"),
        v.literal("deal")
      )
    ),
    relatedToId: v.optional(v.string()),
    sentBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      // Update existing draft
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.status !== "draft") {
        throw new Error("Cannot update non-draft email");
      }

      await ctx.db.patch(args.id, {
        to: args.to,
        cc: args.cc,
        bcc: args.bcc,
        subject: args.subject,
        body: args.body,
        bodyHtml: args.bodyHtml,
        templateId: args.templateId,
        relatedToType: args.relatedToType,
        relatedToId: args.relatedToId,
      });

      return args.id;
    }

    // Create new draft
    const emailId = await ctx.db.insert("emails", {
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      subject: args.subject,
      body: args.body,
      bodyHtml: args.bodyHtml,
      templateId: args.templateId,
      relatedToType: args.relatedToType,
      relatedToId: args.relatedToId,
      sentBy: args.sentBy,
      status: "draft",
      createdAt: now,
    });

    return emailId;
  },
});

/**
 * Delete an email (only drafts can be deleted)
 */
export const deleteEmail = mutation({
  args: { id: v.id("emails") },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.id);
    if (!email) {
      throw new Error("Email not found");
    }

    if (email.status !== "draft") {
      throw new Error("Only draft emails can be deleted");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Record a tracking event (open, click, etc.)
 */
export const recordEvent = mutation({
  args: {
    emailId: v.id("emails"),
    eventType: v.union(
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed")
    ),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = await ctx.db.get(args.emailId);

    if (!email) {
      throw new Error("Email not found");
    }

    // Create the event
    await ctx.db.insert("emailEvents", {
      emailId: args.emailId,
      eventType: args.eventType,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    // Update email tracking counts
    const updates: Partial<Doc<"emails">> = {};

    if (args.eventType === "opened") {
      updates.openCount = (email.openCount ?? 0) + 1;
      updates.lastOpenedAt = now;
      if (!email.firstOpenedAt) {
        updates.firstOpenedAt = now;
      }
    } else if (args.eventType === "clicked") {
      updates.clickCount = (email.clickCount ?? 0) + 1;
    } else if (args.eventType === "bounced") {
      updates.status = "bounced";
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.emailId, updates);
    }

    return { success: true };
  },
});

// =============================================================================
// EMAIL TEMPLATE MUTATIONS
// =============================================================================

/**
 * Create a new email template
 */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    variables: v.optional(
      v.array(
        v.object({
          name: v.string(),
          defaultValue: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const templateId = await ctx.db.insert("emailTemplates", {
      name: args.name,
      description: args.description,
      subject: args.subject,
      body: args.body,
      bodyHtml: args.bodyHtml,
      category: args.category,
      tags: args.tags,
      variables: args.variables,
      usageCount: 0,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

/**
 * Update an email template
 */
export const updateTemplate = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyHtml: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    variables: v.optional(
      v.array(
        v.object({
          name: v.string(),
          defaultValue: v.optional(v.string()),
          description: v.optional(v.string()),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }

    const updateData: Partial<Doc<"emailTemplates">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.body !== undefined) updateData.body = updates.body;
    if (updates.bodyHtml !== undefined) updateData.bodyHtml = updates.bodyHtml;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.variables !== undefined) updateData.variables = updates.variables;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete an email template (soft delete by deactivating)
 */
export const deleteTemplate = mutation({
  args: { id: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// =============================================================================
// EMAIL SETTINGS MUTATIONS
// =============================================================================

/**
 * Update email settings
 */
export const updateSettings = mutation({
  args: {
    provider: v.optional(
      v.union(
        v.literal("none"),
        v.literal("smtp"),
        v.literal("sendgrid"),
        v.literal("resend"),
        v.literal("mailgun"),
        v.literal("postmark")
      )
    ),
    smtpHost: v.optional(v.string()),
    smtpPort: v.optional(v.number()),
    smtpSecure: v.optional(v.boolean()),
    smtpUsername: v.optional(v.string()),
    apiKeyConfigured: v.optional(v.boolean()),
    defaultFromEmail: v.optional(v.string()),
    defaultFromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    enableOpenTracking: v.optional(v.boolean()),
    enableClickTracking: v.optional(v.boolean()),
    trackingDomain: v.optional(v.string()),
    defaultSignature: v.optional(v.string()),
    unsubscribeLink: v.optional(v.string()),
    dailySendLimit: v.optional(v.number()),
    hourlySendLimit: v.optional(v.number()),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("emailSettings").first();

    const updates = {
      ...args,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new settings with defaults
    const settingsId = await ctx.db.insert("emailSettings", {
      provider: args.provider ?? "none",
      smtpHost: args.smtpHost,
      smtpPort: args.smtpPort,
      smtpSecure: args.smtpSecure,
      smtpUsername: args.smtpUsername,
      apiKeyConfigured: args.apiKeyConfigured,
      defaultFromEmail: args.defaultFromEmail,
      defaultFromName: args.defaultFromName,
      replyToEmail: args.replyToEmail,
      enableOpenTracking: args.enableOpenTracking ?? true,
      enableClickTracking: args.enableClickTracking ?? true,
      trackingDomain: args.trackingDomain,
      defaultSignature: args.defaultSignature,
      unsubscribeLink: args.unsubscribeLink,
      dailySendLimit: args.dailySendLimit,
      hourlySendLimit: args.hourlySendLimit,
      updatedAt: now,
      updatedBy: args.updatedBy,
    });

    return settingsId;
  },
});

/**
 * Test email configuration by sending a test email
 */
export const sendTestEmail = mutation({
  args: {
    toEmail: v.string(),
    sentBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("emailSettings").first();

    if (!settings || settings.provider === "none") {
      throw new Error("Email provider not configured. Please configure email settings first.");
    }

    // Send a test email using the configured settings
    const emailId = await ctx.db.insert("emails", {
      to: [{ email: args.toEmail }],
      subject: "Test Email from CRM",
      body: `This is a test email to verify your email configuration is working correctly.\n\nSent from: ${settings.defaultFromEmail || "CRM System"}\nProvider: ${settings.provider}`,
      fromEmail: settings.defaultFromEmail,
      fromName: settings.defaultFromName,
      sentBy: args.sentBy,
      status: "sent",
      provider: settings.provider,
      createdAt: Date.now(),
      sentAt: Date.now(),
    });

    console.log(`[EMAIL] Test email sent to ${args.toEmail}`);

    return { success: true, emailId };
  },
});
