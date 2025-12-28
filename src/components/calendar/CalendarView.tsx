"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { EventCard, type CalendarEvent, type EventType } from "./EventCard";

export interface CalendarViewProps {
  events: CalendarEvent[];
  className?: string;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  selectedDate?: Date;
}

export function CalendarView({
  events,
  className,
  onDateSelect,
  onEventClick,
  onAddEvent,
  selectedDate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = format(new Date(event.startTime), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "group relative min-h-[100px] cursor-pointer border-b border-r border-zinc-100 p-1 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50",
                !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-900/50",
                isSelected && "bg-zinc-100 dark:bg-zinc-800",
                index % 7 === 6 && "border-r-0"
              )}
            >
              {/* Day number */}
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isCurrentDay &&
                      "bg-zinc-900 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900",
                    !isCurrentDay &&
                      isCurrentMonth &&
                      "text-zinc-900 dark:text-zinc-100",
                    !isCurrentDay &&
                      !isCurrentMonth &&
                      "text-zinc-400 dark:text-zinc-600"
                  )}
                >
                  {format(day, "d")}
                </span>
                {onAddEvent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(day);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Events */}
              <div className="mt-1 flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// CONNECTED COMPONENT - With Convex integration
// =============================================================================

export interface ConnectedCalendarViewProps {
  userId: Id<"users">;
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
}

/**
 * CalendarView component connected to Convex backend
 * Fetches events from calendar connections and activities
 */
export function ConnectedCalendarView({
  userId,
  className,
  onEventClick,
  onAddEvent,
}: ConnectedCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Calculate date range for the query
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return {
      startTime: calendarStart.getTime(),
      endTime: calendarEnd.getTime(),
    };
  }, [currentMonth]);

  // Fetch calendar events from Convex
  const calendarEvents = useQuery(api.calendar.getEvents, {
    userId,
    startTime: dateRange.startTime,
    endTime: dateRange.endTime,
  });

  // Transform Convex events to CalendarEvent format
  const events: CalendarEvent[] = useMemo(() => {
    if (!calendarEvents) return [];

    return calendarEvents.map((event) => {
      // Determine event type based on source
      let type: EventType = "meeting";
      if (event.isAllDay) {
        type = "reminder";
      }

      return {
        id: event._id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        type,
        isAllDay: event.isAllDay,
        location: event.location,
        attendees: event.attendees?.map((a) => ({
          id: a.email,
          name: a.name || a.email,
          email: a.email,
        })),
        relatedContact: event.relatedContact
          ? {
              id: event.relatedContact._id,
              name: `${event.relatedContact.firstName || ""} ${event.relatedContact.lastName}`.trim(),
            }
          : undefined,
        relatedCompany: event.relatedCompany
          ? {
              id: event.relatedCompany._id,
              name: event.relatedCompany.name,
            }
          : undefined,
        relatedDeal: event.relatedDeal
          ? {
              id: event.relatedDeal._id,
              name: event.relatedDeal.name,
            }
          : undefined,
      };
    });
  }, [calendarEvents]);

  // Loading state
  if (calendarEvents === undefined) {
    return (
      <div className={cn("flex items-center justify-center h-96 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <CalendarView
      events={events}
      className={className}
      onDateSelect={setSelectedDate}
      selectedDate={selectedDate}
      onEventClick={onEventClick}
      onAddEvent={onAddEvent}
    />
  );
}
