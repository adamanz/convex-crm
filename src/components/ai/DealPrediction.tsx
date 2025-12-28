"use client";

import { cn } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";

interface PredictionFactor {
  label: string;
  impact: "positive" | "negative";
  description?: string;
}

interface DealPredictionProps {
  probability: number;
  confidence?: "low" | "medium" | "high";
  expectedCloseDate?: Date | number;
  positiveFactors?: PredictionFactor[];
  negativeFactors?: PredictionFactor[];
  previousProbability?: number;
  className?: string;
}

function getProbabilityColor(probability: number): string {
  if (probability >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (probability >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function getProbabilityBackground(probability: number): string {
  if (probability >= 70) return "bg-emerald-500";
  if (probability >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getConfidenceLabel(confidence: "low" | "medium" | "high"): {
  label: string;
  color: string;
} {
  switch (confidence) {
    case "high":
      return {
        label: "High confidence",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    case "medium":
      return {
        label: "Medium confidence",
        color: "text-amber-600 dark:text-amber-400",
      };
    case "low":
      return {
        label: "Low confidence",
        color: "text-zinc-500 dark:text-zinc-400",
      };
  }
}

export function DealPrediction({
  probability,
  confidence = "medium",
  expectedCloseDate,
  positiveFactors = [],
  negativeFactors = [],
  previousProbability,
  className,
}: DealPredictionProps) {
  const probabilityChange = previousProbability
    ? probability - previousProbability
    : null;
  const confidenceInfo = getConfidenceLabel(confidence);

  // Calculate ring progress
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Win Probability
        </span>
      </div>

      {/* Probability Ring */}
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-zinc-100 dark:text-zinc-800"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(
                "transition-all duration-700",
                getProbabilityBackground(probability).replace("bg-", "text-")
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "text-2xl font-semibold",
                getProbabilityColor(probability)
              )}
            >
              {probability}%
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {/* Confidence */}
          <div className="flex items-center gap-1.5">
            {confidence === "high" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {confidence === "medium" && (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            )}
            {confidence === "low" && (
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className={cn("text-xs font-medium", confidenceInfo.color)}>
              {confidenceInfo.label}
            </span>
          </div>

          {/* Change */}
          {probabilityChange !== null && (
            <div className="flex items-center gap-1">
              {probabilityChange > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : probabilityChange < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              ) : null}
              <span
                className={cn(
                  "text-xs",
                  probabilityChange > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : probabilityChange < 0
                      ? "text-red-500 dark:text-red-400"
                      : "text-zinc-500"
                )}
              >
                {probabilityChange > 0 && "+"}
                {probabilityChange}% vs last week
              </span>
            </div>
          )}

          {/* Expected Close */}
          {expectedCloseDate && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Expected close:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {new Date(expectedCloseDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Factors */}
      {(positiveFactors.length > 0 || negativeFactors.length > 0) && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {/* Positive Factors */}
          {positiveFactors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Positive Signals
              </span>
              {positiveFactors.slice(0, 2).map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-950/50"
                >
                  <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-500" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    {factor.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Negative Factors */}
          {negativeFactors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-red-500 dark:text-red-400">
                Risk Factors
              </span>
              {negativeFactors.slice(0, 2).map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-md bg-red-50 px-2.5 py-1.5 dark:bg-red-950/50"
                >
                  <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                  <span className="text-xs text-red-700 dark:text-red-300">
                    {factor.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Details Link */}
      <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
        View Analysis
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
