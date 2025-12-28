"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { LeaderboardTable, RankTrend, BadgeShowcase } from "@/components/leaderboards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Calendar, BarChart2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LeaderboardDetailPage({
  params,
}: LeaderboardDetailPageProps) {
  const { id } = use(params);
  const leaderboardId = id as Id<"leaderboards">;

  const leaderboard = useQuery(api.leaderboards.getLeaderboard, {
    id: leaderboardId,
    limit: 50,
  });

  if (leaderboard === undefined) {
    return <LeaderboardDetailSkeleton />;
  }

  if (!leaderboard) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Trophy className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Leaderboard not found
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          This leaderboard may have been deleted or you don't have access.
        </p>
        <Link href="/leaderboards">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboards
          </Button>
        </Link>
      </div>
    );
  }

  const periodLabels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    allTime: "All Time",
  };

  const metricLabels: Record<string, string> = {
    deals_won: "Deals Won",
    revenue: "Revenue",
    activities: "Activities",
    calls: "Calls",
    emails: "Emails",
    new_contacts: "New Contacts",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/leaderboards"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboards
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-500" />
            {leaderboard.name}
          </h1>
          {leaderboard.description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {leaderboard.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">
            <BarChart2 className="h-4 w-4 text-zinc-500" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {metricLabels[leaderboard.metric] || leaderboard.metric}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {periodLabels[leaderboard.period] || leaderboard.period}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rankings Table */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Current Rankings
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {leaderboard.topUsers.length} participants ranked
              </p>
            </div>
            <LeaderboardTable
              leaderboardId={leaderboardId}
              metric={leaderboard.metric as any}
              showBadges
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Performer Highlight */}
          {leaderboard.topUsers[0] && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-amber-900/20">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Top Performer
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg font-bold">
                  {leaderboard.topUsers[0].user?.firstName?.[0]}
                  {leaderboard.topUsers[0].user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    {leaderboard.topUsers[0].user?.firstName}{" "}
                    {leaderboard.topUsers[0].user?.lastName}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Leading with{" "}
                    {leaderboard.metric === "revenue"
                      ? `$${leaderboard.topUsers[0].value.toLocaleString()}`
                      : leaderboard.topUsers[0].value.toLocaleString()}{" "}
                    {metricLabels[leaderboard.metric]?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Leaderboard Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Total Participants</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {leaderboard.topUsers.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">
                  Total {metricLabels[leaderboard.metric]}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {leaderboard.metric === "revenue"
                    ? `$${leaderboard.topUsers
                        .reduce((sum, u) => sum + u.value, 0)
                        .toLocaleString()}`
                    : leaderboard.topUsers
                        .reduce((sum, u) => sum + u.value, 0)
                        .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Average per Person</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {leaderboard.topUsers.length > 0
                    ? leaderboard.metric === "revenue"
                      ? `$${Math.round(
                          leaderboard.topUsers.reduce((sum, u) => sum + u.value, 0) /
                            leaderboard.topUsers.length
                        ).toLocaleString()}`
                      : Math.round(
                          leaderboard.topUsers.reduce((sum, u) => sum + u.value, 0) /
                            leaderboard.topUsers.length
                        ).toLocaleString()
                    : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Competition Period
            </h3>
            <p className="text-sm text-zinc-500">
              {leaderboard.period === "allTime"
                ? "This is an all-time leaderboard tracking cumulative performance."
                : `This ${periodLabels[leaderboard.period]?.toLowerCase()} leaderboard resets at the start of each ${
                    leaderboard.period === "daily"
                      ? "day"
                      : leaderboard.period === "weekly"
                        ? "week"
                        : leaderboard.period === "monthly"
                          ? "month"
                          : leaderboard.period === "quarterly"
                            ? "quarter"
                            : "year"
                  }.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
