"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useState } from "react";

/**
 * Hook for AI enrichment functionality
 */
export function useContactEnrichment(contactId: Id<"contacts">) {
  const [isEnriching, setIsEnriching] = useState(false);

  const enrichmentStatus = useQuery(api.ai.getContactEnrichmentStatus, {
    contactId,
  });

  const enrichContact = useMutation(api.ai.enrichContact);

  const triggerEnrichment = useCallback(async () => {
    setIsEnriching(true);
    try {
      // First, mark as pending
      await enrichContact({ contactId });

      // In a real implementation, this would trigger an external API call
      // For now, we'll simulate enrichment with placeholder data
      const mockEnrichmentData = {
        title: "Software Engineer",
        location: "San Francisco, CA",
        bio: "Experienced professional with expertise in technology.",
        skills: ["JavaScript", "TypeScript", "React", "Node.js"],
        company: {
          name: "Tech Corp",
          industry: "Technology",
          size: "50-200",
        },
        confidence: 85,
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update with enrichment data
      await enrichContact({
        contactId,
        enrichmentData: mockEnrichmentData,
      });
    } finally {
      setIsEnriching(false);
    }
  }, [contactId, enrichContact]);

  return {
    status: enrichmentStatus?.status ?? "not_enriched",
    enrichmentData: enrichmentStatus?.enrichmentData,
    enrichedAt: enrichmentStatus?.enrichedAt,
    aiScore: enrichmentStatus?.aiScore,
    isEnriching,
    triggerEnrichment,
  };
}

/**
 * Hook for company enrichment functionality
 */
export function useCompanyEnrichment(companyId: Id<"companies">) {
  const [isEnriching, setIsEnriching] = useState(false);

  const enrichmentStatus = useQuery(api.ai.getCompanyEnrichmentStatus, {
    companyId,
  });

  const enrichCompany = useMutation(api.ai.enrichCompany);

  const triggerEnrichment = useCallback(async () => {
    setIsEnriching(true);
    try {
      await enrichCompany({ companyId });

      // Placeholder enrichment data
      const mockEnrichmentData = {
        description: "A leading technology company focused on innovation.",
        industry: "Technology",
        size: "100-500",
        employeeCount: 250,
        founded: 2015,
        headquarters: "San Francisco, CA",
        funding: "$50M Series B",
        technologies: ["React", "Node.js", "AWS"],
        keywords: ["SaaS", "Enterprise", "Cloud"],
        confidence: 90,
      };

      await new Promise((resolve) => setTimeout(resolve, 1500));

      await enrichCompany({
        companyId,
        enrichmentData: mockEnrichmentData,
      });
    } finally {
      setIsEnriching(false);
    }
  }, [companyId, enrichCompany]);

  return {
    status: enrichmentStatus?.status ?? "not_enriched",
    enrichmentData: enrichmentStatus?.enrichmentData,
    enrichedAt: enrichmentStatus?.enrichedAt,
    isEnriching,
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
