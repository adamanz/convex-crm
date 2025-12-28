"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  UserPlus,
  MessageSquare,
  Clock,
  AlertCircle,
  Bell,
  AtSign,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { RelativeTime } from "@/components/shared/relative-time";
import { Id } from "../../../convex/_generated/dataModel";

export type NotificationType =
  | "deal_won"
  | "deal_lost"
  | "deal_stage_change"
  | "task_assigned"
  | "task_due_soon"
  | "task_overdue"
  | "contact_created"
  | "message_received"
  | "mention"
  | "system";

export interface NotificationData {
  _id: Id<"notifications">;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead?: (id: Id<"notifications">) => void;
  onClick?: () => void;
}

const notificationConfig: Record<
  NotificationType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  deal_won: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
  },
  deal_lost: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  deal_stage_change: {
    icon: DollarSign,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
  },
  task_assigned: {
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  task_due_soon: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
  },
  task_overdue: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  contact_created: {
    icon: UserPlus,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  message_received: {
    icon: MessageSquare,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
  },
  mention: {
    icon: AtSign,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-950",
  },
  system: {
    icon: Bell,
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
  },
};

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification._id);
    }
    onClick?.();
  };

  const content = (
    <div
      className={cn(
        "group flex gap-3 rounded-lg p-3 transition-colors cursor-pointer",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              notification.read
                ? "text-zinc-700 dark:text-zinc-300"
                : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {notification.message}
        </p>
        <RelativeTime
          date={notification.createdAt}
          className="text-xs text-zinc-400 dark:text-zinc-500"
        />
      </div>

      {/* Arrow on hover if has link */}
      {notification.link && (
        <ArrowRight className="h-4 w-4 shrink-0 self-center text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
