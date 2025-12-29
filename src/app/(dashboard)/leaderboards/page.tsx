"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Target,
  Phone,
  Mail,
  Calendar,
  UserPlus,
  Zap,
  Award,
  Flame,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type TimePeriod = "week" | "month" | "quarter" | "allTime";
type LeaderboardCategory = "revenue" | "deals" | "activities" | "calls" | "emails" | "contacts";

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  value: number;
  previousRank?: number;
  streak?: number;
  badges?: string[];
}

// Mock data generator for demonstration
function generateMockLeaderboardData(
  category: LeaderboardCategory,
  period: TimePeriod,
  count: number = 20
): LeaderEntry[] {
  const names = [
    "Sarah Johnson",
    "Michael Chen",
    "Emily Rodriguez",
    "David Kim",
    "Jessica Martinez",
    "James Anderson",
    "Maria Garcia",
    "Robert Taylor",
    "Lisa Thompson",
    "Daniel White",
    "Jennifer Lee",
    "Christopher Brown",
    "Amanda Davis",
    "Matthew Wilson",
    "Ashley Moore",
    "Joshua Jackson",
    "Samantha Martin",
    "Andrew Thompson",
    "Nicole Harris",
    "Ryan Clark",
  ];

  const badges = ["Top Performer", "Rising Star", "Consistent", "Hot Streak"];

  return Array.from({ length: count }, (_, i) => {
    const baseValue = category === "revenue" ? 150000 : 100;
    const randomValue = Math.floor(baseValue * (1 - i * 0.08) * (0.8 + Math.random() * 0.4));
    const previousRank = i > 0 ? i + Math.floor(Math.random() * 5) - 2 : undefined;

    return {
      rank: i + 1,
      userId: `user_${i}`,
      name: names[i % names.length],
      value: randomValue,
      previousRank: previousRank && previousRank > 0 ? previousRank : undefined,
      streak: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : undefined,
      badges: Math.random() > 0.6 ? [badges[Math.floor(Math.random() * badges.length)]] : [],
    };
  });
}

export default function LeaderboardsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>("revenue");

  // Fetch leaderboards from backend
  const leaderboards = useQuery(api.leaderboards.listLeaderboards, {
    isActive: true,
  });

  // Use real backend data or empty array if not available
  const leaderboardData = useMemo(() => {
    if (!leaderboards) return [];

    // Filter and sort based on selected category and period
    let filtered = leaderboards.filter(entry => entry.category === selectedCategory && entry.period === selectedPeriod);

    // If no matching data, fallback to using what's available
    if (filtered.length === 0 && leaderboards.length > 0) {
      filtered = leaderboards.filter(entry => entry.category === selectedCategory);
    }

    // Sort by value descending and assign ranks
    return filtered
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [leaderboards, selectedCategory, selectedPeriod]);

  const getCategoryConfig = (category: LeaderboardCategory) => {
    const configs = {
      revenue: {
        icon: DollarSign,
        label: "Revenue",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950",
        format: "currency" as const,
      },
      deals: {
        icon: Target,
        label: "Deals Closed",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950",
        format: "number" as const,
      },
      activities: {
        icon: Zap,
        label: "Activities",
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950",
        format: "number" as const,
      },
      calls: {
        icon: Phone,
        label: "Calls Made",
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950",
        format: "number" as const,
      },
      emails: {
        icon: Mail,
        label: "Emails Sent",
        color: "text-pink-600",
        bgColor: "bg-pink-50 dark:bg-pink-950",
        format: "number" as const,
      },
      contacts: {
        icon: UserPlus,
        label: "New Contacts",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950",
        format: "number" as const,
      },
    };
    return configs[category];
  };

  const formatValue = (value: number, format: "currency" | "number") => {
    return format === "currency" ? formatCurrency(value) : formatNumber(value);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-zinc-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {rank}
            </span>
          </div>
        );
    }
  };

  const getRankChange = (entry: LeaderEntry) => {
    if (!entry.previousRank) return null;
    const change = entry.previousRank - entry.rank;

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs font-medium">{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <ChevronDown className="h-4 w-4" />
          <span className="text-xs font-medium">{Math.abs(change)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-zinc-400">
          <Minus className="h-4 w-4" />
        </div>
      );
    }
  };

  const topPerformer = leaderboardData[0];
  const maxValue = topPerformer?.value || 1;
  const config = getCategoryConfig(selectedCategory);

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Leaderboards
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            See how your team is performing across key metrics
          </p>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as TimePeriod)}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="allTime">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="mt-6 space-y-6">
          {/* Category Selection */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                "revenue",
                "deals",
                "activities",
                "calls",
                "emails",
                "contacts",
              ] as LeaderboardCategory[]
            ).map((category) => {
              const categoryConfig = getCategoryConfig(category);
              const Icon = categoryConfig.icon;
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-lg dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-white dark:text-zinc-900" : categoryConfig.color
                    )}
                  />
                  <span className="text-xs font-medium">{categoryConfig.label}</span>
                </button>
              );
            })}
          </div>

          {/* Top 3 Podium */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className={cn("h-5 w-5", config.color)} />
                Top Performers - {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {leaderboardData.slice(0, 3).map((entry, index) => {
                  const position = index + 1;
                  const Icon = position === 1 ? Crown : Medal;
                  const iconColor =
                    position === 1
                      ? "text-amber-500"
                      : position === 2
                      ? "text-zinc-400"
                      : "text-amber-700";
                  const bgColor =
                    position === 1
                      ? "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
                      : position === 2
                      ? "bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900"
                      : "bg-gradient-to-br from-amber-50/50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/30";

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "relative flex flex-col items-center gap-3 rounded-xl border p-6",
                        bgColor,
                        position === 1 && "border-amber-300 dark:border-amber-700"
                      )}
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-full border-4 border-white p-2 dark:border-zinc-950",
                            position === 1
                              ? "bg-amber-500"
                              : position === 2
                              ? "bg-zinc-400"
                              : "bg-amber-700"
                          )}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="mt-4">
                        <Avatar className="h-16 w-16 border-2 border-white dark:border-zinc-800">
                          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-lg font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {entry.name.charAt(0)}
                          </div>
                        </Avatar>
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {entry.name}
                        </h3>
                        <p className={cn("text-2xl font-bold", config.color)}>
                          {formatValue(entry.value, config.format)}
                        </p>
                      </div>

                      {/* Badges */}
                      {entry.badges && entry.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.badges.map((badge, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              <Award className="mr-1 h-3 w-3" />
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Streak */}
                      {entry.streak && (
                        <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 dark:bg-orange-950">
                          <Flame className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                            {entry.streak} day streak
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Full Leaderboard Table */}
          <Card>
            <CardHeader>
              <CardTitle>Full Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboardData.map((entry, index) => {
                  const isTopThree = entry.rank <= 3;
                  const progressPercentage = (entry.value / maxValue) * 100;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "group flex items-center gap-4 rounded-lg border p-3 transition-all hover:shadow-md",
                        isTopThree
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
                          : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex w-12 items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex flex-1 items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <div className="flex h-full w-full items-center justify-center bg-zinc-100 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {entry.name.charAt(0)}
                          </div>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {entry.name}
                            </h4>
                            {entry.streak && (
                              <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 dark:bg-orange-950">
                                <Flame className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                  {entry.streak}
                                </span>
                              </div>
                            )}
                            {entry.badges && entry.badges.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.badges[0]}
                              </Badge>
                            )}
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-2 hidden sm:block">
                            <Progress
                              value={progressPercentage}
                              className="h-1.5"
                              variant={
                                entry.rank === 1
                                  ? "success"
                                  : isTopThree
                                  ? "warning"
                                  : "default"
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            isTopThree ? config.color : "text-zinc-900 dark:text-zinc-100"
                          )}
                        >
                          {formatValue(entry.value, config.format)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {progressPercentage.toFixed(0)}% of top
                        </p>
                      </div>

                      {/* Rank Change */}
                      <div className="w-12 text-center">{getRankChange(entry)}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
