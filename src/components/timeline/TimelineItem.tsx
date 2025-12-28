"use client";

import * as React from "react";
import Link from "next/link";
import { cn, getRelativeTime, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  MessageSquare,
  LucideIcon,
} from "lucide-react";

export type TimelineActivityType =
  | "task"
  | "call"
  | "email"
  | "meeting"
  | "note"
  | "message";

export type RelatedEntityType = "contact" | "company" | "deal";

export interface TimelineActivity {
  _id: string;
  type: TimelineActivityType;
  subject: string;
  description?: string;
  createdAt: number;
  dueDate?: number;
  completed?: boolean;
  completedAt?: number;
  priority?: "low" | "medium" | "high";
  duration?: number;
  outcome?: string;
  emailDirection?: "inbound" | "outbound";
  aiSummary?: string;
  relatedToType: RelatedEntityType;
  relatedToId: string;
  relatedEntity?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  assignedTo?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface TimelineItemProps {
  activity: TimelineActivity;
  isLast?: boolean;
  showConnector?: boolean;
  compact?: boolean;
  onTaskComplete?: (id: string, completed: boolean) => void;
}

const activityTypeConfig: Record<
  TimelineActivityType,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  task: {
    icon: CheckSquare,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Task",
  },
  call: {
    icon: Phone,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Call",
  },
  email: {
    icon: Mail,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    label: "Email",
  },
  meeting: {
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Meeting",
  },
  note: {
    icon: FileText,
    color: "text-zinc-500",
    bgColor: "bg-zinc-500/10",
    label: "Note",
  },
  message: {
    icon: MessageSquare,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "Message",
  },
};

const relatedTypeConfig: Record<
  RelatedEntityType,
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

function getRelatedEntityName(
  entity: TimelineActivity["relatedEntity"]
): string {
  if (!entity) return "Unknown";
  if ("name" in entity && entity.name) return entity.name;
  if ("firstName" in entity || "lastName" in entity) {
    return `${entity.firstName || ""} ${entity.lastName || ""}`.trim() || "Unknown";
  }
  return "Unknown";
}

export function TimelineItem({
  activity,
  isLast = false,
  showConnector = true,
  compact = false,
  onTaskComplete,
}: TimelineItemProps) {
  const config = activityTypeConfig[activity.type] || activityTypeConfig.note;
  const Icon = config.icon;
  const relatedConfig = relatedTypeConfig[activity.relatedToType];
  const RelatedIcon = relatedConfig?.icon || User;

  const isTask = activity.type === "task";
  const isCompleted = isTask && activity.completed;
  const isOverdue =
    isTask && !isCompleted && activity.dueDate && activity.dueDate < Date.now();

  const relatedEntityName = getRelatedEntityName(activity.relatedEntity);
  const relatedEntityLink = relatedConfig
    ? `${relatedConfig.path}/${activity.relatedToId}`
    : null;

  const handleCheckClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTaskComplete?.(activity._id, !activity.completed);
  };

  if (compact) {
    return (
      <div className="group relative flex items-start gap-3">
        {/* Vertical connector line */}
        {showConnector && !isLast && (
          <div className="absolute left-[11px] top-6 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
        )}

        {/* Icon dot */}
        <div
          className={cn(
            "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            config.bgColor
          )}
        >
          <Icon className={cn("h-3 w-3", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate",
                isCompleted && "line-through text-zinc-500"
              )}
            >
              {activity.subject}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
              {getRelativeTime(activity.createdAt)}
            </span>
          </div>
          {activity.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
              {activity.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex gap-4">
      {/* Vertical connector line */}
      {showConnector && !isLast && (
        <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-zinc-200 dark:bg-zinc-800" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-950",
          config.bgColor,
          isCompleted && "opacity-60"
        )}
      >
        {isTask && onTaskComplete ? (
          <button
            onClick={handleCheckClick}
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full transition-colors",
              isCompleted
                ? "bg-emerald-500/20 hover:bg-emerald-500/30"
                : "hover:bg-zinc-500/10"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isCompleted ? "text-emerald-500" : config.color
              )}
            />
          </button>
        ) : (
          <Icon className={cn("h-4 w-4", config.color)} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex-1 min-w-0 pb-6 transition-opacity",
          isCompleted && "opacity-60"
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                "text-sm font-medium text-zinc-900 dark:text-zinc-100",
                isCompleted && "line-through text-zinc-500"
              )}
            >
              {activity.subject}
            </h4>
            {activity.description && (
              <p
                className={cn(
                  "text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1",
                  isCompleted && "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {activity.description}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex shrink-0 items-center gap-1.5">
            {isTask && activity.priority && activity.priority !== "low" && (
              <Badge
                variant={activity.priority === "high" ? "destructive" : "warning"}
                className="text-[10px] px-1.5 py-0"
              >
                {activity.priority}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                overdue
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                done
              </Badge>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {/* Related entity */}
          {activity.relatedEntity && relatedEntityLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={relatedEntityLink}
                    className="group/link inline-flex items-center gap-1 rounded px-1.5 py-0.5 -ml-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <RelatedIcon className="h-3 w-3" />
                    <span className="max-w-[120px] truncate font-medium text-zinc-700 dark:text-zinc-300">
                      {relatedEntityName}
                    </span>
                    <ArrowUpRight className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/link:opacity-100" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  View {relatedConfig.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Due date */}
          {isTask && activity.dueDate && (
            <div
              className={cn(
                "inline-flex items-center gap-1",
                isOverdue && "text-red-500 dark:text-red-400"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>Due {formatDate(activity.dueDate)}</span>
            </div>
          )}

          {/* Duration */}
          {(activity.type === "call" || activity.type === "meeting") &&
            activity.duration && (
              <div className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{activity.duration}m</span>
              </div>
            )}

          {/* Email direction */}
          {activity.type === "email" && activity.emailDirection && (
            <span className="text-zinc-400">
              {activity.emailDirection === "inbound" ? "Received" : "Sent"}
            </span>
          )}

          {/* Timestamp */}
          <span className="ml-auto text-zinc-400 dark:text-zinc-500">
            {getRelativeTime(activity.createdAt)}
          </span>
        </div>

        {/* Outcome */}
        {activity.outcome && (
          <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1.5">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Outcome:
            </span>{" "}
            {activity.outcome}
          </div>
        )}

        {/* AI Summary */}
        {activity.aiSummary && (
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded px-2 py-1.5">
            <span className="font-medium">AI:</span> {activity.aiSummary}
          </div>
        )}
      </div>
    </div>
  );
}
