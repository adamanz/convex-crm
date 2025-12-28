"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  DollarSign,
  Handshake,
  Activity,
  Phone,
  ChevronRight,
} from "lucide-react";

interface GoalsWidgetProps {
  className?: string;
}

const typeIcons = {
  revenue: DollarSign,
  deals: Handshake,
  activities: Activity,
  calls: Phone,
};

const typeColors = {
  revenue: "#22c55e",
  deals: "#6366f1",
  activities: "#f59e0b",
  calls: "#8b5cf6",
};

function formatValue(value: number, type: string): string {
  if (type === "revenue") {
    return formatCurrency(value);
  }
  return formatNumber(value);
}

export function GoalsWidget({ className }: GoalsWidgetProps) {
  const goals = useQuery(api.goals.list, {
    filter: { isActive: true },
  });

  if (goals === undefined) {
    return (
      <div
        className={cn(
          "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          className
        )}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Get the top 4 most relevant goals (closest to deadline or highest priority)
  const now = Date.now();
  const sortedGoals = [...goals]
    .filter((g) => g.endDate > now) // Only show non-expired goals
    .sort((a, b) => {
      // Prioritize goals closest to completion, then by deadline
      const aProgress = a.currentValue / a.targetValue;
      const bProgress = b.currentValue / b.targetValue;

      // If one is close to 100%, prioritize it
      if (aProgress >= 0.8 && bProgress < 0.8) return -1;
      if (bProgress >= 0.8 && aProgress < 0.8) return 1;

      // Otherwise sort by deadline
      return a.endDate - b.endDate;
    })
    .slice(0, 4);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Goal Progress
          </h3>
        </div>
        <Link
          href="/settings/goals"
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {sortedGoals.length > 0 ? (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sortedGoals.map((goal) => {
            const Icon = typeIcons[goal.type];
            const color = typeColors[goal.type];
            const isCompleted = goal.progressPercent >= 100;

            return (
              <div key={goal._id} className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1">
                      {goal.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {goal.progressPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, goal.progressPercent)}%`,
                      backgroundColor: isCompleted ? "#22c55e" : color,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatValue(goal.currentValue, goal.type)}</span>
                  <span>{formatValue(goal.targetValue, goal.type)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No active goals
          </p>
          <Link
            href="/settings/goals"
            className="mt-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Create your first goal
          </Link>
        </div>
      )}

      {/* Summary stats */}
      {sortedGoals.length > 0 && (
        <div className="flex items-center justify-around border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {goals.filter((g) => g.progressPercent >= 100).length}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Completed</p>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {goals.filter((g) => g.progressPercent < 100).length}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">In Progress</p>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {goals.length > 0
                ? Math.round(
                    goals.reduce((sum, g) => sum + g.progressPercent, 0) /
                      goals.length
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Avg Progress</p>
          </div>
        </div>
      )}
    </div>
  );
}
