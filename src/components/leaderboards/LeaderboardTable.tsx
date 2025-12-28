"use client";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  Trophy,
  DollarSign,
  Activity,
  Phone,
  Mail,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "./RankBadge";
import { BadgeDisplay } from "./BadgeDisplay";

interface UserBadge {
  badgeType: string;
  name: string;
  icon: string;
  color: string;
}

interface LeaderboardEntry {
  _id: string;
  rank: number;
  value: number;
  previousRank?: number;
  rankChange: number;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email: string;
  } | null;
  badges: UserBadge[];
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  metric: "deals_won" | "revenue" | "activities" | "calls" | "emails" | "new_contacts";
  currentUserId?: string;
  className?: string;
}

const metricConfig = {
  deals_won: { label: "Deals Won", format: "number" as const },
  revenue: { label: "Revenue", format: "currency" as const },
  activities: { label: "Activities", format: "number" as const },
  calls: { label: "Calls", format: "number" as const },
  emails: { label: "Emails", format: "number" as const },
  new_contacts: { label: "New Contacts", format: "number" as const },
};

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || "";
  const last = lastName?.charAt(0).toUpperCase() || "";
  return first + last || "?";
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-amber-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-zinc-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
}

function getRankChangeIndicator(change: number) {
  if (change > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-500">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-medium">+{change}</span>
      </div>
    );
  } else if (change < 0) {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-medium">{change}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-zinc-400">
      <Minus className="h-3 w-3" />
    </div>
  );
}

export function LeaderboardTable({
  entries,
  metric,
  currentUserId,
  className,
}: LeaderboardTableProps) {
  const config = metricConfig[metric];

  const formatValue = (value: number) => {
    if (config.format === "currency") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Trophy className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No rankings yet</p>
        <p className="text-sm">Start competing to appear on this leaderboard!</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800", className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
        <div className="col-span-1">Rank</div>
        <div className="col-span-5">User</div>
        <div className="col-span-2">Badges</div>
        <div className="col-span-2 text-right">{config.label}</div>
        <div className="col-span-2 text-right">Trend</div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map((entry) => {
          const isCurrentUser = entry.user?._id === currentUserId;
          const isTopThree = entry.rank <= 3;

          return (
            <div
              key={entry._id}
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-4 transition-colors",
                isCurrentUser && "bg-blue-50/50 dark:bg-blue-950/20",
                isTopThree && !isCurrentUser && "bg-amber-50/30 dark:bg-amber-950/10"
              )}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank) || (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {entry.rank}
                    </span>
                  )}
                </div>
              </div>

              {/* User */}
              <div className="col-span-5 flex items-center gap-3">
                <Avatar className={cn("h-10 w-10", isTopThree && "ring-2 ring-amber-400")}>
                  <AvatarImage src={entry.user?.avatarUrl} />
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                    {getInitials(entry.user?.firstName, entry.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className={cn(
                    "font-medium text-zinc-900 dark:text-zinc-50 truncate",
                    isCurrentUser && "text-blue-600 dark:text-blue-400"
                  )}>
                    {entry.user?.firstName} {entry.user?.lastName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-500">(You)</span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {entry.user?.email}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="col-span-2 flex items-center">
                <div className="flex -space-x-1">
                  {entry.badges.slice(0, 3).map((badge, index) => (
                    <BadgeDisplay key={index} badge={badge} size="sm" showTooltip />
                  ))}
                  {entry.badges.length > 3 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      +{entry.badges.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="col-span-2 flex items-center justify-end">
                <span className={cn(
                  "text-lg font-semibold",
                  isTopThree ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"
                )}>
                  {formatValue(entry.value)}
                </span>
              </div>

              {/* Trend */}
              <div className="col-span-2 flex items-center justify-end">
                {getRankChangeIndicator(entry.rankChange)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
