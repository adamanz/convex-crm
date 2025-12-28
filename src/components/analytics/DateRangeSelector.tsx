"use client";

import * as React from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, subYears } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getRange: () => DateRange;
}

export interface DateRangeSelectorProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  presets?: DateRangePreset[];
  showPresets?: boolean;
  align?: "start" | "center" | "end";
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: "Last 7 days",
    value: "7days",
    getRange: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Last 30 days",
    value: "30days",
    getRange: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "Last 90 days",
    value: "90days",
    getRange: () => ({
      from: subDays(new Date(), 89),
      to: new Date(),
    }),
  },
  {
    label: "This month",
    value: "thisMonth",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Last month",
    value: "lastMonth",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "This quarter",
    value: "thisQuarter",
    getRange: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const startMonth = quarter * 3;
      return {
        from: new Date(now.getFullYear(), startMonth, 1),
        to: now,
      };
    },
  },
  {
    label: "This year",
    value: "thisYear",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "Last year",
    value: "lastYear",
    getRange: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        from: startOfYear(lastYear),
        to: new Date(lastYear.getFullYear(), 11, 31),
      };
    },
  },
];

export function DateRangeSelector({
  value,
  onChange,
  className,
  presets = DEFAULT_PRESETS,
  showPresets = true,
  align = "start",
}: DateRangeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = preset.getRange();
    setSelectedPreset(preset.value);
    onChange?.(range);
    setOpen(false);
  };

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setSelectedPreset(null);
    onChange?.(range);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedPreset) {
      const preset = presets.find((p) => p.value === selectedPreset);
      if (preset) return preset.label;
    }
    if (value?.from) {
      if (value.to) {
        return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`;
      }
      return format(value.from, "MMM d, yyyy");
    }
    return "Select date range";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[240px]",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets sidebar */}
          {showPresets && (
            <div className="border-r p-2 space-y-1 min-w-[140px]">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Quick select
              </p>
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {/* Calendar */}
          <div className="p-3">
            <DateRangePicker
              value={value}
              onChange={handleCustomRangeChange}
              numberOfMonths={2}
              className="border-0 shadow-none w-auto"
            />
          </div>
        </div>

        {/* Footer with current selection */}
        {value?.from && (
          <div className="border-t p-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {value.to ? (
                <>
                  {format(value.from, "MMM d, yyyy")} - {format(value.to, "MMM d, yyyy")}
                </>
              ) : (
                format(value.from, "MMM d, yyyy")
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange?.(undefined);
                setSelectedPreset(null);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Export presets for custom use
export { DEFAULT_PRESETS };
