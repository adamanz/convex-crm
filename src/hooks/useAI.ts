"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useState } from "react";

/**
 * Hook for AI enrichment functionality
 * Connects to Parallel.ai for real data enrichment
 */
export function useContactEnrichment(contactId: Id<"contacts">) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichmentStatus = useQuery(api.ai.getContactEnrichmentStatus, {
    contactId,
  });

  // Use the Parallel.ai action for real enrichment
  const enrichContactAction = useAction(api.parallel.enrichContact);
  // Fallback mutation for marking as pending
  const enrichContactMutation = useMutation(api.ai.enrichContact);

  const triggerEnrichment = useCallback(async () => {
    setIsEnriching(true);
    setError(null);
    try {
      // First, mark as pending
      await enrichContactMutation({ contactId });

      // Call the real Parallel.ai enrichment action
      const result = await enrichContactAction({ contactId });

      if (!result.success) {
        setError(result.error ?? "Enrichment failed");
        console.error("Enrichment failed:", result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Enrichment error:", err);
    } finally {
      setIsEnriching(false);
    }
  }, [contactId, enrichContactAction, enrichContactMutation]);

  return {
    status: enrichmentStatus?.status ?? "not_enriched",
    enrichmentData: enrichmentStatus?.enrichmentData,
    enrichedAt: enrichmentStatus?.enrichedAt,
    aiScore: enrichmentStatus?.aiScore,
    isEnriching,
    error,
    triggerEnrichment,
  };
}

/**
 * Hook for company enrichment functionality
 * Connects to Parallel.ai for real data enrichment
 */
export function useCompanyEnrichment(companyId: Id<"companies">) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichmentStatus = useQuery(api.ai.getCompanyEnrichmentStatus, {
    companyId,
  });

  // Use the Parallel.ai action for real enrichment
  const enrichCompanyAction = useAction(api.parallel.enrichCompany);
  // Fallback mutation for marking as pending
  const enrichCompanyMutation = useMutation(api.ai.enrichCompany);

  const triggerEnrichment = useCallback(async () => {
    setIsEnriching(true);
    setError(null);
    try {
      // First, mark as pending
      await enrichCompanyMutation({ companyId });

      // Call the real Parallel.ai enrichment action
      const result = await enrichCompanyAction({ companyId });

      if (!result.success) {
        setError(result.error ?? "Enrichment failed");
        console.error("Enrichment failed:", result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Enrichment error:", err);
    } finally {
      setIsEnriching(false);
    }
  }, [companyId, enrichCompanyAction, enrichCompanyMutation]);

  return {
    status: enrichmentStatus?.status ?? "not_enriched",
    enrichmentData: enrichmentStatus?.enrichmentData,
    enrichedAt: enrichmentStatus?.enrichedAt,
    isEnriching,
    error,
    triggerEnrichment,
  };
}

/**
 * Hook for AI lead scoring
 */
export function useLeadScore(contactId: Id<"contacts">) {
  const [isCalculating, setIsCalculating] = useState(false);

  const scoreData = useQuery(api.ai.getScoreFactors, { contactId });
  const calculateScore = useMutation(api.ai.calculateAIScore);

  const recalculateScore = useCallback(async () => {
    setIsCalculating(true);
    try {
      await calculateScore({ contactId });
    } finally {
      setIsCalculating(false);
    }
  }, [contactId, calculateScore]);

  // Determine trend based on recent changes
  const getTrend = (): "up" | "down" | "stable" | undefined => {
    if (!scoreData?.score) return undefined;
    // In a real implementation, you'd compare with historical scores
    // For now, return stable
    return "stable";
  };

  return {
    score: scoreData?.score ?? 0,
    factors: scoreData?.factors ?? [],
    lastCalculated: scoreData?.lastCalculated,
    trend: getTrend(),
    isCalculating,
    recalculateScore,
  };
}

/**
 * Hook for sentiment analysis
 */
export function useSentimentAnalysis(activityId: Id<"activities">) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSentiment = useMutation(api.ai.analyzeSentiment);

  const triggerAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      await analyzeSentiment({ activityId });
    } finally {
      setIsAnalyzing(false);
    }
  }, [activityId, analyzeSentiment]);

  return {
    isAnalyzing,
    triggerAnalysis,
  };
}

/**
 * Hook for deal insights
 */
export function useDealInsights(dealId: Id<"deals">) {
  const [isGenerating, setIsGenerating] = useState(false);

  const insights = useQuery(api.ai.getDealInsights, { dealId });
  const generateInsights = useMutation(api.ai.generateDealInsights);

  const refreshInsights = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateInsights({ dealId });
    } finally {
      setIsGenerating(false);
    }
  }, [dealId, generateInsights]);

  return {
    aiInsights: insights?.aiInsights,
    winProbability: insights?.winProbability ?? 50,
    isGenerating,
    refreshInsights,
  };
}

/**
 * Hook for activity suggestions
 */
export function useActivitySuggestions(contactId: Id<"contacts">) {
  const suggestions = useQuery(api.ai.generateActivitySuggestions, {
    contactId,
  });

  return {
    suggestions: suggestions ?? [],
    isLoading: suggestions === undefined,
  };
}

/**
 * Hook for AI settings
 */
export function useAISettings() {
  const settings = useQuery(api.ai.getSettings);
  const saveSettings = useMutation(api.ai.saveSettings);

  return {
    settings,
    isLoading: settings === undefined,
    saveSettings,
  };
}

/**
 * Combined hook for all AI features on a contact
 */
export function useContactAI(contactId: Id<"contacts">) {
  const enrichment = useContactEnrichment(contactId);
  const leadScore = useLeadScore(contactId);
  const suggestions = useActivitySuggestions(contactId);

  return {
    enrichment,
    leadScore,
    suggestions,
  };
}

/**
 * Combined hook for all AI features on a deal
 */
export function useDealAI(dealId: Id<"deals">) {
  const insights = useDealInsights(dealId);

  return {
    insights,
  };
}
