"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaderboardCard } from "./LeaderboardCard";
import { LeaderboardForm } from "./LeaderboardForm";
import { BadgeShowcase } from "./BadgeDisplay";
import {
  Plus,
  Trophy,
  RefreshCw,
  Filter,
  Award,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface LeaderboardDashboardProps {
  currentUserId?: Id<"users">;
  className?: string;
}

export function LeaderboardDashboard({
  currentUserId,
  className,
}: LeaderboardDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const leaderboards = useQuery(api.leaderboards.listLeaderboards, {
    isActive: true,
    ...(metricFilter !== "all" && { metric: metricFilter as any }),
    ...(periodFilter !== "all" && { period: periodFilter as any }),
  });

  const recentBadges = useQuery(api.leaderboards.getRecentBadges, {
    limit: 5,
  });

  const userBadges = useQuery(
    api.leaderboards.getUserBadges,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  const refreshAllLeaderboards = useMutation(
    api.leaderboards.refreshAllLeaderboards
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const results = await refreshAllLeaderboards({});
      toast.success(`Refreshed ${results.length} leaderboards`);
    } catch (error) {
      console.error("Error refreshing leaderboards:", error);
      toast.error("Failed to refresh leaderboards");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (leaderboards === undefined) {
    return <LeaderboardDashboardSkeleton />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Leaderboards
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track team performance and compete for the top spots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh Rankings</span>
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">New Leaderboard</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-500">Filter by:</span>
        </div>

        <Select value={metricFilter} onValueChange={setMetricFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metrics</SelectItem>
            <SelectItem value="deals_won">Deals Won</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
            <SelectItem value="calls">Calls</SelectItem>
            <SelectItem value="emails">Emails</SelectItem>
            <SelectItem value="new_contacts">New Contacts</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="allTime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leaderboards Grid */}
        <div className="lg:col-span-2">
          {leaderboards.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {leaderboards.map((leaderboard) => (
                <LeaderboardCard
                  key={leaderboard._id}
                  id={leaderboard._id}
                  name={leaderboard.name}
                  description={leaderboard.description}
                  metric={leaderboard.metric as any}
                  period={leaderboard.period as any}
                  topUsers={leaderboard.topUsers.map((entry) => ({
                    rank: entry.rank,
                    value: entry.value,
                    user: entry.user,
                  }))}
                  isActive={leaderboard.isActive}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
              <Trophy className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                No leaderboards yet
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Create your first leaderboard to start tracking team
                performance
              </p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Leaderboard
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Badges */}
          {currentUserId && userBadges && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Your Badges
                </h3>
              </div>
              {userBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userBadges.slice(0, 6).map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${badge.color}20`,
                          color: badge.color,
                        }}
                      >
                        <Trophy className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                  {userBadges.length > 6 && (
                    <span className="text-sm text-zinc-500">
                      +{userBadges.length - 6} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">
                  No badges yet. Keep up the good work!
                </p>
              )}
            </div>
          )}

          {/* Recent Badge Activity */}
          {recentBadges && recentBadges.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Achievements
              </h3>
              <div className="space-y-3">
                {recentBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        color: badge.color,
                      }}
                    >
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {badge.user?.firstName} {badge.user?.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        earned {badge.name}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 flex-shrink-0">
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      <LeaderboardForm
        open={showForm}
        onOpenChange={setShowForm}
        userId={currentUserId}
      />
    </div>
  );
}

function LeaderboardDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
