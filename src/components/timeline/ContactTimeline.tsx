"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Timeline, TimelineActivity, TimelineActivityType } from "./Timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Phone,
  Mail,
  Users,
  FileText,
  CheckSquare,
  History,
  RefreshCw,
} from "lucide-react";

interface ContactTimelineProps {
  contactId: string;
  contactName: string;
  activities: TimelineActivity[];
  onTaskComplete?: (id: string, completed: boolean) => void;
  onAddActivity?: (type: TimelineActivityType) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface QuickAction {
  type: TimelineActivityType;
  icon: React.ElementType;
  label: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    type: "call",
    icon: Phone,
    label: "Log call",
    color: "text-amber-500 hover:bg-amber-500/10",
  },
  {
    type: "email",
    icon: Mail,
    label: "Log email",
    color: "text-cyan-500 hover:bg-cyan-500/10",
  },
  {
    type: "meeting",
    icon: Users,
    label: "Schedule meeting",
    color: "text-purple-500 hover:bg-purple-500/10",
  },
  {
    type: "note",
    icon: FileText,
    label: "Add note",
    color: "text-zinc-500 hover:bg-zinc-500/10",
  },
  {
    type: "task",
    icon: CheckSquare,
    label: "Create task",
    color: "text-blue-500 hover:bg-blue-500/10",
  },
];

export function ContactTimeline({
  contactId,
  contactName,
  activities,
  onTaskComplete,
  onAddActivity,
  onRefresh,
  isLoading = false,
  className,
}: ContactTimelineProps) {
  // Calculate activity stats
  const stats = React.useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentActivities = activities.filter((a) => a.createdAt > thirtyDaysAgo);

    return {
      total: activities.length,
      last30Days: recentActivities.length,
      lastActivity: activities.length > 0
        ? Math.max(...activities.map((a) => a.createdAt))
        : null,
      byType: activities.reduce(
        (acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        },
        {} as Record<TimelineActivityType, number>
      ),
    };
  }, [activities]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <History className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <CardTitle className="text-base">Activity History</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {stats.total} total activities
                {stats.last30Days > 0 && (
                  <span className="ml-1">
                    ({stats.last30Days} in last 30 days)
                  </span>
                )}
              </p>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          )}
        </div>

        {/* Quick actions */}
        {onAddActivity && (
          <div className="flex items-center gap-1 mt-4 -mx-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddActivity(action.type)}
                  className={cn(
                    "h-8 gap-1.5 text-xs font-normal",
                    action.color
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Timeline
            activities={activities}
            onTaskComplete={onTaskComplete}
            showFilter
            showGroupedByDate
            filterPosition="inline"
            emptyMessage={`No activity recorded for ${contactName}`}
            emptyIcon={
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
                  <History className="h-6 w-6 text-zinc-400" />
                </div>
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebars or smaller spaces
export function ContactTimelineCompact({
  activities,
  onTaskComplete,
  onViewAll,
  maxItems = 5,
  className,
}: {
  activities: TimelineActivity[];
  onTaskComplete?: (id: string, completed: boolean) => void;
  onViewAll?: () => void;
  maxItems?: number;
  className?: string;
}) {
  const sortedActivities = React.useMemo(() => {
    return [...activities]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, maxItems);
  }, [activities, maxItems]);

  const hasMore = activities.length > maxItems;

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Recent Activity
        </h3>
        {onViewAll && hasMore && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="p-4">
        {sortedActivities.length > 0 ? (
          <div className="relative">
            {sortedActivities.map((activity, index) => (
              <div key={activity._id} className="relative">
                {/* Connector line */}
                {index < sortedActivities.length - 1 && (
                  <div className="absolute left-[11px] top-6 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                )}
                <TimelineItemCompact
                  activity={activity}
                  onTaskComplete={onTaskComplete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <History className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No recent activity
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for compact timeline items
function TimelineItemCompact({
  activity,
  onTaskComplete,
}: {
  activity: TimelineActivity;
  onTaskComplete?: (id: string, completed: boolean) => void;
}) {
  const typeConfig: Record<
    TimelineActivityType,
    { icon: React.ElementType; color: string; bgColor: string }
  > = {
    task: {
      icon: CheckSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    call: {
      icon: Phone,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    email: {
      icon: Mail,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    meeting: {
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    note: {
      icon: FileText,
      color: "text-zinc-500",
      bgColor: "bg-zinc-500/10",
    },
    message: {
      icon: Mail,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  };

  const config = typeConfig[activity.type] || typeConfig.note;
  const Icon = config.icon;

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div className="flex items-start gap-3 pb-4">
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <Icon className={cn("h-3 w-3", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {activity.subject}
          </span>
          <span className="text-xs text-zinc-400 shrink-0">
            {getRelativeTime(activity.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
