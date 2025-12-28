"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationPanel } from "./NotificationPanel";
import { NotificationSettings } from "./NotificationSettings";

interface NotificationBellProps {
  className?: string;
  userId?: Id<"users">;
}

export function NotificationBell({ className, userId }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const unreadCount = useQuery(api.notifications.unreadCount);
  const pendingApprovalCount = useQuery(
    api.approvals.getPendingApprovalCount,
    userId ? { userId } : "skip"
  );

  const totalCount = (unreadCount ?? 0) + (pendingApprovalCount ?? 0);
  const displayCount = totalCount > 0
    ? totalCount > 99 ? "99+" : totalCount
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
            open && "bg-zinc-100 dark:bg-zinc-800",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {displayCount && (
            <span
              className={cn(
                "absolute flex items-center justify-center rounded-full bg-blue-500 text-white font-medium",
                displayCount === "99+"
                  ? "right-0 top-0 h-4 min-w-4 px-1 text-[9px]"
                  : Number(displayCount) > 9
                  ? "right-0.5 top-0.5 h-4 min-w-4 px-1 text-[10px]"
                  : "right-1 top-1 h-3.5 w-3.5 text-[10px]"
              )}
            >
              {displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-96 p-0 overflow-hidden",
          "bg-white dark:bg-zinc-900",
          "border border-zinc-200 dark:border-zinc-800"
        )}
      >
        <div className="h-[480px]">
          {showSettings ? (
            <NotificationSettings onBack={() => setShowSettings(false)} />
          ) : (
            <NotificationPanel
              onClose={() => setOpen(false)}
              onOpenSettings={() => setShowSettings(true)}
              userId={userId}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
