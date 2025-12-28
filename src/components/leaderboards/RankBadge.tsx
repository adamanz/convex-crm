"use client";

import { cn } from "@/lib/utils";
import { Crown, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RankBadgeProps {
  rank: number;
  previousRank?: number;
  totalParticipants?: number;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  previousRank,
  totalParticipants,
  size = "md",
  showTrend = true,
  className,
}: RankBadgeProps) {
  const rankChange = previousRank !== undefined ? previousRank - rank : 0;

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          bg: "bg-gradient-to-br from-amber-400 to-amber-600",
          text: "text-white",
          icon: <Crown className={cn(iconSizes[size])} />,
          label: "1st Place",
        };
      case 2:
        return {
          bg: "bg-gradient-to-br from-zinc-300 to-zinc-500",
          text: "text-white",
          icon: <Medal className={cn(iconSizes[size])} />,
          label: "2nd Place",
        };
      case 3:
        return {
          bg: "bg-gradient-to-br from-amber-600 to-amber-800",
          text: "text-white",
          icon: <Medal className={cn(iconSizes[size])} />,
          label: "3rd Place",
        };
      default:
        return {
          bg: "bg-zinc-100 dark:bg-zinc-800",
          text: "text-zinc-700 dark:text-zinc-300",
          icon: null,
          label: `#${rank}`,
        };
    }
  };

  const style = getRankStyle();

  const TrendIndicator = () => {
    if (!showTrend || rankChange === 0) return null;

    if (rankChange > 0) {
      return (
        <div className="flex items-center gap-0.5 text-emerald-500">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{rankChange}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-red-500">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-medium">{rankChange}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <div
              className={cn(
                "flex items-center justify-center rounded-full font-bold shadow-sm",
                sizeClasses[size],
                style.bg,
                style.text
              )}
            >
              {style.icon || rank}
            </div>
            <TrendIndicator />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{style.label}</p>
            {totalParticipants && (
              <p className="text-xs text-zinc-400">
                of {totalParticipants} participants
              </p>
            )}
            {rankChange !== 0 && (
              <p
                className={cn(
                  "text-xs mt-1",
                  rankChange > 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {rankChange > 0 ? "Up" : "Down"} {Math.abs(rankChange)} from last period
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simple rank indicator for compact displays
 */
interface RankIndicatorProps {
  rank: number;
  className?: string;
}

export function RankIndicator({ rank, className }: RankIndicatorProps) {
  if (rank === 1) {
    return <Crown className={cn("h-4 w-4 text-amber-500", className)} />;
  }
  if (rank === 2) {
    return <Medal className={cn("h-4 w-4 text-zinc-400", className)} />;
  }
  if (rank === 3) {
    return <Medal className={cn("h-4 w-4 text-amber-600", className)} />;
  }
  return (
    <span className={cn("text-xs font-medium text-zinc-500", className)}>
      #{rank}
    </span>
  );
}
