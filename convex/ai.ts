import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// ============================================================================
// AI FUNCTIONS - Enrichment, Scoring, and Sentiment Analysis
// ============================================================================

// Types for AI enrichment data
const enrichmentDataValidator = v.object({
  company: v.optional(
    v.object({
      name: v.optional(v.string()),
      industry: v.optional(v.string()),
      size: v.optional(v.string()),
      website: v.optional(v.string()),
      description: v.optional(v.string()),
      founded: v.optional(v.number()),
      employeeCount: v.optional(v.number()),
      revenue: v.optional(v.string()),
    })
  ),
  title: v.optional(v.string()),
  location: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  twitterHandle: v.optional(v.string()),
  bio: v.optional(v.string()),
  skills: v.optional(v.array(v.string())),
  education: v.optional(
    v.array(
      v.object({
        school: v.string(),
        degree: v.optional(v.string()),
        field: v.optional(v.string()),
        year: v.optional(v.number()),
      })
    )
  ),
  experience: v.optional(
    v.array(
      v.object({
        company: v.string(),
        title: v.string(),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        current: v.optional(v.boolean()),
      })
    )
  ),
  socialProfiles: v.optional(
    v.object({
      linkedin: v.optional(v.string()),
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      facebook: v.optional(v.string()),
    })
  ),
  confidence: v.optional(v.number()),
});

const companyEnrichmentDataValidator = v.object({
  description: v.optional(v.string()),
  industry: v.optional(v.string()),
  size: v.optional(v.string()),
  employeeCount: v.optional(v.number()),
  founded: v.optional(v.number()),
  headquarters: v.optional(v.string()),
  revenue: v.optional(v.string()),
  funding: v.optional(v.string()),
  socialProfiles: v.optional(
    v.object({
      linkedin: v.optional(v.string()),
      twitter: v.optional(v.string()),
      facebook: v.optional(v.string()),
      crunchbase: v.optional(v.string()),
    })
  ),
  technologies: v.optional(v.array(v.string())),
  keywords: v.optional(v.array(v.string())),
  competitors: v.optional(v.array(v.string())),
  confidence: v.optional(v.number()),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get AI settings for the organization
 */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("aiSettings").first();
    return settings ?? null;
  },
});

/**
 * Get enrichment status for a contact
 */
export const getContactEnrichmentStatus = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      return null;
    }

    return {
      status: contact.enrichedAt
        ? "enriched"
        : contact.enrichmentData
          ? "pending"
          : "not_enriched",
      enrichedAt: contact.enrichedAt,
      enrichmentData: contact.enrichmentData,
      aiScore: contact.aiScore,
    };
  },
});

/**
 * Get enrichment status for a company
 */
export const getCompanyEnrichmentStatus = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      return null;
    }

    return {
      status: company.enrichedAt
        ? "enriched"
        : company.enrichmentData
          ? "pending"
          : "not_enriched",
      enrichedAt: company.enrichedAt,
      enrichmentData: company.enrichmentData,
    };
  },
});

/**
 * Get AI-generated deal insights
 */
export const getDealInsights = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      return null;
    }

    return {
      aiInsights: deal.aiInsights,
      winProbability: deal.winProbability,
    };
  },
});

/**
 * Get AI score factors for a contact
 */
export const getScoreFactors = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      return null;
    }

    // Calculate score factors based on available data
    const factors: Array<{
      label: string;
      impact: "positive" | "negative" | "neutral";
      weight: number;
    }> = [];

    // Email engagement factor
    if (contact.email) {
      factors.push({
        label: "Has email address",
        impact: "positive",
        weight: 10,
      });
    }

    // Phone availability
    if (contact.phone) {
      factors.push({
        label: "Has phone number",
        impact: "positive",
        weight: 5,
      });
    }

    // Company association
    if (contact.companyId) {
      factors.push({
        label: "Associated with company",
        impact: "positive",
        weight: 15,
      });
    }

    // LinkedIn profile
    if (contact.linkedinUrl) {
      factors.push({
        label: "LinkedIn profile available",
        impact: "positive",
        weight: 10,
      });
    }

    // Recent activity
    if (contact.lastActivityAt) {
      const daysSinceActivity = Math.floor(
        (Date.now() - contact.lastActivityAt) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity < 7) {
        factors.push({
          label: "Recent activity",
          impact: "positive",
          weight: 20,
        });
      } else if (daysSinceActivity > 30) {
        factors.push({
          label: "No recent activity",
          impact: "negative",
          weight: -10,
        });
      }
    } else {
      factors.push({
        label: "No activity recorded",
        impact: "negative",
        weight: -5,
      });
    }

    // Enrichment status
    if (contact.enrichedAt) {
      factors.push({
        label: "Profile enriched",
        impact: "positive",
        weight: 15,
      });
    }

    // Tags
    if (contact.tags && contact.tags.length > 0) {
      factors.push({
        label: `${contact.tags.length} tags applied`,
        impact: "positive",
        weight: 5,
      });
    }

    return {
      score: contact.aiScore ?? 0,
      factors,
      lastCalculated: contact.updatedAt,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Save AI settings for the organization
 */
export const saveSettings = mutation({
  args: {
    enrichmentProvider: v.optional(v.string()),
    enrichmentApiKey: v.optional(v.string()),
    openaiApiKey: v.optional(v.string()),
    anthropicApiKey: v.optional(v.string()),
    autoEnrichContacts: v.optional(v.boolean()),
    autoEnrichCompanies: v.optional(v.boolean()),
    autoCalculateScores: v.optional(v.boolean()),
    autoAnalyzeSentiment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("aiSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("aiSettings", {
        enrichmentProvider: args.enrichmentProvider ?? "clearbit",
        enrichmentApiKey: args.enrichmentApiKey,
        openaiApiKey: args.openaiApiKey,
        anthropicApiKey: args.anthropicApiKey,
        autoEnrichContacts: args.autoEnrichContacts ?? false,
        autoEnrichCompanies: args.autoEnrichCompanies ?? false,
        autoCalculateScores: args.autoCalculateScores ?? true,
        autoAnalyzeSentiment: args.autoAnalyzeSentiment ?? true,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Enrich a contact with AI-powered data
 * This mutation updates the contact with enriched data from an external provider
 */
export const enrichContact = mutation({
  args: {
    contactId: v.id("contacts"),
    enrichmentData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // If enrichmentData is provided, update the contact with it
    // Otherwise, mark as pending for the action to process
    if (args.enrichmentData) {
      const data = args.enrichmentData as Record<string, unknown>;

      await ctx.db.patch(args.contactId, {
        enrichedAt: now,
        enrichmentData: data,
        updatedAt: now,
        // Update fields if provided in enrichment data
        ...(data.title && typeof data.title === "string" && !contact.title
          ? { title: data.title }
          : {}),
        ...(data.linkedinUrl &&
        typeof data.linkedinUrl === "string" &&
        !contact.linkedinUrl
          ? { linkedinUrl: data.linkedinUrl }
          : {}),
        ...(data.twitterHandle &&
        typeof data.twitterHandle === "string" &&
        !contact.twitterHandle
          ? { twitterHandle: data.twitterHandle }
          : {}),
      });

      // Log the enrichment
      await ctx.db.insert("activityLog", {
        action: "contact_enriched",
        entityType: "contact",
        entityId: args.contactId,
        metadata: {
          source: "ai_enrichment",
          fieldsUpdated: Object.keys(data),
        },
        timestamp: now,
        system: true,
      });
    } else {
      // Mark as pending enrichment
      await ctx.db.patch(args.contactId, {
        enrichmentData: { status: "pending" },
        updatedAt: now,
      });
    }

    return args.contactId;
  },
});

/**
 * Enrich a company with AI-powered data
 */
export const enrichCompany = mutation({
  args: {
    companyId: v.id("companies"),
    enrichmentData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    if (args.enrichmentData) {
      const data = args.enrichmentData as Record<string, unknown>;

      await ctx.db.patch(args.companyId, {
        enrichedAt: now,
        enrichmentData: data,
        updatedAt: now,
        // Update fields if provided in enrichment data and not already set
        ...(data.industry &&
        typeof data.industry === "string" &&
        !company.industry
          ? { industry: data.industry }
          : {}),
        ...(data.size && typeof data.size === "string" && !company.size
          ? { size: data.size }
          : {}),
        ...(data.description &&
        typeof data.description === "string" &&
        !company.description
          ? { description: data.description }
          : {}),
      });

      // Log the enrichment
      await ctx.db.insert("activityLog", {
        action: "company_enriched",
        entityType: "company",
        entityId: args.companyId,
        metadata: {
          source: "ai_enrichment",
          fieldsUpdated: Object.keys(data),
        },
        timestamp: now,
        system: true,
      });
    } else {
      await ctx.db.patch(args.companyId, {
        enrichmentData: { status: "pending" },
        updatedAt: now,
      });
    }

    return args.companyId;
  },
});

/**
 * Calculate and update AI lead score for a contact
 */
export const calculateAIScore = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Calculate score based on various factors
    let score = 0;
    const maxScore = 100;

    // Base profile completeness (0-25 points)
    let profileScore = 0;
    if (contact.email) profileScore += 5;
    if (contact.phone) profileScore += 5;
    if (contact.firstName) profileScore += 3;
    if (contact.title) profileScore += 4;
    if (contact.linkedinUrl) profileScore += 4;
    if (contact.twitterHandle) profileScore += 2;
    if (contact.address) profileScore += 2;
    score += Math.min(profileScore, 25);

    // Company association (0-15 points)
    if (contact.companyId) {
      const company = await ctx.db.get(contact.companyId);
      if (company) {
        score += 10;
        if (company.industry) score += 2;
        if (company.size) score += 3;
      }
    }

    // Engagement score (0-30 points)
    let engagementScore = 0;
    if (contact.lastActivityAt) {
      const daysSinceActivity = Math.floor(
        (now - contact.lastActivityAt) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity < 1) engagementScore = 30;
      else if (daysSinceActivity < 7) engagementScore = 25;
      else if (daysSinceActivity < 14) engagementScore = 20;
      else if (daysSinceActivity < 30) engagementScore = 15;
      else if (daysSinceActivity < 60) engagementScore = 10;
      else engagementScore = 5;
    }
    score += engagementScore;

    // Enrichment bonus (0-15 points)
    if (contact.enrichedAt) {
      score += 10;
      if (contact.enrichmentData) {
        const data = contact.enrichmentData as Record<string, unknown>;
        if (data.skills && Array.isArray(data.skills)) score += 2;
        if (data.bio) score += 2;
        if (data.experience) score += 1;
      }
    }

    // Tags and categorization (0-15 points)
    if (contact.tags && contact.tags.length > 0) {
      score += Math.min(contact.tags.length * 3, 15);
    }

    // Normalize score to 0-100
    const finalScore = Math.min(Math.round(score), maxScore);

    await ctx.db.patch(args.contactId, {
      aiScore: finalScore,
      updatedAt: now,
    });

    // Log the score calculation
    await ctx.db.insert("activityLog", {
      action: "ai_score_calculated",
      entityType: "contact",
      entityId: args.contactId,
      metadata: {
        previousScore: contact.aiScore,
        newScore: finalScore,
      },
      timestamp: now,
      system: true,
    });

    return {
      contactId: args.contactId,
      score: finalScore,
    };
  },
});

/**
 * Analyze sentiment from activity notes/descriptions
 */
export const analyzeSentiment = mutation({
  args: {
    activityId: v.id("activities"),
    sentimentResult: v.optional(
      v.object({
        sentiment: v.union(
          v.literal("positive"),
          v.literal("neutral"),
          v.literal("negative"),
          v.literal("mixed")
        ),
        score: v.optional(v.number()),
        confidence: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    if (args.sentimentResult) {
      // Update with provided sentiment result
      await ctx.db.patch(args.activityId, {
        sentiment: args.sentimentResult.sentiment,
        updatedAt: now,
      });
    } else {
      // Perform basic keyword-based sentiment analysis as fallback
      const text = `${activity.subject} ${activity.description ?? ""}`.toLowerCase();

      // Simple keyword-based sentiment (placeholder for actual AI)
      const positiveKeywords = [
        "great",
        "excellent",
        "happy",
        "pleased",
        "excited",
        "interested",
        "love",
        "amazing",
        "wonderful",
        "perfect",
        "thanks",
        "appreciate",
        "successful",
        "progress",
        "agreed",
      ];
      const negativeKeywords = [
        "issue",
        "problem",
        "concern",
        "unhappy",
        "disappointed",
        "frustrated",
        "delay",
        "cancel",
        "reject",
        "complaint",
        "difficult",
        "fail",
        "wrong",
        "bad",
        "poor",
      ];

      let positiveCount = 0;
      let negativeCount = 0;

      for (const word of positiveKeywords) {
        if (text.includes(word)) positiveCount++;
      }
      for (const word of negativeKeywords) {
        if (text.includes(word)) negativeCount++;
      }

      let sentiment: "positive" | "neutral" | "negative" | "mixed" = "neutral";
      if (positiveCount > 0 && negativeCount > 0) {
        sentiment = "mixed";
      } else if (positiveCount > negativeCount) {
        sentiment = "positive";
      } else if (negativeCount > positiveCount) {
        sentiment = "negative";
      }

      await ctx.db.patch(args.activityId, {
        sentiment,
        updatedAt: now,
      });
    }

    return args.activityId;
  },
});

/**
 * Generate AI insights for a deal
 */
export const generateDealInsights = mutation({
  args: {
    dealId: v.id("deals"),
    insights: v.optional(v.any()),
    winProbability: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const deal = await ctx.db.get(args.dealId);
    if (!deal) {
      throw new Error("Deal not found");
    }

    if (args.insights || args.winProbability !== undefined) {
      await ctx.db.patch(args.dealId, {
        ...(args.insights !== undefined ? { aiInsights: args.insights } : {}),
        ...(args.winProbability !== undefined
          ? { winProbability: args.winProbability }
          : {}),
        updatedAt: now,
      });
    } else {
      // Calculate basic win probability based on available data
      let probability = 50; // Base probability

      // Adjust based on deal value
      if (deal.amount && deal.amount > 0) {
        probability += 5;
      }

      // Adjust based on contacts
      if (deal.contactIds.length > 0) {
        probability += deal.contactIds.length * 3;
      }

      // Adjust based on company
      if (deal.companyId) {
        probability += 5;
      }

      // Adjust based on expected close date
      if (deal.expectedCloseDate) {
        const daysUntilClose = Math.floor(
          (deal.expectedCloseDate - now) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilClose < 0) {
          probability -= 10; // Overdue
        } else if (daysUntilClose < 7) {
          probability += 10; // Close to closing
        }
      }

      // Cap probability
      probability = Math.max(10, Math.min(90, probability));

      const insights = {
        positiveFactors: [] as string[],
        negativeFactors: [] as string[],
        recommendations: [] as string[],
        generatedAt: now,
      };

      if (deal.amount && deal.amount > 0) {
        insights.positiveFactors.push("Deal has defined value");
      }
      if (deal.contactIds.length > 0) {
        insights.positiveFactors.push(
          `${deal.contactIds.length} stakeholder(s) identified`
        );
      }
      if (deal.companyId) {
        insights.positiveFactors.push("Associated with company account");
      }
      if (!deal.expectedCloseDate) {
        insights.negativeFactors.push("No expected close date set");
        insights.recommendations.push("Set an expected close date");
      }
      if (deal.contactIds.length === 0) {
        insights.negativeFactors.push("No contacts associated");
        insights.recommendations.push("Add key stakeholders to the deal");
      }

      await ctx.db.patch(args.dealId, {
        aiInsights: insights,
        winProbability: probability,
        updatedAt: now,
      });
    }

    return args.dealId;
  },
});

/**
 * Batch calculate AI scores for all contacts
 */
export const batchCalculateScores = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const now = Date.now();

    // Get contacts that haven't been scored recently (within last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_created")
      .order("desc")
      .take(limit);

    let updated = 0;

    for (const contact of contacts) {
      // Skip if recently updated
      if (contact.updatedAt > oneDayAgo && contact.aiScore !== undefined) {
        continue;
      }

      // Calculate score (simplified version)
      let score = 0;

      if (contact.email) score += 10;
      if (contact.phone) score += 5;
      if (contact.companyId) score += 15;
      if (contact.linkedinUrl) score += 10;
      if (contact.enrichedAt) score += 15;
      if (contact.lastActivityAt) {
        const daysSince = Math.floor(
          (now - contact.lastActivityAt) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 7) score += 25;
        else if (daysSince < 30) score += 15;
        else score += 5;
      }
      if (contact.tags && contact.tags.length > 0) {
        score += Math.min(contact.tags.length * 3, 15);
      }

      score = Math.min(score, 100);

      await ctx.db.patch(contact._id, {
        aiScore: score,
        updatedAt: now,
      });

      updated++;
    }

    return { updated, total: contacts.length };
  },
});

/**
 * Generate activity suggestions for a contact
 */
export const generateActivitySuggestions = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      return [];
    }

    const suggestions: Array<{
      id: string;
      type: "call" | "email" | "meeting" | "message" | "followup";
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
      timing?: string;
      reason?: string;
    }> = [];

    // Get recent activities
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_related", (q) =>
        q.eq("relatedToType", "contact").eq("relatedToId", args.contactId)
      )
      .order("desc")
      .take(10);

    const now = Date.now();
    const daysSinceLastActivity = contact.lastActivityAt
      ? Math.floor(
          (now - contact.lastActivityAt) / (1000 * 60 * 60 * 24)
        )
      : 30;

    // Suggest follow-up if no recent activity
    if (daysSinceLastActivity > 7) {
      suggestions.push({
        id: "followup-1",
        type: "followup",
        title: "Follow up with contact",
        description: `It's been ${daysSinceLastActivity} days since the last interaction`,
        priority: daysSinceLastActivity > 30 ? "high" : "medium",
        timing: "Today",
        reason: "Maintain engagement",
      });
    }

    // Suggest call if never called
    const hasCall = recentActivities.some((a) => a.type === "call");
    if (!hasCall && contact.phone) {
      suggestions.push({
        id: "call-1",
        type: "call",
        title: "Schedule a call",
        description: "No calls on record. A call could strengthen the relationship.",
        priority: "medium",
        timing: "This week",
        reason: "Build rapport",
      });
    }

    // Suggest email if has email and no recent email
    const hasRecentEmail = recentActivities.some(
      (a) => a.type === "email" && now - a.createdAt < 14 * 24 * 60 * 60 * 1000
    );
    if (!hasRecentEmail && contact.email) {
      suggestions.push({
        id: "email-1",
        type: "email",
        title: "Send a check-in email",
        description: "Keep the conversation going with a brief update or question.",
        priority: "low",
        timing: "This week",
        reason: "Stay top of mind",
      });
    }

    // Suggest meeting if high-value contact
    if (contact.aiScore && contact.aiScore >= 70) {
      const hasMeeting = recentActivities.some((a) => a.type === "meeting");
      if (!hasMeeting) {
        suggestions.push({
          id: "meeting-1",
          type: "meeting",
          title: "Schedule a meeting",
          description: "High-value contact - consider scheduling face time.",
          priority: "high",
          timing: "Next 2 weeks",
          reason: "High engagement score",
        });
      }
    }

    return suggestions;
  },
});
