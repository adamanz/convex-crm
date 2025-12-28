import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// DUPLICATES - Detection and Merge Functions
// ============================================================================

/**
 * Normalize phone number for comparison (remove formatting)
 */
function normalizePhone(phone: string | undefined): string {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)\+\.]/g, "");
}

/**
 * Normalize email for comparison (lowercase, trim)
 */
function normalizeEmail(email: string | undefined): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

/**
 * Normalize name for comparison (lowercase, remove extra spaces)
 */
function normalizeName(name: string | undefined): string {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses Levenshtein distance normalized by max length
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

/**
 * Extract domain from email
 */
function extractEmailDomain(email: string | undefined): string | null {
  if (!email) return null;
  const match = email.match(/@([^@]+)$/);
  return match ? match[1].toLowerCase() : null;
}

// ============================================================================
// CONTACT DUPLICATE DETECTION
// ============================================================================

export interface DuplicateContactMatch {
  contact: Doc<"contacts"> & { company?: Doc<"companies"> | null };
  matchReasons: string[];
  confidence: number;
}

/**
 * Find potential duplicate contacts
 */
export const findDuplicateContacts = query({
  args: {
    contactId: v.optional(v.id("contacts")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<DuplicateContactMatch[]> => {
    const { contactId, email, phone, firstName, lastName, limit = 10, minConfidence = 0.5 } = args;

    // If contactId is provided, get the contact's data
    let sourceContact: Doc<"contacts"> | null = null;
    if (contactId) {
      sourceContact = await ctx.db.get(contactId);
    }

    // Use provided values or fall back to source contact values
    const searchEmail = email ?? sourceContact?.email;
    const searchPhone = phone ?? sourceContact?.phone;
    const searchFirstName = firstName ?? sourceContact?.firstName;
    const searchLastName = lastName ?? sourceContact?.lastName;

    const duplicates: DuplicateContactMatch[] = [];

    // Get all contacts for comparison
    const allContacts = await ctx.db.query("contacts").collect();

    for (const contact of allContacts) {
      // Skip the source contact itself
      if (contactId && contact._id === contactId) continue;

      const matchReasons: string[] = [];
      let totalScore = 0;
      let matchCount = 0;

      // Exact email match (highest confidence)
      if (searchEmail && contact.email) {
        if (normalizeEmail(searchEmail) === normalizeEmail(contact.email)) {
          matchReasons.push("Exact email match");
          totalScore += 1.0;
          matchCount++;
        }
      }

      // Phone number match
      if (searchPhone && contact.phone) {
        const normalizedSearchPhone = normalizePhone(searchPhone);
        const normalizedContactPhone = normalizePhone(contact.phone);
        if (normalizedSearchPhone.length >= 7 && normalizedContactPhone.length >= 7) {
          // Check if one contains the other (for different country codes)
          if (
            normalizedSearchPhone.includes(normalizedContactPhone) ||
            normalizedContactPhone.includes(normalizedSearchPhone) ||
            normalizedSearchPhone === normalizedContactPhone
          ) {
            matchReasons.push("Phone number match");
            totalScore += 0.9;
            matchCount++;
          }
        }
      }

      // Name similarity
      if (searchLastName && contact.lastName) {
        const lastNameSimilarity = calculateSimilarity(
          normalizeName(searchLastName),
          normalizeName(contact.lastName)
        );

        if (lastNameSimilarity >= 0.8) {
          // Check first name too if available
          if (searchFirstName && contact.firstName) {
            const firstNameSimilarity = calculateSimilarity(
              normalizeName(searchFirstName),
              normalizeName(contact.firstName)
            );

            if (firstNameSimilarity >= 0.8) {
              matchReasons.push(`Similar name (${Math.round(((firstNameSimilarity + lastNameSimilarity) / 2) * 100)}% match)`);
              totalScore += (firstNameSimilarity + lastNameSimilarity) / 2 * 0.7;
              matchCount++;
            } else if (lastNameSimilarity === 1) {
              matchReasons.push("Same last name");
              totalScore += 0.4;
              matchCount++;
            }
          } else if (lastNameSimilarity === 1) {
            matchReasons.push("Same last name");
            totalScore += 0.5;
            matchCount++;
          }
        }
      }

      // Email domain match (if different emails but same company domain)
      if (searchEmail && contact.email && normalizeEmail(searchEmail) !== normalizeEmail(contact.email)) {
        const domain1 = extractEmailDomain(searchEmail);
        const domain2 = extractEmailDomain(contact.email);
        if (domain1 && domain2 && domain1 === domain2 && !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(domain1)) {
          matchReasons.push("Same email domain (company)");
          totalScore += 0.3;
          matchCount++;
        }
      }

      // Calculate confidence
      const confidence = matchCount > 0 ? totalScore / matchCount : 0;

      if (confidence >= minConfidence && matchReasons.length > 0) {
        // Fetch company info
        let company: Doc<"companies"> | null = null;
        if (contact.companyId) {
          company = await ctx.db.get(contact.companyId);
        }

        duplicates.push({
          contact: { ...contact, company },
          matchReasons,
          confidence,
        });
      }
    }

    // Sort by confidence descending and limit results
    return duplicates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },
});

/**
 * Find all contacts that might be duplicates of each other
 */
export const findAllContactDuplicates = query({
  args: {
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50, minConfidence = 0.7 } = args;

    const allContacts = await ctx.db.query("contacts").collect();
    const duplicateGroups: Array<{
      primary: Doc<"contacts"> & { company?: Doc<"companies"> | null };
      duplicates: DuplicateContactMatch[];
    }> = [];

    const processedIds = new Set<string>();

    for (const contact of allContacts) {
      if (processedIds.has(contact._id)) continue;

      const matches: DuplicateContactMatch[] = [];

      for (const otherContact of allContacts) {
        if (contact._id === otherContact._id || processedIds.has(otherContact._id)) continue;

        const matchReasons: string[] = [];
        let totalScore = 0;
        let matchCount = 0;

        // Exact email match
        if (contact.email && otherContact.email) {
          if (normalizeEmail(contact.email) === normalizeEmail(otherContact.email)) {
            matchReasons.push("Exact email match");
            totalScore += 1.0;
            matchCount++;
          }
        }

        // Phone match
        if (contact.phone && otherContact.phone) {
          const normalizedPhone1 = normalizePhone(contact.phone);
          const normalizedPhone2 = normalizePhone(otherContact.phone);
          if (normalizedPhone1.length >= 7 && normalizedPhone2.length >= 7) {
            if (
              normalizedPhone1.includes(normalizedPhone2) ||
              normalizedPhone2.includes(normalizedPhone1) ||
              normalizedPhone1 === normalizedPhone2
            ) {
              matchReasons.push("Phone number match");
              totalScore += 0.9;
              matchCount++;
            }
          }
        }

        // Name similarity
        if (contact.lastName && otherContact.lastName) {
          const lastNameSim = calculateSimilarity(
            normalizeName(contact.lastName),
            normalizeName(otherContact.lastName)
          );

          if (lastNameSim >= 0.9) {
            if (contact.firstName && otherContact.firstName) {
              const firstNameSim = calculateSimilarity(
                normalizeName(contact.firstName),
                normalizeName(otherContact.firstName)
              );

              if (firstNameSim >= 0.9) {
                matchReasons.push(`Very similar name`);
                totalScore += (firstNameSim + lastNameSim) / 2 * 0.8;
                matchCount++;
              }
            }
          }
        }

        const confidence = matchCount > 0 ? totalScore / matchCount : 0;

        if (confidence >= minConfidence && matchReasons.length > 0) {
          let company: Doc<"companies"> | null = null;
          if (otherContact.companyId) {
            company = await ctx.db.get(otherContact.companyId);
          }

          matches.push({
            contact: { ...otherContact, company },
            matchReasons,
            confidence,
          });

          processedIds.add(otherContact._id);
        }
      }

      if (matches.length > 0) {
        let company: Doc<"companies"> | null = null;
        if (contact.companyId) {
          company = await ctx.db.get(contact.companyId);
        }

        duplicateGroups.push({
          primary: { ...contact, company },
          duplicates: matches.sort((a, b) => b.confidence - a.confidence),
        });

        processedIds.add(contact._id);
      }
    }

    return duplicateGroups.slice(0, limit);
  },
});

// ============================================================================
// COMPANY DUPLICATE DETECTION
// ============================================================================

export interface DuplicateCompanyMatch {
  company: Doc<"companies"> & { contactCount: number };
  matchReasons: string[];
  confidence: number;
}

/**
 * Find potential duplicate companies
 */
export const findDuplicateCompanies = query({
  args: {
    companyId: v.optional(v.id("companies")),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<DuplicateCompanyMatch[]> => {
    const { companyId, name, domain, limit = 10, minConfidence = 0.5 } = args;

    // If companyId is provided, get the company's data
    let sourceCompany: Doc<"companies"> | null = null;
    if (companyId) {
      sourceCompany = await ctx.db.get(companyId);
    }

    // Use provided values or fall back to source company values
    const searchName = name ?? sourceCompany?.name;
    const searchDomain = domain ?? sourceCompany?.domain;

    const duplicates: DuplicateCompanyMatch[] = [];

    // Get all companies for comparison
    const allCompanies = await ctx.db.query("companies").collect();

    for (const company of allCompanies) {
      // Skip the source company itself
      if (companyId && company._id === companyId) continue;

      const matchReasons: string[] = [];
      let totalScore = 0;
      let matchCount = 0;

      // Exact domain match (highest confidence)
      if (searchDomain && company.domain) {
        const normalizedSearchDomain = searchDomain.toLowerCase().replace(/^www\./, "");
        const normalizedCompanyDomain = company.domain.toLowerCase().replace(/^www\./, "");

        if (normalizedSearchDomain === normalizedCompanyDomain) {
          matchReasons.push("Exact domain match");
          totalScore += 1.0;
          matchCount++;
        }
      }

      // Name similarity
      if (searchName && company.name) {
        // Normalize names for comparison
        const normalizedSearchName = normalizeName(searchName)
          .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|company|co\.?)\s*$/i, "")
          .replace(/\s*(the)\s*/i, "");
        const normalizedCompanyName = normalizeName(company.name)
          .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|company|co\.?)\s*$/i, "")
          .replace(/\s*(the)\s*/i, "");

        // Exact match after normalization
        if (normalizedSearchName === normalizedCompanyName) {
          matchReasons.push("Exact name match (normalized)");
          totalScore += 0.95;
          matchCount++;
        } else {
          const similarity = calculateSimilarity(normalizedSearchName, normalizedCompanyName);
          if (similarity >= 0.8) {
            matchReasons.push(`Similar name (${Math.round(similarity * 100)}% match)`);
            totalScore += similarity * 0.8;
            matchCount++;
          }
        }
      }

      // Website match (different from domain)
      if (sourceCompany?.website && company.website) {
        const normalizedSearchWebsite = sourceCompany.website.toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "");
        const normalizedCompanyWebsite = company.website.toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "");

        if (normalizedSearchWebsite === normalizedCompanyWebsite) {
          matchReasons.push("Same website");
          totalScore += 0.9;
          matchCount++;
        }
      }

      // Phone match
      if (sourceCompany?.phone && company.phone) {
        const normalizedPhone1 = normalizePhone(sourceCompany.phone);
        const normalizedPhone2 = normalizePhone(company.phone);
        if (normalizedPhone1.length >= 7 && normalizedPhone2.length >= 7) {
          if (normalizedPhone1 === normalizedPhone2) {
            matchReasons.push("Same phone number");
            totalScore += 0.7;
            matchCount++;
          }
        }
      }

      // Calculate confidence
      const confidence = matchCount > 0 ? totalScore / matchCount : 0;

      if (confidence >= minConfidence && matchReasons.length > 0) {
        // Get contact count
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        duplicates.push({
          company: { ...company, contactCount: contacts.length },
          matchReasons,
          confidence,
        });
      }
    }

    // Sort by confidence descending and limit results
    return duplicates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },
});

/**
 * Find all companies that might be duplicates of each other
 */
export const findAllCompanyDuplicates = query({
  args: {
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50, minConfidence = 0.7 } = args;

    const allCompanies = await ctx.db.query("companies").collect();
    const duplicateGroups: Array<{
      primary: Doc<"companies"> & { contactCount: number };
      duplicates: DuplicateCompanyMatch[];
    }> = [];

    const processedIds = new Set<string>();

    for (const company of allCompanies) {
      if (processedIds.has(company._id)) continue;

      const matches: DuplicateCompanyMatch[] = [];

      for (const otherCompany of allCompanies) {
        if (company._id === otherCompany._id || processedIds.has(otherCompany._id)) continue;

        const matchReasons: string[] = [];
        let totalScore = 0;
        let matchCount = 0;

        // Domain match
        if (company.domain && otherCompany.domain) {
          const domain1 = company.domain.toLowerCase().replace(/^www\./, "");
          const domain2 = otherCompany.domain.toLowerCase().replace(/^www\./, "");
          if (domain1 === domain2) {
            matchReasons.push("Exact domain match");
            totalScore += 1.0;
            matchCount++;
          }
        }

        // Name similarity
        if (company.name && otherCompany.name) {
          const name1 = normalizeName(company.name)
            .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|company|co\.?)\s*$/i, "");
          const name2 = normalizeName(otherCompany.name)
            .replace(/\s*(inc\.?|llc\.?|ltd\.?|corp\.?|company|co\.?)\s*$/i, "");

          if (name1 === name2) {
            matchReasons.push("Same name");
            totalScore += 0.95;
            matchCount++;
          } else {
            const similarity = calculateSimilarity(name1, name2);
            if (similarity >= 0.85) {
              matchReasons.push(`Similar name (${Math.round(similarity * 100)}%)`);
              totalScore += similarity * 0.8;
              matchCount++;
            }
          }
        }

        const confidence = matchCount > 0 ? totalScore / matchCount : 0;

        if (confidence >= minConfidence && matchReasons.length > 0) {
          const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_company", (q) => q.eq("companyId", otherCompany._id))
            .collect();

          matches.push({
            company: { ...otherCompany, contactCount: contacts.length },
            matchReasons,
            confidence,
          });

          processedIds.add(otherCompany._id);
        }
      }

      if (matches.length > 0) {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        duplicateGroups.push({
          primary: { ...company, contactCount: contacts.length },
          duplicates: matches.sort((a, b) => b.confidence - a.confidence),
        });

        processedIds.add(company._id);
      }
    }

    return duplicateGroups.slice(0, limit);
  },
});

// ============================================================================
// MERGE MUTATIONS
// ============================================================================

/**
 * Merge duplicate contacts into a primary contact
 * The primary contact is kept and updated with selected data
 * Duplicate contacts are deleted after their relationships are transferred
 */
export const mergeContacts = mutation({
  args: {
    primaryId: v.id("contacts"),
    duplicateIds: v.array(v.id("contacts")),
    mergedData: v.object({
      firstName: v.optional(v.string()),
      lastName: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      title: v.optional(v.string()),
      companyId: v.optional(v.id("companies")),
      linkedinUrl: v.optional(v.string()),
      twitterHandle: v.optional(v.string()),
      source: v.optional(v.string()),
      address: v.optional(
        v.object({
          street: v.optional(v.string()),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          postalCode: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { primaryId, duplicateIds, mergedData } = args;
    const now = Date.now();

    // Verify primary contact exists
    const primaryContact = await ctx.db.get(primaryId);
    if (!primaryContact) {
      throw new Error("Primary contact not found");
    }

    // Verify all duplicate contacts exist
    for (const dupId of duplicateIds) {
      const dupContact = await ctx.db.get(dupId);
      if (!dupContact) {
        throw new Error(`Duplicate contact ${dupId} not found`);
      }
    }

    // Update primary contact with merged data
    await ctx.db.patch(primaryId, {
      ...mergedData,
      updatedAt: now,
    });

    // Transfer relationships from duplicates to primary
    for (const dupId of duplicateIds) {
      // Transfer activities
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_related", (q) =>
          q.eq("relatedToType", "contact").eq("relatedToId", dupId)
        )
        .collect();

      for (const activity of activities) {
        await ctx.db.patch(activity._id, {
          relatedToId: primaryId,
          updatedAt: now,
        });
      }

      // Transfer conversations
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_contact", (q) => q.eq("contactId", dupId))
        .collect();

      for (const conversation of conversations) {
        await ctx.db.patch(conversation._id, {
          contactId: primaryId,
        });
      }

      // Update deals that reference this contact
      const allDeals = await ctx.db.query("deals").collect();
      for (const deal of allDeals) {
        if (deal.contactIds.includes(dupId)) {
          const newContactIds = deal.contactIds
            .filter((id) => id !== dupId)
            .concat(deal.contactIds.includes(primaryId) ? [] : [primaryId]);

          await ctx.db.patch(deal._id, {
            contactIds: newContactIds,
            updatedAt: now,
          });
        }
      }

      // Delete the duplicate contact
      await ctx.db.delete(dupId);
    }

    // Log the merge action
    await ctx.db.insert("activityLog", {
      action: "contacts_merged",
      entityType: "contact",
      entityId: primaryId,
      metadata: {
        mergedFromIds: duplicateIds,
        mergedData,
      },
      timestamp: now,
      system: true,
    });

    return primaryId;
  },
});

/**
 * Merge duplicate companies into a primary company
 * The primary company is kept and updated with selected data
 * Duplicate companies are deleted after their relationships are transferred
 */
export const mergeCompanies = mutation({
  args: {
    primaryId: v.id("companies"),
    duplicateIds: v.array(v.id("companies")),
    mergedData: v.object({
      name: v.string(),
      domain: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      industry: v.optional(v.string()),
      size: v.optional(v.string()),
      annualRevenue: v.optional(v.number()),
      description: v.optional(v.string()),
      phone: v.optional(v.string()),
      website: v.optional(v.string()),
      address: v.optional(
        v.object({
          street: v.optional(v.string()),
          city: v.optional(v.string()),
          state: v.optional(v.string()),
          postalCode: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { primaryId, duplicateIds, mergedData } = args;
    const now = Date.now();

    // Verify primary company exists
    const primaryCompany = await ctx.db.get(primaryId);
    if (!primaryCompany) {
      throw new Error("Primary company not found");
    }

    // Verify all duplicate companies exist
    for (const dupId of duplicateIds) {
      const dupCompany = await ctx.db.get(dupId);
      if (!dupCompany) {
        throw new Error(`Duplicate company ${dupId} not found`);
      }
    }

    // Update primary company with merged data
    await ctx.db.patch(primaryId, {
      ...mergedData,
      updatedAt: now,
    });

    // Transfer relationships from duplicates to primary
    for (const dupId of duplicateIds) {
      // Transfer contacts
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("companyId", dupId))
        .collect();

      for (const contact of contacts) {
        await ctx.db.patch(contact._id, {
          companyId: primaryId,
          updatedAt: now,
        });
      }

      // Transfer deals
      const deals = await ctx.db
        .query("deals")
        .withIndex("by_company", (q) => q.eq("companyId", dupId))
        .collect();

      for (const deal of deals) {
        await ctx.db.patch(deal._id, {
          companyId: primaryId,
          updatedAt: now,
        });
      }

      // Transfer activities
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_related", (q) =>
          q.eq("relatedToType", "company").eq("relatedToId", dupId)
        )
        .collect();

      for (const activity of activities) {
        await ctx.db.patch(activity._id, {
          relatedToId: primaryId,
          updatedAt: now,
        });
      }

      // Delete the duplicate company
      await ctx.db.delete(dupId);
    }

    // Log the merge action
    await ctx.db.insert("activityLog", {
      action: "companies_merged",
      entityType: "company",
      entityId: primaryId,
      metadata: {
        mergedFromIds: duplicateIds,
        mergedData,
      },
      timestamp: now,
      system: true,
    });

    return primaryId;
  },
});
