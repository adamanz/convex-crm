"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RelativeTimeProps {
  date: Date | number | string;
  className?: string;
  updateInterval?: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Future dates
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return "in a few seconds";
    if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)}m`;
    if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)}h`;
    if (absDiff < 604800) return `in ${Math.floor(absDiff / 86400)}d`;
    return formatFullDate(date);
  }

  // Past dates
  if (diffInSeconds < 10) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getUpdateInterval(date: Date): number {
  const diffInSeconds = Math.abs(
    Math.floor((new Date().getTime() - date.getTime()) / 1000)
  );

  // Update more frequently for recent times
  if (diffInSeconds < 60) return 10000; // Every 10 seconds
  if (diffInSeconds < 3600) return 60000; // Every minute
  if (diffInSeconds < 86400) return 300000; // Every 5 minutes
  return 3600000; // Every hour for older dates
}

export function RelativeTime({
  date,
  className,
  updateInterval,
}: RelativeTimeProps) {
  const dateObj = React.useMemo(() => {
    if (date instanceof Date) return date;
    if (typeof date === "number") return new Date(date);
    return new Date(date);
  }, [date]);

  const [relativeTime, setRelativeTime] = React.useState(() =>
    formatRelativeTime(dateObj)
  );
  const [fullDate] = React.useState(() => formatFullDate(dateObj));

  React.useEffect(() => {
    // Update immediately on mount
    setRelativeTime(formatRelativeTime(dateObj));

    // Set up auto-update interval
    const interval =
      updateInterval ?? getUpdateInterval(dateObj);

    const timer = setInterval(() => {
      setRelativeTime(formatRelativeTime(dateObj));
    }, interval);

    return () => clearInterval(timer);
  }, [dateObj, updateInterval]);

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={fullDate}
      className={cn(
        "text-sm text-zinc-500 dark:text-zinc-400 cursor-default",
        className
      )}
    >
      {relativeTime}
    </time>
  );
}

// Hook version for more flexible usage
export function useRelativeTime(
  date: Date | number | string,
  updateInterval?: number
): { relative: string; full: string } {
  const dateObj = React.useMemo(() => {
    if (date instanceof Date) return date;
    if (typeof date === "number") return new Date(date);
    return new Date(date);
  }, [date]);

  const [relative, setRelative] = React.useState(() =>
    formatRelativeTime(dateObj)
  );
  const full = React.useMemo(() => formatFullDate(dateObj), [dateObj]);

  React.useEffect(() => {
    setRelative(formatRelativeTime(dateObj));

    const interval = updateInterval ?? getUpdateInterval(dateObj);

    const timer = setInterval(() => {
      setRelative(formatRelativeTime(dateObj));
    }, interval);

    return () => clearInterval(timer);
  }, [dateObj, updateInterval]);

  return { relative, full };
}
