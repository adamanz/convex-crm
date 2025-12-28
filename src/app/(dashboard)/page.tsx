"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";
import {
  Users,
  Handshake,
  DollarSign,
  CheckSquare,
  Plus,
  UserPlus,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { ActivityFeed, ActivityType } from "@/components/shared/activity-feed";
import { UpcomingTasks } from "@/components/shared/upcoming-tasks";
import { PipelineChart } from "@/components/shared/pipeline-chart";
import { GoalsWidget } from "@/components/goals";
import { LeaderboardWidget } from "@/components/leaderboards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800/50 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Modern stats card component
interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  href?: string;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, change, changeLabel, href }: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {change >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn(
            "text-[12px] font-medium",
            change >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
          <span className="text-[12px] text-zinc-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  // Fetch dashboard data
  const stats = useQuery(api.dashboard.getStats);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const upcomingTasks = useQuery(api.dashboard.getUpcomingTasks);
  const pipelineData = useQuery(api.dashboard.getPipelineDistribution);

  // Show loading state
  if (stats === undefined || recentActivity === undefined || upcomingTasks === undefined || pipelineData === undefined) {
    return <DashboardSkeleton />;
  }

  // Current user name (mock)
  const userName = "Alex";
  const currentDate = format(new Date(), "EEEE, MMMM d");
  const greeting = getGreeting();

  // Transform activity data for ActivityFeed component
  const activities = recentActivity.map((activity) => ({
    id: activity.id,
    type: activity.type as ActivityType,
    description: activity.description,
    timestamp: activity.timestamp,
    link: activity.link,
  }));

  // Transform tasks data for UpcomingTasks component
  const tasks = upcomingTasks.map((task) => ({
    id: task.id,
    subject: task.subject,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority as "low" | "medium" | "high",
    isOverdue: task.isOverdue,
    isDueToday: task.isDueToday,
    relatedTo: task.relatedTo,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting}, {userName}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            {currentDate}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/contacts" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Add Contact
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/deals" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          label="Total Contacts"
          value={formatNumber(stats.totalContacts)}
          change={stats.contactsChange}
          changeLabel="vs last month"
          href="/contacts"
        />
        <StatCard
          icon={Handshake}
          iconColor="text-violet-600"
          iconBg="bg-violet-50 dark:bg-violet-500/10"
          label="Open Deals"
          value={formatNumber(stats.totalOpenDeals)}
          change={stats.dealsChange}
          changeLabel="vs last month"
          href="/deals"
        />
        <StatCard
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          label="Pipeline Value"
          value={formatCurrency(stats.pipelineValue)}
          change={stats.pipelineChange}
          changeLabel="vs last month"
        />
        <StatCard
          icon={CheckSquare}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          label="Tasks Due"
          value={stats.tasksDue.toString()}
          change={stats.overdueTasks > 0 ? -stats.overdueTasks : undefined}
          changeLabel={stats.overdueTasks > 0 ? "overdue" : "this week"}
          href="/activities"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Chart */}
          <div className="rounded-xl border border-zinc-100 bg-white dark:border-zinc-800/50 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800/50">
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Pipeline Overview</h3>
              <Link href="/deals" className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                View all deals
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              <PipelineChart
                pipeline={pipelineData.pipeline}
                stages={pipelineData.stages}
              />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl border border-zinc-100 bg-white dark:border-zinc-800/50 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800/50">
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h3>
              <Link href="/activities" className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Goals Widget */}
          <GoalsWidget />

          {/* Leaderboard Widget */}
          <LeaderboardWidget />

          {/* Upcoming Tasks */}
          <div className="rounded-xl border border-zinc-100 bg-white dark:border-zinc-800/50 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Upcoming Tasks</h3>
              </div>
              <Link href="/activities?type=task" className="flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              <UpcomingTasks tasks={tasks} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-zinc-100 bg-white dark:border-zinc-800/50 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800/50">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              <QuickAction href="/contacts" icon={UserPlus} label="Add Contact" />
              <QuickAction href="/companies" icon={Building2} label="Add Company" />
              <QuickAction href="/deals" icon={Handshake} label="New Deal" />
              <QuickAction href="/activities" icon={CheckSquare} label="Create Task" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 transition-all hover:border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800/50 dark:bg-zinc-800/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <Icon className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400" />
      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
