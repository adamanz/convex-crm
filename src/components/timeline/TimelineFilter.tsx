"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Phone,
  Mail,
  Users,
  FileText,
  MessageSquare,
  Filter,
  X,
  LucideIcon,
} from "lucide-react";
import { TimelineActivityType } from "./TimelineItem";

export interface TimelineFilterValue {
  types: TimelineActivityType[];
}

interface TimelineFilterProps {
  value: TimelineFilterValue;
  onChange: (value: TimelineFilterValue) => void;
  className?: string;
  compact?: boolean;
}

interface FilterOption {
  type: TimelineActivityType;
  icon: LucideIcon;
  label: string;
  color: string;
  activeColor: string;
}

const filterOptions: FilterOption[] = [
  {
    type: "email",
    icon: Mail,
    label: "Emails",
    color: "text-zinc-500 hover:text-cyan-500",
    activeColor: "text-cyan-500 bg-cyan-500/10",
  },
  {
    type: "call",
    icon: Phone,
    label: "Calls",
    color: "text-zinc-500 hover:text-amber-500",
    activeColor: "text-amber-500 bg-amber-500/10",
  },
  {
    type: "meeting",
    icon: Users,
    label: "Meetings",
    color: "text-zinc-500 hover:text-purple-500",
    activeColor: "text-purple-500 bg-purple-500/10",
  },
  {
    type: "note",
    icon: FileText,
    label: "Notes",
    color: "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400",
    activeColor: "text-zinc-600 bg-zinc-500/10 dark:text-zinc-400",
  },
  {
    type: "task",
    icon: CheckSquare,
    label: "Tasks",
    color: "text-zinc-500 hover:text-blue-500",
    activeColor: "text-blue-500 bg-blue-500/10",
  },
  {
    type: "message",
    icon: MessageSquare,
    label: "Messages",
    color: "text-zinc-500 hover:text-emerald-500",
    activeColor: "text-emerald-500 bg-emerald-500/10",
  },
];

export function TimelineFilter({
  value,
  onChange,
  className,
  compact = false,
}: TimelineFilterProps) {
  const hasActiveFilters = value.types.length > 0;
  const allSelected = value.types.length === filterOptions.length;

  const toggleType = (type: TimelineActivityType) => {
    const newTypes = value.types.includes(type)
      ? value.types.filter((t) => t !== type)
      : [...value.types, type];
    onChange({ ...value, types: newTypes });
  };

  const clearFilters = () => {
    onChange({ ...value, types: [] });
  };

  const selectAll = () => {
    onChange({ ...value, types: filterOptions.map((o) => o.type) });
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isActive = value.types.includes(option.type);
          return (
            <button
              key={option.type}
              onClick={() => toggleType(option.type)}
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                isActive ? option.activeColor : option.color
              )}
              title={option.label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-1"
            title="Clear filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
        <Filter className="h-3.5 w-3.5" />
        <span>Filter</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isActive = value.types.includes(option.type);
          return (
            <button
              key={option.type}
              onClick={() => toggleType(option.type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? option.activeColor
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {hasActiveFilters && !allSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="h-7 text-xs text-zinc-500"
          >
            Select all
          </Button>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-zinc-500"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
