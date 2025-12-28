"use client";

import { cn } from "@/lib/utils";
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Sentiment = "positive" | "neutral" | "negative" | "mixed";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  trend?: "improving" | "declining" | "stable";
  messageCount?: number;
  lastAnalyzed?: Date | number;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sentimentConfig: Record<
  Sentiment,
  {
    icon: typeof Smile;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  positive: {
    icon: Smile,
    label: "Positive",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    borderColor: "border-emerald-200 dark:border-emerald-900",
  },
  neutral: {
    icon: Meh,
    label: "Neutral",
    color: "text-zinc-500 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    borderColor: "border-zinc-200 dark:border-zinc-700",
  },
  negative: {
    icon: Frown,
    label: "Negative",
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-900",
  },
  mixed: {
    icon: Meh,
    label: "Mixed",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-200 dark:border-amber-900",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-1",
    icon: "h-3 w-3",
    text: "text-xs",
    gap: "gap-1",
  },
  md: {
    container: "px-2.5 py-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
    gap: "gap-1.5",
  },
  lg: {
    container: "px-3 py-2",
    icon: "h-4 w-4",
    text: "text-sm",
    gap: "gap-2",
  },
};

export function SentimentBadge({
  sentiment,
  score,
  trend,
  messageCount,
  lastAnalyzed,
  showDetails = false,
  size = "md",
  className,
}: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const TrendIcon =
    trend === "improving"
      ? TrendingUp
      : trend === "declining"
        ? TrendingDown
        : Minus;

  // Simple badge without details
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center rounded-md border font-medium",
                sizeStyles.container,
                sizeStyles.gap,
                config.bgColor,
                config.borderColor,
                className
              )}
            >
              <Icon className={cn(sizeStyles.icon, config.color)} />
              <span className={cn(sizeStyles.text, config.color)}>
                {config.label}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-xs font-medium">{config.label} Sentiment</p>
              {score !== undefined && (
                <p className="text-xs text-zinc-400">Score: {score}/100</p>
              )}
              {messageCount !== undefined && (
                <p className="text-xs text-zinc-400">
                  Based on {messageCount} messages
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed card view
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sentiment Analysis
            </span>
            <div className="flex items-center gap-1">
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
              {score !== undefined && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  ({score}/100)
                </span>
              )}
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                AI analyzes conversation tone and language patterns to determine
                overall sentiment.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Score Bar */}
      {score !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Sentiment Score
            </span>
            <span className={cn("font-medium", config.color)}>{score}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                sentiment === "positive" && "bg-emerald-500",
                sentiment === "neutral" && "bg-zinc-400",
                sentiment === "negative" && "bg-red-500",
                sentiment === "mixed" && "bg-amber-500"
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Trend and Message Count */}
      <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {trend && (
          <div className="flex items-center gap-1.5">
            <TrendIcon
              className={cn(
                "h-3.5 w-3.5",
                trend === "improving"
                  ? "text-emerald-500"
                  : trend === "declining"
                    ? "text-red-500"
                    : "text-zinc-400"
              )}
            />
            <span
              className={cn(
                "text-xs",
                trend === "improving"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : trend === "declining"
                    ? "text-red-500 dark:text-red-400"
                    : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {trend === "improving" && "Improving"}
              {trend === "declining" && "Declining"}
              {trend === "stable" && "Stable"}
            </span>
          </div>
        )}

        {messageCount !== undefined && (
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {messageCount} messages analyzed
            </span>
          </div>
        )}
      </div>

      {/* Last Analyzed */}
      {lastAnalyzed && (
        <div className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
          Last analyzed{" "}
          {new Date(lastAnalyzed).toLocaleDateString("en-US", {
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

// Compact inline version for use in lists/tables
export function SentimentIndicator({
  sentiment,
  className,
}: {
  sentiment: Sentiment;
  className?: string;
}) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              config.bgColor,
              className
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.label} sentiment</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
