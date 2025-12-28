"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TimelineItem, TimelineActivity, TimelineActivityType } from "./TimelineItem";
import { TimelineGroup, groupActivitiesByDate } from "./TimelineGroup";
import { TimelineFilter, TimelineFilterValue } from "./TimelineFilter";
import { History } from "lucide-react";

interface TimelineProps {
  activities: TimelineActivity[];
  onTaskComplete?: (id: string, completed: boolean) => void;
  className?: string;
  showFilter?: boolean;
  showGroupedByDate?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  maxItems?: number;
  filterPosition?: "top" | "inline";
}

export function Timeline({
  activities,
  onTaskComplete,
  className,
  showFilter = true,
  showGroupedByDate = true,
  compact = false,
  emptyMessage = "No activity yet",
  emptyIcon,
  maxItems,
  filterPosition = "top",
}: TimelineProps) {
  const [filter, setFilter] = React.useState<TimelineFilterValue>({ types: [] });

  // Filter activities
  const filteredActivities = React.useMemo(() => {
    let result = activities;

    if (filter.types.length > 0) {
      result = result.filter((a) => filter.types.includes(a.type));
    }

    // Sort by date descending
    result = [...result].sort((a, b) => b.createdAt - a.createdAt);

    // Limit if specified
    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [activities, filter.types, maxItems]);

  const groupedActivities = React.useMemo(() => {
    if (!showGroupedByDate) return null;
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities, showGroupedByDate]);

  if (activities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        {emptyIcon || <History className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Filter */}
      {showFilter && filterPosition === "top" && (
        <TimelineFilter
          value={filter}
          onChange={setFilter}
          className="mb-4"
        />
      )}

      {/* Inline filter */}
      {showFilter && filterPosition === "inline" && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Activity
          </h3>
          <TimelineFilter
            value={filter}
            onChange={setFilter}
            compact
          />
        </div>
      )}

      {/* Empty filtered state */}
      {filteredActivities.length === 0 && filter.types.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matching activities
          </p>
          <button
            onClick={() => setFilter({ types: [] })}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grouped timeline */}
      {showGroupedByDate && groupedActivities && filteredActivities.length > 0 && (
        <div className="space-y-2">
          {Array.from(groupedActivities.entries()).map(([dateKey, items]) => (
            <TimelineGroup
              key={dateKey}
              date={new Date(dateKey)}
              activities={items}
              onTaskComplete={onTaskComplete}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Flat timeline */}
      {!showGroupedByDate && filteredActivities.length > 0 && (
        <div className="relative">
          {filteredActivities.map((activity, index) => (
            <TimelineItem
              key={activity._id}
              activity={activity}
              isLast={index === filteredActivities.length - 1}
              showConnector={true}
              compact={compact}
              onTaskComplete={onTaskComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export other timeline components for convenience
export { TimelineItem } from "./TimelineItem";
export { TimelineFilter } from "./TimelineFilter";
export { TimelineGroup, groupActivitiesByDate } from "./TimelineGroup";
export type { TimelineActivity, TimelineActivityType } from "./TimelineItem";
export type { TimelineFilterValue } from "./TimelineFilter";
