"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getRelativeTime, formatDate } from "@/lib/utils";
import {
  CheckSquare,
  Phone,
  Mail,
  Users,
  FileText,
  ArrowUpRight,
  Calendar,
  Clock,
  User,
  Building2,
  Briefcase,
  LucideIcon,
} from "lucide-react";

interface EnrichedActivity extends Doc<"activities"> {
  relatedEntity?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  owner?: Doc<"users"> | null;
  assignedTo?: Doc<"users"> | null;
}

interface ActivityItemProps {
  activity: EnrichedActivity;
  onTaskComplete?: (id: string, completed: boolean) => void;
  isLast?: boolean;
}

const activityTypeConfig: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  task: {
    icon: CheckSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    label: "Task",
  },
  call: {
    icon: Phone,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    label: "Call",
  },
  email: {
    icon: Mail,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
    label: "Email",
  },
  meeting: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    label: "Meeting",
  },
  note: {
    icon: FileText,
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    label: "Note",
  },
};

const relatedTypeConfig: Record<
  string,
  { icon: LucideIcon; path: string; label: string }
> = {
  contact: {
    icon: User,
    path: "/contacts",
    label: "Contact",
  },
  company: {
    icon: Building2,
    path: "/companies",
    label: "Company",
  },
  deal: {
    icon: Briefcase,
    path: "/deals",
    label: "Deal",
  },
};

function getRelatedEntityName(entity: EnrichedActivity["relatedEntity"]): string {
  if (!entity) return "Unknown";
  if ("name" in entity && entity.name) return entity.name;
  if ("firstName" in entity || "lastName" in entity) {
    return `${entity.firstName || ""} ${entity.lastName || ""}`.trim() || "Unknown";
  }
  return "Unknown";
}

export function ActivityItem({
  activity,
  onTaskComplete,
  isLast = false,
}: ActivityItemProps) {
  const config = activityTypeConfig[activity.type] || activityTypeConfig.note;
  const Icon = config.icon;
  const relatedConfig = relatedTypeConfig[activity.relatedToType];
  const RelatedIcon = relatedConfig?.icon || User;

  const isTask = activity.type === "task";
  const isCompleted = isTask && activity.completed;
  const isOverdue =
    isTask && !isCompleted && activity.dueDate && activity.dueDate < Date.now();

  const handleCheckChange = useCallback(
    (checked: boolean) => {
      onTaskComplete?.(activity._id, checked);
    },
    [activity._id, onTaskComplete]
  );

  const relatedEntityName = getRelatedEntityName(activity.relatedEntity);
  const relatedEntityLink = relatedConfig
    ? `${relatedConfig.path}/${activity.relatedToId}`
    : null;

  return (
    <div className="group relative flex gap-4 pb-6">
      {/* Timeline connector (hidden for last item) */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-zinc-900",
          config.bgColor,
          isCompleted && "opacity-60"
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex-1 rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900",
          isOverdue
            ? "border-red-200 dark:border-red-900"
            : "border-zinc-200 dark:border-zinc-800",
          isCompleted && "opacity-70"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Task checkbox */}
            {isTask && onTaskComplete && (
              <div className="pt-0.5">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleCheckChange}
                  className={cn(
                    isCompleted && "data-[state=checked]:bg-emerald-500"
                  )}
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* Subject */}
              <h3
                className={cn(
                  "font-medium text-zinc-900 dark:text-zinc-50",
                  isCompleted && "line-through text-zinc-500"
                )}
              >
                {activity.subject}
              </h3>

              {/* Description */}
              {activity.description && (
                <p
                  className={cn(
                    "mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400",
                    isCompleted && "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  {activity.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Priority badge for tasks */}
            {isTask && activity.priority && (
              <Badge
                variant={
                  activity.priority === "high"
                    ? "destructive"
                    : activity.priority === "medium"
                      ? "warning"
                      : "secondary"
                }
              >
                {activity.priority}
              </Badge>
            )}

            {/* Overdue badge */}
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                Overdue
              </Badge>
            )}

            {/* Completed badge */}
            {isCompleted && (
              <Badge variant="success" className="gap-1">
                <CheckSquare className="h-3 w-3" />
                Done
              </Badge>
            )}

            {/* Activity type badge */}
            <Badge variant="outline" className="hidden sm:flex">
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
          {/* Related entity */}
          {activity.relatedEntity && relatedEntityLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={relatedEntityLink}
                    className="group/link flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RelatedIcon className="h-3.5 w-3.5" />
                    <span className="max-w-[150px] truncate font-medium text-zinc-700 dark:text-zinc-300">
                      {relatedEntityName}
                    </span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  View {relatedConfig.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Due date for tasks */}
          {isTask && activity.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1.5",
                isOverdue && "text-red-600 dark:text-red-400"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Due {formatDate(activity.dueDate)}</span>
            </div>
          )}

          {/* Duration for calls/meetings */}
          {(activity.type === "call" || activity.type === "meeting") &&
            activity.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.duration} min</span>
              </div>
            )}

          {/* Email direction */}
          {activity.type === "email" && activity.emailDirection && (
            <Badge variant="outline" className="text-xs">
              {activity.emailDirection === "inbound" ? "Received" : "Sent"}
            </Badge>
          )}

          {/* Assigned to */}
          {activity.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>
                {activity.assignedTo.firstName} {activity.assignedTo.lastName}
              </span>
            </div>
          )}

          {/* Timestamp - always show at the end */}
          <div className="ml-auto flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{getRelativeTime(activity.createdAt)}</span>
          </div>
        </div>

        {/* Outcome (for calls/meetings) */}
        {activity.outcome && (
          <div className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Outcome:
            </span>{" "}
            {activity.outcome}
          </div>
        )}

        {/* AI Summary */}
        {activity.aiSummary && (
          <div className="mt-3 rounded-md bg-purple-50 p-3 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
            <span className="font-medium">AI Summary:</span> {activity.aiSummary}
          </div>
        )}
      </div>
    </div>
  );
}
