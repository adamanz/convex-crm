"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { useDealInsights } from "@/hooks/useAI";
import { DealPrediction } from "./DealPrediction";

interface ConnectedDealPredictionProps {
  dealId: Id<"deals">;
  expectedCloseDate?: number;
  className?: string;
}

/**
 * Connected DealPrediction component that fetches AI insights
 */
export function ConnectedDealPrediction({
  dealId,
  expectedCloseDate,
  className,
}: ConnectedDealPredictionProps) {
  const { aiInsights, winProbability, isGenerating, refreshInsights } =
    useDealInsights(dealId);

  // Extract factors from insights
  const positiveFactors = aiInsights?.positiveFactors?.map(
    (label: string, index: number) => ({
      label,
      impact: "positive" as const,
    })
  ) ?? [];

  const negativeFactors = aiInsights?.negativeFactors?.map(
    (label: string, index: number) => ({
      label,
      impact: "negative" as const,
    })
  ) ?? [];

  // Determine confidence based on available data
  const getConfidence = (): "low" | "medium" | "high" => {
    if (!aiInsights) return "low";
    const totalFactors = positiveFactors.length + negativeFactors.length;
    if (totalFactors >= 4) return "high";
    if (totalFactors >= 2) return "medium";
    return "low";
  };

  return (
    <DealPrediction
      probability={winProbability}
      confidence={getConfidence()}
      expectedCloseDate={expectedCloseDate}
      positiveFactors={positiveFactors}
      negativeFactors={negativeFactors}
      className={className}
    />
  );
}
