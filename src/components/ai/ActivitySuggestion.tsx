"use client";

import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Gift,
  Clock,
  ChevronRight,
  Check,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SuggestionType =
  | "call"
  | "email"
  | "meeting"
  | "message"
  | "proposal"
  | "followup"
  | "gift";

interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  timing?: string;
  reason?: string;
}

interface ActivitySuggestionProps {
  suggestions: Suggestion[];
  entityName?: string;
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

const typeIcons: Record<SuggestionType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  message: MessageSquare,
  proposal: FileText,
  followup: Clock,
  gift: Gift,
};

const typeColors: Record<SuggestionType, string> = {
  call: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  email: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  meeting:
    "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  message:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  proposal: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  followup: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  gift: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
};

const priorityStyles: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-zinc-300 dark:border-l-zinc-600",
};

export function ActivitySuggestion({
  suggestions,
  entityName,
  onAccept,
  onDismiss,
  onViewAll,
  className,
}: ActivitySuggestionProps) {
  if (suggestions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            AI Suggestions
          </span>
        </div>
        <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Zap className="h-5 w-5 text-zinc-400" />
          </div>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No suggestions right now
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Keep engaging to get personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Suggested Actions
            </span>
            {entityName && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                for {entityName}
              </p>
            )}
          </div>
        </div>
        {suggestions.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            {suggestions.length}
          </span>
        )}
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {suggestions.slice(0, 3).map((suggestion) => {
          const Icon = typeIcons[suggestion.type];
          return (
            <div
              key={suggestion.id}
              className={cn(
                "border-l-2 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                priorityStyles[suggestion.priority]
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                    typeColors[suggestion.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {suggestion.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {suggestion.description}
                      </p>
                    </div>
                    {suggestion.priority === "high" && (
                      <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                        Priority
                      </span>
                    )}
                  </div>

                  {/* Timing and Reason */}
                  {(suggestion.timing || suggestion.reason) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {suggestion.timing && (
                        <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {suggestion.timing}
                        </span>
                      )}
                      {suggestion.reason && (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {suggestion.reason}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(onAccept || onDismiss) && (
                    <div className="mt-3 flex items-center gap-2">
                      {onAccept && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onAccept(suggestion.id)}
                          className="h-7 gap-1 px-2.5 text-xs"
                        >
                          <Check className="h-3 w-3" />
                          Accept
                        </Button>
                      )}
                      {onDismiss && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss(suggestion.id)}
                          className="h-7 gap-1 px-2.5 text-xs text-zinc-500"
                        >
                          <X className="h-3 w-3" />
                          Dismiss
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {suggestions.length > 3 && onViewAll && (
        <button
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 py-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          View all {suggestions.length} suggestions
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
