"use client";

import { cn, getRelativeTime } from "@/lib/utils";
import {
  UserPlus,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";

export type ActivityType =
  | "contact_created"
  | "deal_created"
  | "deal_won"
  | "deal_lost"
  | "task_completed"
  | "note_added"
  | "email_sent"
  | "call_logged"
  | "meeting_scheduled";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
  link?: string;
  metadata?: {
    contactName?: string;
    dealName?: string;
    dealValue?: number;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const activityConfig: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  contact_created: {
    icon: UserPlus,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  deal_created: {
    icon: DollarSign,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
  },
  deal_won: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
  },
  deal_lost: {
    icon: DollarSign,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  task_completed: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
  },
  note_added: {
    icon: FileText,
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
  },
  email_sent: {
    icon: Mail,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
  },
  call_logged: {
    icon: Phone,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
  },
  meeting_scheduled: {
    icon: Calendar,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-950",
  },
};

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  const content = (
    <div className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">
          {activity.description}
        </p>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {getRelativeTime(activity.timestamp)}
        </span>
      </div>
      {activity.link && (
        <ArrowRight className="h-4 w-4 shrink-0 self-center text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
      )}
    </div>
  );

  if (activity.link) {
    return (
      <Link href={activity.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ActivityFeed({
  activities,
  className,
  showViewAll = true,
  onViewAll,
}: ActivityFeedProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Activity
        </h3>
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
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No recent activity
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
