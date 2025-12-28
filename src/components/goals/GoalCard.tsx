"use client";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  DollarSign,
  Handshake,
  Activity,
  Phone,
  Calendar,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type GoalType = "revenue" | "deals" | "activities" | "calls";
export type GoalPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface GoalCardProps {
  id: string;
  name: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  startDate: number;
  endDate: number;
  period: GoalPeriod;
  teamWide: boolean;
  owner?: {
    firstName?: string;
    lastName?: string;
  } | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const typeIcons: Record<GoalType, React.ComponentType<{ className?: string }>> = {
  revenue: DollarSign,
  deals: Handshake,
  activities: Activity,
  calls: Phone,
};

const typeColors: Record<GoalType, string> = {
  revenue: "#22c55e", // green
  deals: "#6366f1", // indigo
  activities: "#f59e0b", // amber
  calls: "#8b5cf6", // violet
};

const periodLabels: Record<GoalPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

function formatGoalValue(value: number, type: GoalType): string {
  if (type === "revenue") {
    return formatCurrency(value);
  }
  return formatNumber(value);
}

export function GoalCard({
  id,
  name,
  description,
  type,
  targetValue,
  currentValue,
  progressPercent,
  startDate,
  endDate,
  period,
  teamWide,
  owner,
  onEdit,
  onDelete,
  className,
}: GoalCardProps) {
  const Icon = typeIcons[type];
  const color = typeColors[type];
  const isCompleted = progressPercent >= 100;
  const isOverdue = endDate < Date.now() && !isCompleted;

  const ownerName = owner
    ? `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim() || "Unknown"
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        isCompleted && "border-green-200 dark:border-green-900",
        isOverdue && "border-red-200 dark:border-red-900",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <span style={{ color }}>
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              {name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{periodLabels[period]}</span>
              {teamWide ? (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Team Goal
                </span>
              ) : (
                ownerName && <span>{ownerName}</span>
              )}
            </div>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatGoalValue(currentValue, type)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            of {formatGoalValue(targetValue, type)}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, progressPercent)}%`,
              backgroundColor: isCompleted
                ? "#22c55e"
                : isOverdue
                  ? "#ef4444"
                  : color,
            }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span
            className={cn(
              "font-medium",
              isCompleted && "text-green-600 dark:text-green-400",
              isOverdue && "text-red-600 dark:text-red-400"
            )}
          >
            {progressPercent.toFixed(0)}% complete
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              Goal reached!
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(startDate), "MMM d")} -{" "}
            {format(new Date(endDate), "MMM d, yyyy")}
          </span>
        </div>
        {isOverdue && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700 dark:bg-red-900 dark:text-red-300">
            Overdue
          </span>
        )}
      </div>
    </div>
  );
}
