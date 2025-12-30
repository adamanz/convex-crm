import { v } from "convex/values";
import { action, internalAction, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PARALLEL.AI INTEGRATION - Contact & Company Enrichment
// ============================================================================

const PARALLEL_API_BASE = "https://api.parallel.ai/v1";

// Enrichment schemas for contacts
const contactEnrichmentSchema = {
  type: "json",
  json_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Current job title of the person",
      },
      company_name: {
        type: "string",
        description: "Current company name where the person works",
      },
      company_domain: {
        type: "string",
        description: "Company website domain (e.g., example.com)",
      },
      linkedin_url: {
        type: "string",
        description: "LinkedIn profile URL",
      },
      twitter_handle: {
        type: "string",
        description: "Twitter/X handle without @ symbol",
      },
      location: {
        type: "string",
        description: "City and country of the person",
      },
      bio: {
        type: "string",
        description: "Brief professional bio or summary",
      },
      industry: {
        type: "string",
        description: "Industry the person works in",
      },
      seniority: {
        type: "string",
        enum: ["Entry", "Mid", "Senior", "Director", "VP", "C-Level", "Founder"],
        description: "Seniority level of the person",
      },
      skills: {
        type: "array",
        items: { type: "string" },
        description: "List of professional skills",
      },
      phone: {
        type: "string",
        description: "Business phone number if publicly available",
      },
    },
    required: ["title", "company_name"],
    additionalProperties: false,
  },
};

// Enrichment schema for companies
const companyEnrichmentSchema = {
  type: "json",
  json_schema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Brief company description",
      },
      industry: {
        type: "string",
        description: "Primary industry",
      },
      employee_count: {
        type: "string",
        enum: [
          "1-10",
          "11-50",
          "51-200",
          "201-500",
          "501-1000",
          "1001-5000",
          "5001-10000",
          "10000+",
        ],
        description: "Number of employees range",
      },
      founded_year: {
        type: "number",
        description: "Year the company was founded",
      },
      headquarters: {
        type: "string",
        description: "City and country of headquarters",
      },
      annual_revenue: {
        type: "string",
        description: "Estimated annual revenue range",
      },
      funding_stage: {
        type: "string",
        enum: ["Bootstrapped", "Seed", "Series A", "Series B", "Series C+", "Public", "Private Equity"],
        description: "Current funding stage",
      },
      total_funding: {
        type: "string",
        description: "Total funding raised if available",
      },
      linkedin_url: {
        type: "string",
        description: "Company LinkedIn page URL",
      },
      twitter_handle: {
        type: "string",
        description: "Company Twitter/X handle",
      },
      technologies: {
        type: "array",
        items: { type: "string" },
        description: "Key technologies used by the company",
      },
      competitors: {
        type: "array",
        items: { type: "string" },
        description: "Main competitors",
      },
    },
    required: ["description", "industry"],
    additionalProperties: false,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getParallelApiKey(ctx: any): Promise<string | null> {
  const integration = await ctx.runQuery(internal.integrations.getCredentials, {
    type: "parallel",
  });
  return integration?.credentials?.apiKey ?? null;
}

async function createTaskRun(
  apiKey: string,
  input: string,
  outputSchema: object,
  processor: "core" | "base" | "lite" = "base"
): Promise<{ runId: string; status: string }> {
  const response = await fetch(`${PARALLEL_API_BASE}/tasks/runs`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      processor,
      task_spec: {
        output_schema: outputSchema,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Parallel API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    runId: data.id,
    status: data.status,
  };
}

async function getTaskResult(
  apiKey: string,
  runId: string
): Promise<{ status: string; result?: any; error?: string }> {
  const response = await fetch(`${PARALLEL_API_BASE}/tasks/runs/${runId}/result`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { status: "pending" };
    }
    const error = await response.text();
    throw new Error(`Parallel API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    status: data.status || "completed",
    result: data.output,
    error: data.error,
  };
}

async function pollForResult(
  apiKey: string,
  runId: string,
  maxAttempts: number = 30,
  delayMs: number = 2000
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskResult(apiKey, runId);

    if (result.status === "completed" && result.result) {
      return result.result;
    }

    if (result.status === "failed" || result.error) {
      throw new Error(result.error || "Enrichment failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Enrichment timed out");
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Enrich a contact using Parallel.ai
 * Fetches additional data about the person based on their name and email
 */
export const enrichContact = action({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get the contact
    const contact = await ctx.runQuery(api.contacts.get, { id: args.contactId });
    if (!contact) {
      return { success: false, error: "Contact not found" };
    }

    // Get API key
    const apiKey = await getParallelApiKey(ctx);
    if (!apiKey) {
      return { success: false, error: "Parallel.ai not configured" };
    }

    // Build the search query
    const nameParts = [contact.firstName, contact.lastName].filter(Boolean);
    const name = nameParts.join(" ");

    let searchQuery = name;
    if (contact.email) {
      searchQuery += ` email: ${contact.email}`;
    }
    if (contact.linkedinUrl) {
      searchQuery += ` linkedin: ${contact.linkedinUrl}`;
    }

    try {
      // Create task run
      const { runId } = await createTaskRun(
        apiKey,
        searchQuery,
        contactEnrichmentSchema,
        "base"
      );

      // Poll for result
      const result = await pollForResult(apiKey, runId);

      // Map result to enrichment data format
      const enrichmentData = {
        title: result.title,
        company: result.company_name
          ? {
              name: result.company_name,
              website: result.company_domain,
            }
          : undefined,
        location: result.location,
        linkedinUrl: result.linkedin_url,
        twitterHandle: result.twitter_handle,
        bio: result.bio,
        skills: result.skills,
        seniority: result.seniority,
        industry: result.industry,
        phone: result.phone,
        confidence: 0.85, // Parallel doesn't provide confidence, use default
        source: "parallel.ai",
        enrichedAt: Date.now(),
      };

      // Update the contact with enriched data
      await ctx.runMutation(api.ai.enrichContact, {
        contactId: args.contactId,
        enrichmentData,
      });

      // Update integration sync stats
      await ctx.runMutation(api.integrations.updateSyncStatus, {
        type: "parallel",
        lastSyncStatus: "success",
        recordCount: 1,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log the error
      await ctx.runMutation(api.integrations.updateSyncStatus, {
        type: "parallel",
        lastSyncStatus: "error",
        lastSyncError: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Enrich a company using Parallel.ai
 * Fetches additional data about the company based on name and domain
 */
export const enrichCompany = action({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get the company
    const company = await ctx.runQuery(api.companies.get, { id: args.companyId });
    if (!company) {
      return { success: false, error: "Company not found" };
    }

    // Get API key
    const apiKey = await getParallelApiKey(ctx);
    if (!apiKey) {
      return { success: false, error: "Parallel.ai not configured" };
    }

    // Build the search query
    let searchQuery = company.name;
    if (company.domain) {
      searchQuery += ` website: ${company.domain}`;
    }
    if (company.website) {
      searchQuery += ` website: ${company.website}`;
    }

    try {
      // Create task run
      const { runId } = await createTaskRun(
        apiKey,
        searchQuery,
        companyEnrichmentSchema,
        "base"
      );

      // Poll for result
      const result = await pollForResult(apiKey, runId);

      // Map result to enrichment data format
      const enrichmentData = {
        description: result.description,
        industry: result.industry,
        size: result.employee_count,
        employeeCount: parseEmployeeCount(result.employee_count),
        founded: result.founded_year,
        headquarters: result.headquarters,
        revenue: result.annual_revenue,
        funding: result.total_funding,
        fundingStage: result.funding_stage,
        socialProfiles: {
          linkedin: result.linkedin_url,
          twitter: result.twitter_handle,
        },
        technologies: result.technologies,
        competitors: result.competitors,
        confidence: 0.85,
        source: "parallel.ai",
        enrichedAt: Date.now(),
      };

      // Update the company with enriched data
      await ctx.runMutation(api.ai.enrichCompany, {
        companyId: args.companyId,
        enrichmentData,
      });

      // Update integration sync stats
      await ctx.runMutation(api.integrations.updateSyncStatus, {
        type: "parallel",
        lastSyncStatus: "success",
        recordCount: 1,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log the error
      await ctx.runMutation(api.integrations.updateSyncStatus, {
        type: "parallel",
        lastSyncStatus: "error",
        lastSyncError: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Bulk enrich contacts using the enrichment queue
 */
export const bulkEnrichContacts = action({
  args: {
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args): Promise<{ queued: number; errors: string[] }> => {
    const errors: string[] = [];
    let queued = 0;

    for (const contactId of args.contactIds) {
      try {
        await ctx.runMutation(api.parallel.queueEnrichment, {
          entityType: "contact",
          entityId: contactId,
        });
        queued++;
      } catch (error) {
        errors.push(
          `Contact ${contactId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return { queued, errors };
  },
});

/**
 * Bulk enrich companies using the enrichment queue
 */
export const bulkEnrichCompanies = action({
  args: {
    companyIds: v.array(v.id("companies")),
  },
  handler: async (ctx, args): Promise<{ queued: number; errors: string[] }> => {
    const errors: string[] = [];
    let queued = 0;

    for (const companyId of args.companyIds) {
      try {
        await ctx.runMutation(api.parallel.queueEnrichment, {
          entityType: "company",
          entityId: companyId,
        });
        queued++;
      } catch (error) {
        errors.push(
          `Company ${companyId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return { queued, errors };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Queue an entity for enrichment
 */
export const queueEnrichment = mutation({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already in queue
    const existing = await ctx.db
      .query("aiEnrichmentQueue")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();

    if (existing && existing.status === "pending") {
      return existing._id;
    }

    // Add to queue
    const id = await ctx.db.insert("aiEnrichmentQueue", {
      entityType: args.entityType,
      entityId: args.entityId,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
    });

    return id;
  },
});

/**
 * Process the next item in the enrichment queue
 */
export const processEnrichmentQueue = action({
  args: {},
  handler: async (ctx): Promise<{ processed: number; errors: number }> => {
    // Get pending items from queue
    const pendingItems = await ctx.runQuery(api.parallel.getPendingEnrichments, {
      limit: 10,
    });

    let processed = 0;
    let errors = 0;

    for (const item of pendingItems) {
      // Mark as processing
      await ctx.runMutation(api.parallel.updateQueueStatus, {
        queueId: item._id,
        status: "processing",
      });

      try {
        if (item.entityType === "contact") {
          const result = await ctx.runAction(api.parallel.enrichContact, {
            contactId: item.entityId as Id<"contacts">,
          });

          if (result.success) {
            await ctx.runMutation(api.parallel.updateQueueStatus, {
              queueId: item._id,
              status: "completed",
            });
            processed++;
          } else {
            throw new Error(result.error);
          }
        } else if (item.entityType === "company") {
          const result = await ctx.runAction(api.parallel.enrichCompany, {
            companyId: item.entityId as Id<"companies">,
          });

          if (result.success) {
            await ctx.runMutation(api.parallel.updateQueueStatus, {
              queueId: item._id,
              status: "completed",
            });
            processed++;
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        errors++;
        await ctx.runMutation(api.parallel.updateQueueStatus, {
          queueId: item._id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { processed, errors };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get pending enrichment items from the queue
 */
export const getPendingEnrichments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const items = await ctx.db
      .query("aiEnrichmentQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);

    return items;
  },
});

/**
 * Update queue item status
 */
export const updateQueueStatus = mutation({
  args: {
    queueId: v.id("aiEnrichmentQueue"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db.get(args.queueId);

    if (!item) {
      throw new Error("Queue item not found");
    }

    await ctx.db.patch(args.queueId, {
      status: args.status,
      ...(args.status === "processing" ? { attempts: item.attempts + 1 } : {}),
      ...(args.status === "completed" || args.status === "failed"
        ? { processedAt: now }
        : {}),
      ...(args.error ? { error: args.error } : {}),
    });
  },
});

/**
 * Get enrichment stats
 */
export const getEnrichmentStats = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("aiEnrichmentQueue").collect();

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: allItems.length,
    };

    for (const item of allItems) {
      stats[item.status as keyof typeof stats]++;
    }

    return stats;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseEmployeeCount(range: string | undefined): number | undefined {
  if (!range) return undefined;

  const ranges: Record<string, number> = {
    "1-10": 5,
    "11-50": 30,
    "51-200": 125,
    "201-500": 350,
    "501-1000": 750,
    "1001-5000": 3000,
    "5001-10000": 7500,
    "10000+": 15000,
  };

  return ranges[range];
}

// ============================================================================
// INTERNAL ACTIONS (for cron jobs)
// ============================================================================

/**
 * Internal action to process enrichment queue (called by cron)
 */
export const processEnrichmentQueueInternal = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; errors: number }> => {
    // Get pending items from queue
    const pendingItems = await ctx.runQuery(api.parallel.getPendingEnrichments, {
      limit: 10,
    });

    let processed = 0;
    let errors = 0;

    for (const item of pendingItems) {
      // Mark as processing
      await ctx.runMutation(api.parallel.updateQueueStatus, {
        queueId: item._id,
        status: "processing",
      });

      try {
        if (item.entityType === "contact") {
          const result = await ctx.runAction(api.parallel.enrichContact, {
            contactId: item.entityId as Id<"contacts">,
          });

          if (result.success) {
            await ctx.runMutation(api.parallel.updateQueueStatus, {
              queueId: item._id,
              status: "completed",
            });
            processed++;
          } else {
            throw new Error(result.error);
          }
        } else if (item.entityType === "company") {
          const result = await ctx.runAction(api.parallel.enrichCompany, {
            companyId: item.entityId as Id<"companies">,
          });

          if (result.success) {
            await ctx.runMutation(api.parallel.updateQueueStatus, {
              queueId: item._id,
              status: "completed",
            });
            processed++;
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        errors++;
        await ctx.runMutation(api.parallel.updateQueueStatus, {
          queueId: item._id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { processed, errors };
  },
});
