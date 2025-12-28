"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Phone,
  Mail,
  Users,
  CheckSquare,
  Calendar,
  Clock,
  MapPin,
  User,
  LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type EventType = "meeting" | "call" | "task" | "email" | "reminder";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  startTime: number;
  endTime?: number;
  description?: string;
  location?: string;
  attendees?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  relatedTo?: {
    type: "contact" | "company" | "deal";
    id: string;
    name: string;
  };
  isAllDay?: boolean;
  color?: string;
}

export interface EventCardProps {
  event: CalendarEvent;
  variant?: "default" | "compact" | "expanded";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const eventTypeConfig: Record<
  EventType,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  meeting: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    borderColor: "border-l-purple-500",
    label: "Meeting",
  },
  call: {
    icon: Phone,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-l-amber-500",
    label: "Call",
  },
  task: {
    icon: CheckSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-l-blue-500",
    label: "Task",
  },
  email: {
    icon: Mail,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
    borderColor: "border-l-cyan-500",
    label: "Email",
  },
  reminder: {
    icon: Calendar,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    borderColor: "border-l-emerald-500",
    label: "Reminder",
  },
};

export function EventCard({
  event,
  variant = "default",
  onClick,
  className,
}: EventCardProps) {
  const config = eventTypeConfig[event.type] || eventTypeConfig.meeting;
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex cursor-pointer items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs transition-opacity hover:opacity-80",
          config.bgColor,
          config.color,
          className
        )}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  if (variant === "expanded") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "cursor-pointer rounded-lg border border-l-4 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900",
          config.borderColor,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                config.bgColor
              )}
            >
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {event.isAllDay
                    ? "All day"
                    : format(new Date(event.startTime), "h:mm a")}
                  {event.endTime &&
                    !event.isAllDay &&
                    ` - ${format(new Date(event.endTime), "h:mm a")}`}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {config.label}
          </Badge>
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {event.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>
                {event.attendees.length} attendee
                {event.attendees.length !== 1 && "s"}
              </span>
            </div>
          )}

          {/* Related entity */}
          {event.relatedTo && (
            <Badge variant="secondary" className="text-xs">
              {event.relatedTo.name}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900",
        config.borderColor,
        className
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-50">
          {event.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {event.isAllDay
              ? "All day"
              : format(new Date(event.startTime), "h:mm a")}
          </span>
          {event.location && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span className="truncate">{event.location}</span>
            </>
          )}
        </div>
      </div>
      <Badge variant="outline" className="hidden shrink-0 sm:flex">
        {config.label}
      </Badge>
    </div>
  );
}
