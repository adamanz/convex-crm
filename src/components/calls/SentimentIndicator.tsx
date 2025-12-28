"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Smile,
  Meh,
  Frown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type SentimentType = "positive" | "neutral" | "negative" | "mixed";

interface SentimentIndicatorProps {
  sentiment: SentimentType | null;
  score?: number; // -1 to 1 scale
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "icon" | "full";
  className?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const sentimentConfig: Record<
  SentimentType,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  positive: {
    icon: <Smile className="h-4 w-4" />,
    label: "Positive",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "The call had a positive tone overall",
  },
  neutral: {
    icon: <Meh className="h-4 w-4" />,
    label: "Neutral",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800/50",
    description: "The call had a neutral or balanced tone",
  },
  negative: {
    icon: <Frown className="h-4 w-4" />,
    label: "Negative",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "The call had a negative tone overall",
  },
  mixed: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Mixed",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "The call had mixed sentiments throughout",
  },
};

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

// =============================================================================
// Score Bar Component
// =============================================================================

interface ScoreBarProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function ScoreBar({ score, size = "md" }: ScoreBarProps) {
  // Convert -1 to 1 scale to 0 to 100 percentage
  const percentage = ((score + 1) / 2) * 100;

  const barHeights = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "w-full rounded-full bg-gradient-to-r from-red-200 via-slate-200 to-emerald-200",
          "dark:from-red-900/50 dark:via-slate-700 dark:to-emerald-900/50",
          barHeights[size]
        )}
      >
        <div
          className="relative h-full"
          style={{ width: "100%" }}
        >
          {/* Indicator dot */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
              "rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
              size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-4 w-4",
              score > 0.3
                ? "bg-emerald-500"
                : score < -0.3
                  ? "bg-red-500"
                  : "bg-slate-500"
            )}
            style={{ left: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Negative</span>
        <span className="text-[10px] text-muted-foreground">Positive</span>
      </div>
    </div>
  );
}

// =============================================================================
// Trend Indicator
// =============================================================================

interface TrendIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function TrendIndicator({ score, size = "md" }: TrendIndicatorProps) {
  const iconClass = iconSizeClasses[size];

  if (score > 0.3) {
    return (
      <TrendingUp className={cn(iconClass, "text-emerald-500")} />
    );
  } else if (score < -0.3) {
    return (
      <TrendingDown className={cn(iconClass, "text-red-500")} />
    );
  }
  return <Minus className={cn(iconClass, "text-slate-500")} />;
}

// =============================================================================
// Main Component
// =============================================================================

export function SentimentIndicator({
  sentiment,
  score,
  showLabel = true,
  size = "md",
  variant = "badge",
  className,
}: SentimentIndicatorProps) {
  // No sentiment available
  if (!sentiment) {
    return (
      <Badge
        variant="outline"
        className={cn("text-muted-foreground", sizeClasses[size], className)}
      >
        <Meh className={cn(iconSizeClasses[size], "mr-1 opacity-50")} />
        {showLabel && "No sentiment data"}
      </Badge>
    );
  }

  const config = sentimentConfig[sentiment];

  // Icon-only variant
  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center justify-center rounded-full p-1.5",
                config.bgColor,
                config.color,
                className
              )}
            >
              {React.cloneElement(config.icon as React.ReactElement, {
                className: iconSizeClasses[size],
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{config.label} Sentiment</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {score !== undefined && (
              <p className="text-xs mt-1">
                Score: {score > 0 ? "+" : ""}
                {(score * 100).toFixed(0)}%
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant
  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 transition-colors",
                config.bgColor,
                config.color,
                sizeClasses[size],
                className
              )}
            >
              {React.cloneElement(config.icon as React.ReactElement, {
                className: iconSizeClasses[size],
              })}
              {showLabel && config.label}
              {score !== undefined && (
                <TrendIndicator score={score} size={size} />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
            {score !== undefined && (
              <p className="text-xs mt-1">
                Score: {score > 0 ? "+" : ""}
                {(score * 100).toFixed(0)}%
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant with score bar
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className={cn(
            "gap-1",
            config.bgColor,
            config.color,
            sizeClasses[size]
          )}
        >
          {React.cloneElement(config.icon as React.ReactElement, {
            className: iconSizeClasses[size],
          })}
          {config.label}
        </Badge>
        {score !== undefined && (
          <span className={cn("font-medium", config.color, sizeClasses[size])}>
            {score > 0 ? "+" : ""}
            {(score * 100).toFixed(0)}%
          </span>
        )}
      </div>
      {score !== undefined && <ScoreBar score={score} size={size} />}
      <p className="text-xs text-muted-foreground">{config.description}</p>
    </div>
  );
}

// =============================================================================
// Compact Summary Component (for list views)
// =============================================================================

interface SentimentSummaryProps {
  sentiment: SentimentType | null;
  score?: number;
  className?: string;
}

export function SentimentSummary({
  sentiment,
  score,
  className,
}: SentimentSummaryProps) {
  if (!sentiment) return null;

  const config = sentimentConfig[sentiment];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          sentiment === "positive" && "bg-emerald-500",
          sentiment === "neutral" && "bg-slate-400",
          sentiment === "negative" && "bg-red-500",
          sentiment === "mixed" && "bg-amber-500"
        )}
      />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}

export default SentimentIndicator;
