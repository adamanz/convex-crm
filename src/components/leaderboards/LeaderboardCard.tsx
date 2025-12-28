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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface TopUser {
  rank: number;
  value: number;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email: string;
  } | null;
}

interface LeaderboardCardProps {
  id: string;
  name: string;
  description?: string;
  metric: "deals_won" | "revenue" | "activities" | "calls" | "emails" | "new_contacts";
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "allTime";
  topUsers: TopUser[];
  isActive?: boolean;
  className?: string;
}

const metricConfig = {
  deals_won: { icon: Trophy, label: "Deals Won", format: "number" as const, color: "text-amber-500" },
  revenue: { icon: DollarSign, label: "Revenue", format: "currency" as const, color: "text-emerald-500" },
  activities: { icon: Activity, label: "Activities", format: "number" as const, color: "text-blue-500" },
  calls: { icon: Phone, label: "Calls", format: "number" as const, color: "text-purple-500" },
  emails: { icon: Mail, label: "Emails", format: "number" as const, color: "text-indigo-500" },
  new_contacts: { icon: UserPlus, label: "New Contacts", format: "number" as const, color: "text-pink-500" },
};

const periodLabels = {
  daily: "Today",
  weekly: "This Week",
  monthly: "This Month",
  quarterly: "This Quarter",
  yearly: "This Year",
  allTime: "All Time",
};

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-amber-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-zinc-400" />;
    case 3:
      return <Medal className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || "";
  const last = lastName?.charAt(0).toUpperCase() || "";
  return first + last || "?";
}

export function LeaderboardCard({
  id,
  name,
  description,
  metric,
  period,
  topUsers,
  isActive = true,
  className,
}: LeaderboardCardProps) {
  const config = metricConfig[metric];
  const Icon = config.icon;

  const formatValue = (value: number) => {
    if (config.format === "currency") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  return (
    <Link
      href={`/leaderboards/${id}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        !isActive && "opacity-60",
        className
      )}
    >
      {/* Background gradient on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-zinc-800/50" />

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800",
                config.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {periodLabels[period]}
              </p>
            </div>
          </div>
          {!isActive && (
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
              Inactive
            </span>
          )}
        </div>

        {description && (
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {description}
          </p>
        )}

        {/* Top 3 Users */}
        <div className="space-y-3">
          {topUsers.length > 0 ? (
            topUsers.map((entry, index) => (
              <div
                key={entry.user?._id || index}
                className="flex items-center gap-3"
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  {getRankBadge(entry.rank) || (
                    <span className="text-sm font-medium text-zinc-400">
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.user?.avatarUrl} />
                  <AvatarFallback className="bg-zinc-100 text-xs dark:bg-zinc-800">
                    {getInitials(entry.user?.firstName, entry.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {entry.user?.firstName} {entry.user?.lastName}
                  </p>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatValue(entry.value)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-zinc-400 py-4">
              No rankings yet
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300">
            View full leaderboard
          </span>
        </div>
      </div>
    </Link>
  );
}
