"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface LeaderboardWidgetProps {
  data: {
    entries: Array<{
      userId: string;
      name: string;
      value: number;
      avatarUrl?: string;
    }>;
  };
  config: Record<string, unknown>;
}

export function LeaderboardWidget({ data, config }: LeaderboardWidgetProps) {
  const { entries } = data;
  const { leaderboardType } = config;

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
        No leaderboard data available
      </div>
    );
  }

  // Format value based on leaderboard type
  const formatValue = (value: number): string => {
    if (leaderboardType === "deals_value") {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  // Get medal color for top 3
  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-zinc-400";
      case 3:
        return "text-amber-600";
      default:
        return "text-zinc-300";
    }
  };

  // Get label for leaderboard type
  const getValueLabel = (): string => {
    switch (leaderboardType) {
      case "deals_won":
        return "Deals Won";
      case "deals_value":
        return "Revenue";
      case "activities":
        return "Activities";
      case "contacts_added":
        return "Contacts";
      default:
        return "Score";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Rank
        </span>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {getValueLabel()}
        </span>
      </div>

      {/* Entries */}
      <div className="flex-1 space-y-2 overflow-auto">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isTopThree
                  ? "bg-zinc-50 dark:bg-zinc-800/50"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">
                {isTopThree ? (
                  <Trophy className={`h-5 w-5 ${getMedalColor(rank)}`} />
                ) : (
                  <span className="text-sm font-medium text-zinc-500">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {entry.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    isTopThree
                      ? "font-semibold text-zinc-900 dark:text-zinc-100"
                      : "font-medium text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {entry.name}
                </p>
              </div>

              {/* Value */}
              <div className="text-right">
                <span
                  className={`text-sm tabular-nums ${
                    isTopThree
                      ? "font-bold text-zinc-900 dark:text-zinc-100"
                      : "font-medium text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {formatValue(entry.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
