import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// IMPORT MUTATIONS - Batch import contacts, companies, and deals
// ============================================================================

/**
 * Import contacts from parsed CSV data
 * Returns success count and any errors encountered
 */
export const importContacts = mutation({
  args: {
    contacts: v.array(
      v.object({
        firstName: v.optional(v.string()),
        lastName: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        title: v.optional(v.string()),
        companyName: v.optional(v.string()), // Will be matched/created
        linkedinUrl: v.optional(v.string()),
        twitterHandle: v.optional(v.string()),
        source: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        // Address fields
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    skipDuplicateEmails: v.optional(v.boolean()),
    defaultSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Build company name -> ID cache
    const companyCache = new Map<string, Id<"companies">>();
    const existingCompanies = await ctx.db.query("companies").collect();
    for (const company of existingCompanies) {
      companyCache.set(company.name.toLowerCase(), company._id);
    }

    // Build email duplicate check cache
    const existingEmails = new Set<string>();
    if (args.skipDuplicateEmails) {
      const existingContacts = await ctx.db.query("contacts").collect();
      for (const contact of existingContacts) {
        if (contact.email) {
          existingEmails.add(contact.email.toLowerCase());
        }
      }
    }

    for (let i = 0; i < args.contacts.length; i++) {
      const contact = args.contacts[i];

      try {
        // Validate required field
        if (!contact.lastName?.trim()) {
          results.errors.push({ row: i + 1, error: "Last name is required" });
          results.skipped++;
          continue;
        }

        // Check for duplicate email
        if (
          args.skipDuplicateEmails &&
          contact.email &&
          existingEmails.has(contact.email.toLowerCase())
        ) {
          results.skipped++;
          continue;
        }

        // Find or create company if provided
        let companyId: Id<"companies"> | undefined;
        if (contact.companyName?.trim()) {
          const normalizedName = contact.companyName.trim().toLowerCase();
          if (companyCache.has(normalizedName)) {
            companyId = companyCache.get(normalizedName);
          } else {
            // Create new company
            companyId = await ctx.db.insert("companies", {
              name: contact.companyName.trim(),
              tags: [],
              createdAt: now,
              updatedAt: now,
            });
            companyCache.set(normalizedName, companyId);
          }
        }

        // Build address object if any address fields are provided
        let address:
          | {
              street?: string;
              city?: string;
              state?: string;
              postalCode?: string;
              country?: string;
            }
          | undefined;

        if (
          contact.street ||
          contact.city ||
          contact.state ||
          contact.postalCode ||
          contact.country
        ) {
          address = {
            street: contact.street || undefined,
            city: contact.city || undefined,
            state: contact.state || undefined,
            postalCode: contact.postalCode || undefined,
            country: contact.country || undefined,
          };
        }

        // Insert contact
        await ctx.db.insert("contacts", {
          firstName: contact.firstName || undefined,
          lastName: contact.lastName.trim(),
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          title: contact.title || undefined,
          companyId,
          linkedinUrl: contact.linkedinUrl || undefined,
          twitterHandle: contact.twitterHandle || undefined,
          source: contact.source || args.defaultSource || "import",
          tags: contact.tags ?? [],
          address,
          createdAt: now,
          updatedAt: now,
        });

        // Track email for duplicate detection within same batch
        if (contact.email) {
          existingEmails.add(contact.email.toLowerCase());
        }

        results.imported++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results.skipped++;
      }
    }

    // Log the import activity
    await ctx.db.insert("activityLog", {
      action: "contacts_imported",
      entityType: "contact",
      entityId: "batch_import",
      metadata: {
        imported: results.imported,
        skipped: results.skipped,
        errorCount: results.errors.length,
      },
      timestamp: now,
      system: true,
    });

    return results;
  },
});

/**
 * Import companies from parsed CSV data
 */
export const importCompanies = mutation({
  args: {
    companies: v.array(
      v.object({
        name: v.string(),
        domain: v.optional(v.string()),
        industry: v.optional(v.string()),
        size: v.optional(v.string()),
        annualRevenue: v.optional(v.number()),
        description: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        // Address fields
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    skipDuplicateDomains: v.optional(v.boolean()),
    skipDuplicateNames: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Build domain and name duplicate check caches
    const existingDomains = new Set<string>();
    const existingNames = new Set<string>();

    if (args.skipDuplicateDomains || args.skipDuplicateNames) {
      const existingCompanies = await ctx.db.query("companies").collect();
      for (const company of existingCompanies) {
        if (company.domain) {
          existingDomains.add(company.domain.toLowerCase());
        }
        existingNames.add(company.name.toLowerCase());
      }
    }

    for (let i = 0; i < args.companies.length; i++) {
      const company = args.companies[i];

      try {
        // Validate required field
        if (!company.name?.trim()) {
          results.errors.push({ row: i + 1, error: "Company name is required" });
          results.skipped++;
          continue;
        }

        // Check for duplicate domain
        if (
          args.skipDuplicateDomains &&
          company.domain &&
          existingDomains.has(company.domain.toLowerCase())
        ) {
          results.skipped++;
          continue;
        }

        // Check for duplicate name
        if (
          args.skipDuplicateNames &&
          existingNames.has(company.name.toLowerCase())
        ) {
          results.skipped++;
          continue;
        }

        // Build address object if any address fields are provided
        let address:
          | {
              street?: string;
              city?: string;
              state?: string;
              postalCode?: string;
              country?: string;
            }
          | undefined;

        if (
          company.street ||
          company.city ||
          company.state ||
          company.postalCode ||
          company.country
        ) {
          address = {
            street: company.street || undefined,
            city: company.city || undefined,
            state: company.state || undefined,
            postalCode: company.postalCode || undefined,
            country: company.country || undefined,
          };
        }

        // Insert company
        await ctx.db.insert("companies", {
          name: company.name.trim(),
          domain: company.domain || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          annualRevenue: company.annualRevenue,
          description: company.description || undefined,
          phone: company.phone || undefined,
          website: company.website || undefined,
          tags: company.tags ?? [],
          address,
          createdAt: now,
          updatedAt: now,
        });

        // Track for duplicate detection within same batch
        if (company.domain) {
          existingDomains.add(company.domain.toLowerCase());
        }
        existingNames.add(company.name.toLowerCase());

        results.imported++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results.skipped++;
      }
    }

    // Log the import activity
    await ctx.db.insert("activityLog", {
      action: "companies_imported",
      entityType: "company",
      entityId: "batch_import",
      metadata: {
        imported: results.imported,
        skipped: results.skipped,
        errorCount: results.errors.length,
      },
      timestamp: now,
      system: true,
    });

    return results;
  },
});

/**
 * Import deals from parsed CSV data
 */
export const importDeals = mutation({
  args: {
    deals: v.array(
      v.object({
        name: v.string(),
        companyName: v.optional(v.string()), // Will be matched
        contactEmail: v.optional(v.string()), // Will be matched
        stageId: v.optional(v.string()),
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        probability: v.optional(v.number()),
        expectedCloseDate: v.optional(v.string()), // ISO date string
        status: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    pipelineId: v.id("pipelines"),
    defaultStageId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Validate pipeline and default stage
    const pipeline = await ctx.db.get(args.pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    const validStageIds = new Set(pipeline.stages.map((s) => s.id));
    if (!validStageIds.has(args.defaultStageId)) {
      throw new Error("Invalid default stage for this pipeline");
    }

    // Build lookup caches
    const companyCache = new Map<string, Id<"companies">>();
    const existingCompanies = await ctx.db.query("companies").collect();
    for (const company of existingCompanies) {
      companyCache.set(company.name.toLowerCase(), company._id);
    }

    const contactCache = new Map<string, Id<"contacts">>();
    const existingContacts = await ctx.db.query("contacts").collect();
    for (const contact of existingContacts) {
      if (contact.email) {
        contactCache.set(contact.email.toLowerCase(), contact._id);
      }
    }

    for (let i = 0; i < args.deals.length; i++) {
      const deal = args.deals[i];

      try {
        // Validate required field
        if (!deal.name?.trim()) {
          results.errors.push({ row: i + 1, error: "Deal name is required" });
          results.skipped++;
          continue;
        }

        // Find company if provided
        let companyId: Id<"companies"> | undefined;
        if (deal.companyName?.trim()) {
          companyId = companyCache.get(deal.companyName.trim().toLowerCase());
          if (!companyId) {
            results.errors.push({
              row: i + 1,
              error: `Company "${deal.companyName}" not found`,
            });
            results.skipped++;
            continue;
          }
        }

        // Find contact if provided
        const contactIds: Id<"contacts">[] = [];
        if (deal.contactEmail?.trim()) {
          const contactId = contactCache.get(deal.contactEmail.trim().toLowerCase());
          if (contactId) {
            contactIds.push(contactId);
          }
          // Don't fail if contact not found - just skip linking
        }

        // Determine stage
        let stageId = args.defaultStageId;
        if (deal.stageId?.trim()) {
          if (validStageIds.has(deal.stageId.trim())) {
            stageId = deal.stageId.trim();
          } else {
            // Try to match by stage name (case-insensitive)
            const matchedStage = pipeline.stages.find(
              (s) => s.name.toLowerCase() === deal.stageId?.trim().toLowerCase()
            );
            if (matchedStage) {
              stageId = matchedStage.id;
            }
          }
        }

        // Parse expected close date
        let expectedCloseDate: number | undefined;
        if (deal.expectedCloseDate) {
          const parsed = Date.parse(deal.expectedCloseDate);
          if (!isNaN(parsed)) {
            expectedCloseDate = parsed;
          }
        }

        // Parse status
        let status: "open" | "won" | "lost" = "open";
        if (deal.status) {
          const normalizedStatus = deal.status.toLowerCase().trim();
          if (normalizedStatus === "won" || normalizedStatus === "closed won") {
            status = "won";
          } else if (
            normalizedStatus === "lost" ||
            normalizedStatus === "closed lost"
          ) {
            status = "lost";
          }
        }

        // Insert deal
        await ctx.db.insert("deals", {
          name: deal.name.trim(),
          companyId,
          contactIds,
          pipelineId: args.pipelineId,
          stageId,
          amount: deal.amount,
          currency: deal.currency ?? "USD",
          probability: deal.probability,
          expectedCloseDate,
          status,
          tags: deal.tags ?? [],
          createdAt: now,
          updatedAt: now,
          stageChangedAt: now,
        });

        results.imported++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results.skipped++;
      }
    }

    // Log the import activity
    await ctx.db.insert("activityLog", {
      action: "deals_imported",
      entityType: "deal",
      entityId: "batch_import",
      metadata: {
        imported: results.imported,
        skipped: results.skipped,
        errorCount: results.errors.length,
        pipelineId: args.pipelineId,
      },
      timestamp: now,
      system: true,
    });

    return results;
  },
});
