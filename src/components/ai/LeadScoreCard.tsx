"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Sparkles, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreFactor {
  label: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
}

interface LeadScoreCardProps {
  score: number;
  maxScore?: number;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  factors?: ScoreFactor[];
  lastUpdated?: Date | number;
  className?: string;
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (percentage >= 60) return "text-blue-600 dark:text-blue-400";
  if (percentage >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-zinc-500 dark:text-zinc-400";
}

function getScoreBackground(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-zinc-400";
}

function getScoreLabel(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "Hot";
  if (percentage >= 60) return "Warm";
  if (percentage >= 40) return "Neutral";
  return "Cold";
}

export function LeadScoreCard({
  score,
  maxScore = 100,
  trend,
  trendValue,
  factors = [],
  lastUpdated,
  className,
}: LeadScoreCardProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const scoreLabel = getScoreLabel(score, maxScore);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Lead Score
          </span>
        </div>
        {factors.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">Score calculated from engagement, profile completeness, and activity patterns.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Score Display */}
      <div className="mt-4 flex items-end gap-3">
        <span
          className={cn(
            "text-4xl font-semibold tracking-tight",
            getScoreColor(score, maxScore)
          )}
        >
          {score}
        </span>
        <span className="mb-1 text-sm text-zinc-400 dark:text-zinc-500">
          / {maxScore}
        </span>
        <div className="mb-1 ml-auto flex items-center gap-1">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              percentage >= 80
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : percentage >= 60
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                  : percentage >= 40
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getScoreBackground(score, maxScore)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Trend */}
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : trend === "down"
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-400"
            )}
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {trend === "up" && trendValue && `+${trendValue} pts this week`}
            {trend === "down" && trendValue && `-${trendValue} pts this week`}
            {trend === "stable" && "Stable this week"}
          </span>
        </div>
      )}

      {/* Factors */}
      {factors.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Key Factors
          </span>
          <div className="space-y-1.5">
            {factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">
                  {factor.label}
                </span>
                <div className="flex items-center gap-1">
                  {factor.impact === "positive" && (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  )}
                  {factor.impact === "negative" && (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {factor.impact === "neutral" && (
                    <Minus className="h-3 w-3 text-zinc-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      factor.impact === "positive"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : factor.impact === "negative"
                          ? "text-red-500 dark:text-red-400"
                          : "text-zinc-400"
                    )}
                  >
                    {factor.impact === "positive" && "+"}
                    {factor.impact === "negative" && "-"}
                    {factor.weight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 text-[10px] text-zinc-400 dark:text-zinc-500">
          Updated{" "}
          {new Date(lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
