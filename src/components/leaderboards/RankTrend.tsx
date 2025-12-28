"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface RankTrendProps {
  leaderboardId: Id<"leaderboards">;
  userId: Id<"users">;
  periods?: number;
  className?: string;
}

export function RankTrend({
  leaderboardId,
  userId,
  periods = 6,
  className,
}: RankTrendProps) {
  const history = useQuery(api.leaderboards.getLeaderboardHistory, {
    leaderboardId,
    userId,
    periods,
  });

  if (history === undefined) {
    return <RankTrendSkeleton className={className} />;
  }

  if (!history || history.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-zinc-400",
          className
        )}
      >
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-sm">No trend data yet</p>
      </div>
    );
  }

  // Reverse to show oldest first
  const data = [...history].reverse();

  // Calculate min and max for scaling
  const ranks = data.map((d) => d.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const range = maxRank - minRank || 1;

  // Calculate overall trend
  const firstRank = data[0]?.rank ?? 0;
  const lastRank = data[data.length - 1]?.rank ?? 0;
  const overallChange = firstRank - lastRank;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Trend Summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Rank History
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            overallChange > 0
              ? "text-emerald-500"
              : overallChange < 0
                ? "text-red-500"
                : "text-zinc-400"
          )}
        >
          {overallChange > 0 ? (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>+{overallChange} positions</span>
            </>
          ) : overallChange < 0 ? (
            <>
              <TrendingDown className="h-4 w-4" />
              <span>{overallChange} positions</span>
            </>
          ) : (
            <>
              <Minus className="h-4 w-4" />
              <span>No change</span>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-24">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border-b border-dashed border-zinc-100 dark:border-zinc-800"
            />
          ))}
        </div>

        {/* Line chart */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rankGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                className={
                  overallChange >= 0 ? "text-emerald-500" : "text-red-500"
                }
                style={{ stopColor: "currentColor", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                className={
                  overallChange >= 0 ? "text-emerald-500" : "text-red-500"
                }
                style={{ stopColor: "currentColor", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`
              M 0 ${((data[0]?.rank - minRank) / range) * 100}
              ${data
                .map((point, i) => {
                  const x = (i / (data.length - 1)) * 100;
                  const y = ((point.rank - minRank) / range) * 100;
                  return `L ${x} ${y}`;
                })
                .join(" ")}
              L 100 100
              L 0 100
              Z
            `}
            fill="url(#rankGradient)"
            vectorEffect="non-scaling-stroke"
          />

          {/* Line */}
          <path
            d={`
              M 0 ${((data[0]?.rank - minRank) / range) * 100}
              ${data
                .map((point, i) => {
                  const x = (i / (data.length - 1)) * 100;
                  const y = ((point.rank - minRank) / range) * 100;
                  return `L ${x} ${y}`;
                })
                .join(" ")}
            `}
            fill="none"
            stroke={overallChange >= 0 ? "#22c55e" : "#ef4444"}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Points */}
          {data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((point.rank - minRank) / range) * 100;
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="white"
                stroke={overallChange >= 0 ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-zinc-400">
        {data.map((point, i) => (
          <div key={i} className="text-center">
            <div className="font-medium text-zinc-600 dark:text-zinc-300">
              #{point.rank}
            </div>
            <div className="text-[10px]">
              {new Date(point.periodStart).toLocaleDateString("en-US", {
                month: "short",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankTrendSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex justify-between">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
  );
}

/**
 * Mini sparkline version for compact displays
 */
interface RankSparklineProps {
  leaderboardId: Id<"leaderboards">;
  userId: Id<"users">;
  className?: string;
}

export function RankSparkline({
  leaderboardId,
  userId,
  className,
}: RankSparklineProps) {
  const history = useQuery(api.leaderboards.getLeaderboardHistory, {
    leaderboardId,
    userId,
    periods: 6,
  });

  if (history === undefined) {
    return <Skeleton className={cn("h-6 w-16", className)} />;
  }

  if (!history || history.length < 2) {
    return <Minus className={cn("h-4 w-4 text-zinc-400", className)} />;
  }

  const data = [...history].reverse();
  const ranks = data.map((d) => d.rank);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const range = maxRank - minRank || 1;

  const firstRank = data[0]?.rank ?? 0;
  const lastRank = data[data.length - 1]?.rank ?? 0;
  const isPositive = lastRank <= firstRank;

  return (
    <svg
      className={cn("h-6 w-16", className)}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
    >
      <path
        d={`
          M 0 ${(((data[0]?.rank ?? 0) - minRank) / range) * 24}
          ${data
            .map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = ((point.rank - minRank) / range) * 24;
              return `L ${x} ${y}`;
            })
            .join(" ")}
        `}
        fill="none"
        stroke={isPositive ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
