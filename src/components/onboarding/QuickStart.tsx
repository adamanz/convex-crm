"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  TrendingUp,
  Calendar,
  Check,
  ChevronRight,
  Upload,
  Zap,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStartTask {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  completed?: boolean;
  color: string;
  bgColor: string;
}

interface QuickStartProps {
  tasks?: QuickStartTask[];
  onTaskClick?: (taskId: string) => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

const defaultTasks: QuickStartTask[] = [
  {
    id: "add-contact",
    title: "Add your first contact",
    description: "Start building your network",
    icon: Users,
    href: "/contacts",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    completed: false,
  },
  {
    id: "add-company",
    title: "Create a company",
    description: "Organize your accounts",
    icon: Building2,
    href: "/companies",
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    completed: false,
  },
  {
    id: "create-deal",
    title: "Create your first deal",
    description: "Start tracking revenue",
    icon: TrendingUp,
    href: "/deals",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    completed: false,
  },
  {
    id: "add-task",
    title: "Schedule a task",
    description: "Plan your next follow-up",
    icon: Calendar,
    href: "/activities",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    completed: false,
  },
];

export function QuickStart({
  tasks = defaultTasks,
  onTaskClick,
  onDismiss,
  showDismiss = true,
  className,
}: QuickStartProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Dismiss button */}
      {showDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Quick Start</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {completedCount} of {tasks.length} completed
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-4">
        {tasks.map((task) => {
          const TaskIcon = task.icon;
          const content = (
            <div
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 transition-all",
                task.completed
                  ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              )}
            >
              {/* Checkbox / Icon */}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  task.completed
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : task.bgColor
                )}
              >
                {task.completed ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TaskIcon className={cn("h-4 w-4", task.color)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    task.completed
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {task.title}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    task.completed
                      ? "text-zinc-400 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {task.description}
                </p>
              </div>

              {/* Arrow */}
              {!task.completed && (
                <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
              )}
            </div>
          );

          if (task.href && !task.completed) {
            return (
              <Link
                key={task.id}
                href={task.href}
                onClick={() => onTaskClick?.(task.id)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={task.id}
              onClick={() => {
                task.action?.();
                onTaskClick?.(task.id);
              }}
              disabled={task.completed}
              className="w-full text-left"
            >
              {content}
            </button>
          );
        })}

        {/* Help links */}
        <div className="flex items-center gap-4 pt-4">
          <button className="flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            <Upload className="h-3.5 w-3.5" />
            Import Data
          </button>
          <button className="flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            <BookOpen className="h-3.5 w-3.5" />
            View Docs
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline version
interface QuickStartInlineProps {
  completedTasks: number;
  totalTasks: number;
  onContinue: () => void;
  className?: string;
}

export function QuickStartInline({
  completedTasks,
  totalTasks,
  onContinue,
  className,
}: QuickStartInlineProps) {
  const progress = (completedTasks / totalTasks) * 100;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
        <Zap className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Complete your setup
        </p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>
      <Button size="sm" onClick={onContinue}>
        Continue
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
