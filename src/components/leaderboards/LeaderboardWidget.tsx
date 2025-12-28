"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronRight, Crown, Medal, Award } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

interface LeaderboardWidgetProps {
  currentUserId?: Id<"users">;
  className?: string;
}

export function LeaderboardWidget({
  currentUserId,
  className,
}: LeaderboardWidgetProps) {
  // Get the first active leaderboard
  const leaderboards = useQuery(api.leaderboards.listLeaderboards, {
    isActive: true,
  });

  if (leaderboards === undefined) {
    return <LeaderboardWidgetSkeleton className={className} />;
  }

  // Show the first leaderboard if available
  const leaderboard = leaderboards[0];

  if (!leaderboard) {
    return (
      <div
        className={cn(
          "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          className
        )}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Leaderboard
              </h3>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <Trophy className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No active leaderboards</p>
          <Link
            href="/leaderboards"
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Create one
          </Link>
        </div>
      </div>
    );
  }

  const metricConfig: Record<string, { label: string; format: "number" | "currency" }> = {
    deals_won: { label: "Deals", format: "number" },
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-zinc-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-700" />;
      default:
        return (
          <span className="text-xs font-medium text-zinc-500 w-4 text-center">
            {rank}
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {leaderboard.name}
            </h3>
          </div>
          <Link
            href="/leaderboards"
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="p-3">
        {/* Top Rankings */}
        <div className="space-y-2">
          {leaderboard.topUsers.slice(0, 5).map((entry, index) => {
            const isCurrentUser = currentUserId && entry.user?._id === currentUserId;
            return (
              <div
                key={entry.user?._id || index}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isCurrentUser
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-6">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isCurrentUser
                        ? "text-amber-900 dark:text-amber-100"
                        : "text-zinc-900 dark:text-zinc-50"
                    )}
                  >
                    {entry.user?.firstName} {entry.user?.lastName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                        (You)
                      </span>
                    )}
                  </p>
                </div>

                {/* Value */}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    entry.rank === 1
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {formatValue(entry.value)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Period indicator */}
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 text-center">
            {leaderboard.period === "daily" && "Today's standings"}
            {leaderboard.period === "weekly" && "This week's standings"}
            {leaderboard.period === "monthly" && "This month's standings"}
            {leaderboard.period === "quarterly" && "This quarter's standings"}
            {leaderboard.period === "yearly" && "This year's standings"}
            {leaderboard.period === "allTime" && "All-time standings"}
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="p-3 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact leaderboard widget showing just the top 3
 */
interface CompactLeaderboardWidgetProps {
  className?: string;
}

export function CompactLeaderboardWidget({
  className,
}: CompactLeaderboardWidgetProps) {
  const leaderboards = useQuery(api.leaderboards.listLeaderboards, {
    isActive: true,
  });

  if (leaderboards === undefined) {
    return <Skeleton className={cn("h-12 w-48", className)} />;
  }

  const leaderboard = leaderboards[0];

  if (!leaderboard || leaderboard.topUsers.length === 0) {
    return null;
  }

  return (
    <Link
      href="/leaderboards"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        className
      )}
    >
      <Trophy className="h-5 w-5 text-amber-500" />
      <div className="flex items-center gap-2">
        {leaderboard.topUsers.slice(0, 3).map((entry, i) => (
          <div
            key={entry.user?._id || i}
            className="flex items-center gap-1"
          >
            {i === 0 && <Crown className="h-3 w-3 text-amber-500" />}
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {entry.user?.firstName?.[0]}
              {entry.user?.lastName?.[0]}
            </span>
          </div>
        ))}
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400 ml-auto" />
    </Link>
  );
}
