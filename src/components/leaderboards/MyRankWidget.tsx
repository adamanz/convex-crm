"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { RankBadge } from "./RankBadge";
import { BadgeList } from "./BadgeDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

interface MyRankWidgetProps {
  leaderboardId: Id<"leaderboards">;
  userId: Id<"users">;
  className?: string;
}

export function MyRankWidget({
  leaderboardId,
  userId,
  className,
}: MyRankWidgetProps) {
  const myRank = useQuery(api.leaderboards.getMyRank, {
    leaderboardId,
    userId,
  });

  const leaderboard = useQuery(api.leaderboards.getLeaderboard, {
    id: leaderboardId,
    limit: 1,
  });

  if (myRank === undefined || leaderboard === undefined) {
    return <MyRankWidgetSkeleton className={className} />;
  }

  if (!leaderboard) {
    return null;
  }

  const metricConfig: Record<string, { label: string; format: "number" | "currency" }> = {
    deals_won: { label: "Deals Won", format: "number" },
    revenue: { label: "Revenue", format: "currency" },
    activities: { label: "Activities", format: "number" },
    calls: { label: "Calls", format: "number" },
    emails: { label: "Emails", format: "number" },
    new_contacts: { label: "Contacts", format: "number" },
  };

  const config = metricConfig[leaderboard.metric] || { label: "Value", format: "number" };

  const formatValue = (value: number) => {
    if (config.format === "currency") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  if (!myRank) {
    return (
      <Link
        href={`/leaderboards/${leaderboardId}`}
        className={cn(
          "block rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Trophy className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {leaderboard.name}
            </p>
            <p className="text-xs text-zinc-500">Not yet ranked</p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/leaderboards/${leaderboardId}`}
      className={cn(
        "block rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <RankBadge
          rank={myRank.rank}
          previousRank={myRank.previousRank}
          totalParticipants={myRank.totalParticipants}
          size="md"
          showTrend={false}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
            {leaderboard.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatValue(myRank.value)}
            </span>
            <span className="text-xs text-zinc-500">{config.label}</span>
          </div>
        </div>

        {/* Trend */}
        <div className="flex flex-col items-end">
          {myRank.rankChange > 0 ? (
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+{myRank.rankChange}</span>
            </div>
          ) : myRank.rankChange < 0 ? (
            <div className="flex items-center gap-1 text-red-500">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">{myRank.rankChange}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400">
              <Minus className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs text-zinc-400 mt-1">
            of {myRank.totalParticipants}
          </span>
        </div>
      </div>

      {/* Badges */}
      {myRank.badges && myRank.badges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <BadgeList badges={myRank.badges} maxDisplay={4} size="sm" />
        </div>
      )}
    </Link>
  );
}

function MyRankWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  );
}

/**
 * Compact version for dashboard widgets
 */
interface CompactRankWidgetProps {
  leaderboardId: Id<"leaderboards">;
  userId: Id<"users">;
  className?: string;
}

export function CompactRankWidget({
  leaderboardId,
  userId,
  className,
}: CompactRankWidgetProps) {
  const myRank = useQuery(api.leaderboards.getMyRank, {
    leaderboardId,
    userId,
  });

  if (myRank === undefined) {
    return <Skeleton className={cn("h-8 w-20", className)} />;
  }

  if (!myRank) {
    return (
      <span className={cn("text-sm text-zinc-400", className)}>Not ranked</span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RankBadge rank={myRank.rank} size="sm" showTrend={false} />
      {myRank.rankChange !== 0 && (
        <span
          className={cn(
            "text-xs font-medium",
            myRank.rankChange > 0 ? "text-emerald-500" : "text-red-500"
          )}
        >
          {myRank.rankChange > 0 ? "+" : ""}
          {myRank.rankChange}
        </span>
      )}
    </div>
  );
}
