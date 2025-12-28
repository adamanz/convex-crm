"use client";

import { Users, Shield, UserCog, User, Activity } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { cn } from "@/lib/utils";
import type { TeamStats as TeamStatsType } from "@/types/users";

interface TeamStatsProps {
  stats: TeamStatsType;
  className?: string;
}

export function TeamStats({ stats, className }: TeamStatsProps) {
  const activePercentage =
    stats.totalMembers > 0
      ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
      : 0;

  const recentlyActivePercentage =
    stats.totalMembers > 0
      ? Math.round((stats.recentlyActive / stats.totalMembers) * 100)
      : 0;

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <StatsCard
        icon={Users}
        label="Total Members"
        value={stats.totalMembers}
        change={undefined}
      />
      <StatsCard
        icon={Activity}
        label="Active This Week"
        value={stats.recentlyActive}
        change={recentlyActivePercentage - 50}
        changeLabel="of team"
      />
      <StatsCard
        icon={Shield}
        label="Admins"
        value={stats.admins}
        change={undefined}
      />
      <StatsCard
        icon={UserCog}
        label="Managers"
        value={stats.managers}
        change={undefined}
      />
    </div>
  );
}

// Alternative detailed view component
interface TeamStatsDetailedProps {
  stats: TeamStatsType;
  className?: string;
}

export function TeamStatsDetailed({ stats, className }: TeamStatsDetailedProps) {
  const roles = [
    {
      label: "Admins",
      count: stats.admins,
      icon: Shield,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Managers",
      count: stats.managers,
      icon: UserCog,
      color: "text-violet-600",
      bgColor: "bg-violet-100 dark:bg-violet-950",
    },
    {
      label: "Members",
      count: stats.members,
      icon: User,
      color: "text-zinc-600",
      bgColor: "bg-zinc-100 dark:bg-zinc-800",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Team Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          {stats.activeMembers} of {stats.totalMembers} members are active
        </p>
      </div>

      {/* Active/Inactive breakdown */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Active members</span>
          <span className="font-medium">
            {stats.activeMembers}/{stats.totalMembers}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${stats.totalMembers > 0 ? (stats.activeMembers / stats.totalMembers) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Role breakdown */}
      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.label}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  role.bgColor
                )}
              >
                <role.icon className={cn("h-4 w-4", role.color)} />
              </div>
              <span className="text-sm font-medium">{role.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">{role.count}</span>
          </div>
        ))}
      </div>

      {/* Recently active */}
      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Active this week
            </span>
          </div>
          <span className="text-sm font-medium">
            {stats.recentlyActive} members
          </span>
        </div>
      </div>
    </div>
  );
}

export default TeamStats;
