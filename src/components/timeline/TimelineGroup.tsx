"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import { TimelineItem, TimelineActivity } from "./TimelineItem";

interface TimelineGroupProps {
  date: Date | number;
  activities: TimelineActivity[];
  onTaskComplete?: (id: string, completed: boolean) => void;
  compact?: boolean;
  className?: string;
}

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  const diffInDays = Math.floor(
    (today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }

  return formatDate(date);
}

export function TimelineGroup({
  date,
  activities,
  onTaskComplete,
  compact = false,
  className,
}: TimelineGroupProps) {
  const dateObj = typeof date === "number" ? new Date(date) : date;
  const dateLabel = getDateLabel(dateObj);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Date header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 py-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2">
          {dateLabel}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Activities */}
      <div className={cn("pt-2", compact ? "space-y-0" : "space-y-0")}>
        {activities.map((activity, index) => (
          <TimelineItem
            key={activity._id}
            activity={activity}
            isLast={index === activities.length - 1}
            showConnector={true}
            compact={compact}
            onTaskComplete={onTaskComplete}
          />
        ))}
      </div>
    </div>
  );
}

// Helper function to group activities by date
export function groupActivitiesByDate(
  activities: TimelineActivity[]
): Map<string, TimelineActivity[]> {
  const groups = new Map<string, TimelineActivity[]>();

  const sortedActivities = [...activities].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  for (const activity of sortedActivities) {
    const date = new Date(activity.createdAt);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(activity);
  }

  return groups;
}
