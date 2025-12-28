"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { useLeadScore } from "@/hooks/useAI";
import { LeadScoreCard } from "./LeadScoreCard";

interface ConnectedLeadScoreCardProps {
  contactId: Id<"contacts">;
  className?: string;
}

/**
 * Connected LeadScoreCard component that fetches data and handles mutations
 */
export function ConnectedLeadScoreCard({
  contactId,
  className,
}: ConnectedLeadScoreCardProps) {
  const {
    score,
    factors,
    lastCalculated,
    trend,
    isCalculating,
    recalculateScore,
  } = useLeadScore(contactId);

  return (
    <LeadScoreCard
      score={score}
      maxScore={100}
      trend={trend}
      factors={factors}
      lastUpdated={lastCalculated}
      className={className}
    />
  );
}
