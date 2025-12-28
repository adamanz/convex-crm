"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface AvailabilityEditorProps {
  value: AvailabilitySlot[];
  onChange: (value: AvailabilitySlot[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export function AvailabilityEditor({ value, onChange }: AvailabilityEditorProps) {
  const getSlotForDay = (dayOfWeek: number): AvailabilitySlot => {
    const existing = value.find((s) => s.dayOfWeek === dayOfWeek);
    return (
      existing || {
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        enabled: false,
      }
    );
  };

  const updateSlot = (dayOfWeek: number, updates: Partial<AvailabilitySlot>) => {
    const existing = value.find((s) => s.dayOfWeek === dayOfWeek);
    if (existing) {
      onChange(
        value.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s))
      );
    } else {
      onChange([
        ...value,
        { dayOfWeek, startTime: "09:00", endTime: "17:00", enabled: false, ...updates },
      ]);
    }
  };

  const handleToggle = (dayOfWeek: number, enabled: boolean) => {
    updateSlot(dayOfWeek, { enabled });
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    time: string
  ) => {
    updateSlot(dayOfWeek, { [field]: time });
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day) => {
        const slot = getSlotForDay(day.value);
        return (
          <div
            key={day.value}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border transition-colors",
              slot.enabled ? "bg-muted/30" : "bg-muted/10 opacity-60"
            )}
          >
            <div className="w-24 flex items-center gap-2">
              <Switch
                checked={slot.enabled}
                onCheckedChange={(checked) => handleToggle(day.value, checked)}
              />
              <span className="text-sm font-medium">{day.short}</span>
            </div>

            {slot.enabled && (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      handleTimeChange(day.value, "startTime", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      handleTimeChange(day.value, "endTime", e.target.value)
                    }
                    className="w-32"
                  />
                </div>
              </div>
            )}

            {!slot.enabled && (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
