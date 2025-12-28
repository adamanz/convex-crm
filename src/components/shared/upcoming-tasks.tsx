"use client";

import { cn, formatRelativeTime } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  subject: string;
  description?: string;
  dueDate: number;
  priority: Priority;
  isOverdue: boolean;
  isDueToday: boolean;
  relatedTo: {
    type: "contact" | "company" | "deal";
    id: string;
    name: string;
    link: string;
  };
}

interface UpcomingTasksProps {
  tasks: Task[];
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onComplete?: (taskId: string) => void;
}

const priorityConfig: Record<
  Priority,
  { label: string; dotColor: string; bgColor: string }
> = {
  low: {
    label: "Low",
    dotColor: "bg-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
  },
  medium: {
    label: "Medium",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  high: {
    label: "High",
    dotColor: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
};

function formatDueDate(dueDate: number, isOverdue: boolean, isDueToday: boolean): string {
  if (isOverdue) {
    return "Overdue";
  }
  if (isDueToday) {
    return "Due today";
  }

  const now = new Date();
  const due = new Date(dueDate);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due.toDateString() === tomorrow.toDateString()) {
    return "Due tomorrow";
  }

  return `Due ${formatRelativeTime(dueDate)}`;
}

function TaskItem({
  task,
  onComplete,
}: {
  task: Task;
  onComplete?: (taskId: string) => void;
}) {
  const priorityStyle = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg p-3 transition-colors",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        task.isOverdue && "bg-red-50/50 dark:bg-red-950/20"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onComplete?.(task.id)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
          "border-2 border-zinc-300 hover:border-zinc-400",
          "dark:border-zinc-600 dark:hover:border-zinc-500",
          "group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
        )}
      >
        <CheckCircle2 className="h-3 w-3 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium text-zinc-900 dark:text-zinc-100",
              task.isOverdue && "text-red-700 dark:text-red-400"
            )}
          >
            {task.subject}
          </span>

          {/* Priority indicator */}
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              priorityStyle.bgColor
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", priorityStyle.dotColor)} />
            {priorityStyle.label}
          </span>
        </div>

        {/* Due date and related entity */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div
            className={cn(
              "flex items-center gap-1",
              task.isOverdue && "text-red-600 dark:text-red-400"
            )}
          >
            {task.isOverdue ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            <span>{formatDueDate(task.dueDate, task.isOverdue, task.isDueToday)}</span>
          </div>

          {task.relatedTo.name && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <Link
                href={task.relatedTo.link}
                className="truncate hover:text-zinc-700 hover:underline dark:hover:text-zinc-200"
              >
                {task.relatedTo.name}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Arrow on hover */}
      <ArrowRight className="h-4 w-4 shrink-0 self-center text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
    </div>
  );
}

export function UpcomingTasks({
  tasks,
  className,
  showViewAll = true,
  onViewAll,
  onComplete,
}: UpcomingTasksProps) {
  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const upcomingTasks = tasks.filter((t) => !t.isOverdue);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming Tasks
          </h3>
          {overdueTasks.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
              {overdueTasks.length} overdue
            </span>
          )}
        </div>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            View all
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 p-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} onComplete={onComplete} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No upcoming tasks
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Create a task to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
