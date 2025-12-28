"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-zinc-400 dark:text-zinc-500",
        spinnerSizes[size],
        className
      )}
    />
  );
}

interface FullPageSpinnerProps {
  message?: string;
}

export function FullPageSpinner({ message }: FullPageSpinnerProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
        className
      )}
    />
  );
}

interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export function CardSkeleton({
  lines = 3,
  showAvatar = false,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-3", i === lines - 2 ? "w-1/2" : "w-full")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 5,
  showAvatar = true,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
        >
          {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === 0 ? "w-1/4" : "w-1/6")}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3 last:border-b-0 dark:border-zinc-800 dark:bg-zinc-950"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4",
                colIndex === 0
                  ? "w-1/4"
                  : colIndex === columns - 1
                    ? "w-16"
                    : "w-1/6"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export function InlineLoading({ message, className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner size="sm" />
      {message && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {message}
        </span>
      )}
    </div>
  );
}
