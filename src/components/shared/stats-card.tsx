"use client";

import { cn, formatPercentage } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel = "vs last month",
  className,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-zinc-800/50" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </span>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                  isPositive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                )}
              >
                {formatPercentage(change)}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {changeLabel}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );
}
