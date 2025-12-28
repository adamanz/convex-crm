"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  meetingTypeId: Id<"meetingTypes">;
  onSelectSlot: (slot: { startTime: number; endTime: number }) => void;
  selectedSlot?: { startTime: number; endTime: number } | null;
}

export function BookingCalendar({
  meetingTypeId,
  onSelectSlot,
  selectedSlot,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate date range for the current view (7 days from current date)
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return { start: start.getTime(), end: end.getTime() };
  }, [currentDate]);

  const availableSlots = useQuery(api.scheduler.getAvailableSlots, {
    meetingTypeId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Group slots by date
  const slotsByDate = useMemo(() => {
    if (!availableSlots) return new Map<string, typeof availableSlots>();

    const grouped = new Map<string, typeof availableSlots>();
    for (const slot of availableSlots) {
      const dateKey = new Date(slot.startTime).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(slot);
    }
    return grouped;
  }, [availableSlots]);

  // Generate dates for the calendar view
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
      return next;
    });
    setSelectedDate(null);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasSlots = (date: Date) => {
    return slotsByDate.has(date.toDateString());
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateWeek("prev")}
          disabled={isPast(calendarDates[0])}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {calendarDates[0].toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateWeek("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDates.map((date) => {
          const dateHasSlots = hasSlots(date);
          const isSelected = selectedDate?.toDateString() === date.toDateString();

          return (
            <button
              key={date.toISOString()}
              onClick={() => dateHasSlots && setSelectedDate(date)}
              disabled={!dateHasSlots || isPast(date)}
              className={cn(
                "p-2 text-center rounded-lg transition-colors",
                "hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday(date) && !isSelected && "border-2 border-primary",
                dateHasSlots && !isSelected && "bg-muted/50"
              )}
            >
              <div className="text-xs font-medium">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-lg font-semibold">{date.getDate()}</div>
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">
            Available times on {formatDateShort(selectedDate)}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slotsByDate.get(selectedDate.toDateString())?.map((slot) => {
              const isSlotSelected =
                selectedSlot?.startTime === slot.startTime;

              return (
                <Button
                  key={slot.startTime}
                  variant={isSlotSelected ? "default" : "outline"}
                  onClick={() => onSelectSlot(slot)}
                  className="text-sm"
                >
                  {formatTime(slot.startTime)}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {!selectedDate && (
        <p className="text-center text-muted-foreground py-4">
          Select a date to view available times
        </p>
      )}

      {availableSlots === undefined && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {availableSlots && availableSlots.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No available times in the next two weeks
        </p>
      )}
    </div>
  );
}
