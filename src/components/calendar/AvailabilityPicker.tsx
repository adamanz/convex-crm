"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  addDays,
  startOfDay,
  setHours,
  setMinutes,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";

export interface TimeSlot {
  time: Date;
  available: boolean;
}

export interface AvailabilityPickerProps {
  availableSlots?: TimeSlot[];
  busyTimes?: Array<{ start: number; end: number }>;
  selectedSlot?: Date;
  onSlotSelect?: (slot: Date) => void;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  daysToShow?: number;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

function generateSlots(
  date: Date,
  startHour: number,
  endHour: number,
  slotDuration: number,
  busyTimes: Array<{ start: number; end: number }>
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotTime = setMinutes(setHours(startOfDay(date), hour), minute);

      // Check if slot is in the past
      if (isBefore(slotTime, now)) {
        slots.push({ time: slotTime, available: false });
        continue;
      }

      // Check if slot overlaps with busy times
      const slotStart = slotTime.getTime();
      const slotEnd = slotStart + slotDuration * 60 * 1000;
      const isBusy = busyTimes.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      );

      slots.push({ time: slotTime, available: !isBusy });
    }
  }

  return slots;
}

export function AvailabilityPicker({
  availableSlots,
  busyTimes = [],
  selectedSlot,
  onSlotSelect,
  startHour = 9,
  endHour = 17,
  slotDuration = 30,
  daysToShow = 5,
  minDate,
  maxDate,
  className,
}: AvailabilityPickerProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = startOfDay(new Date());
    return minDate && isAfter(minDate, today) ? startOfDay(minDate) : today;
  });

  const days = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));
  }, [startDate, daysToShow]);

  const slotsByDay = useMemo(() => {
    if (availableSlots) {
      // Group provided slots by day
      const map = new Map<string, TimeSlot[]>();
      days.forEach((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const daySlots = availableSlots.filter((slot) =>
          isSameDay(slot.time, day)
        );
        map.set(dayKey, daySlots);
      });
      return map;
    }

    // Generate slots based on business hours
    const map = new Map<string, TimeSlot[]>();
    days.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      map.set(
        dayKey,
        generateSlots(day, startHour, endHour, slotDuration, busyTimes)
      );
    });
    return map;
  }, [days, availableSlots, busyTimes, startHour, endHour, slotDuration]);

  const handlePrev = useCallback(() => {
    const newStart = addDays(startDate, -daysToShow);
    const minAllowed = minDate ? startOfDay(minDate) : startOfDay(new Date());
    if (isAfter(newStart, minAllowed) || isSameDay(newStart, minAllowed)) {
      setStartDate(newStart);
    } else {
      setStartDate(minAllowed);
    }
  }, [startDate, daysToShow, minDate]);

  const handleNext = useCallback(() => {
    const newStart = addDays(startDate, daysToShow);
    if (maxDate && isAfter(newStart, maxDate)) {
      return;
    }
    setStartDate(newStart);
  }, [startDate, daysToShow, maxDate]);

  const canGoPrev = useMemo(() => {
    const minAllowed = minDate ? startOfDay(minDate) : startOfDay(new Date());
    return isAfter(startDate, minAllowed);
  }, [startDate, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const lastDay = addDays(startDate, daysToShow - 1);
    return isBefore(lastDay, maxDate);
  }, [startDate, daysToShow, maxDate]);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Available Times
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid gap-0 divide-x divide-zinc-200 dark:divide-zinc-800" style={{ gridTemplateColumns: `repeat(${daysToShow}, 1fr)` }}>
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const slots = slotsByDay.get(dayKey) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div key={dayKey} className="flex flex-col">
              {/* Day header */}
              <div
                className={cn(
                  "border-b border-zinc-200 p-2 text-center dark:border-zinc-800",
                  isToday && "bg-zinc-50 dark:bg-zinc-800/50"
                )}
              >
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    isToday
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* Time slots */}
              <div className="flex flex-col gap-1 p-2">
                {slots.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    No slots
                  </div>
                ) : (
                  slots.map((slot) => {
                    const isSelected =
                      selectedSlot &&
                      slot.time.getTime() === selectedSlot.getTime();

                    return (
                      <button
                        key={slot.time.getTime()}
                        onClick={() => slot.available && onSlotSelect?.(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                          slot.available
                            ? isSelected
                              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            : "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-600"
                        )}
                      >
                        {isSelected && <Check className="mr-1 h-3 w-3" />}
                        {format(slot.time, "h:mm a")}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 border-t border-zinc-200 px-4 py-2 text-xs dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-zinc-100 dark:bg-zinc-800" />
          <span className="text-zinc-500 dark:text-zinc-400">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-zinc-50 dark:bg-zinc-900" />
          <span className="text-zinc-500 dark:text-zinc-400">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-zinc-900 dark:bg-zinc-50" />
          <span className="text-zinc-500 dark:text-zinc-400">Selected</span>
        </div>
      </div>
    </div>
  );
}
