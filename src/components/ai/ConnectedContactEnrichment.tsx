"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { useContactEnrichment } from "@/hooks/useAI";
import { ContactEnrichment } from "./ContactEnrichment";

interface ConnectedContactEnrichmentProps {
  contactId: Id<"contacts">;
  className?: string;
}

/**
 * Connected ContactEnrichment component that fetches data and handles mutations
 */
export function ConnectedContactEnrichment({
  contactId,
  className,
}: ConnectedContactEnrichmentProps) {
  const {
    status,
    enrichmentData,
    enrichedAt,
    isEnriching,
    triggerEnrichment,
  } = useContactEnrichment(contactId);

  // Transform enrichment data to match component expected format
  const formattedData = enrichmentData
    ? {
        company: enrichmentData.company
          ? {
              name: enrichmentData.company.name,
              industry: enrichmentData.company.industry,
              size: enrichmentData.company.size,
              website: enrichmentData.company.website,
            }
          : undefined,
        title: enrichmentData.title,
        location: enrichmentData.location,
        linkedinUrl: enrichmentData.linkedinUrl,
        twitterHandle: enrichmentData.twitterHandle,
        bio: enrichmentData.bio,
        skills: enrichmentData.skills,
      }
    : {
        // Empty data object for non-enriched contacts
      };

  // Determine status for display
  const displayStatus =
    status === "enriched"
      ? "enriched"
      : isEnriching || status === "pending"
        ? "pending"
        : enrichmentData?.status === "failed"
          ? "failed"
          : "stale";

  return (
    <ContactEnrichment
      data={formattedData}
      status={displayStatus}
      lastEnriched={enrichedAt}
      confidence={enrichmentData?.confidence}
      onRefresh={triggerEnrichment}
      isRefreshing={isEnriching}
      className={className}
    />
  );
}
