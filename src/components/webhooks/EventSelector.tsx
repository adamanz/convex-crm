"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface EventCategory {
  name: string;
  events: { value: string; label: string }[];
}

const EVENT_CATEGORIES: EventCategory[] = [
  {
    name: "Contacts",
    events: [
      { value: "contact.created", label: "Contact Created" },
      { value: "contact.updated", label: "Contact Updated" },
      { value: "contact.deleted", label: "Contact Deleted" },
    ],
  },
  {
    name: "Companies",
    events: [
      { value: "company.created", label: "Company Created" },
      { value: "company.updated", label: "Company Updated" },
      { value: "company.deleted", label: "Company Deleted" },
    ],
  },
  {
    name: "Deals",
    events: [
      { value: "deal.created", label: "Deal Created" },
      { value: "deal.updated", label: "Deal Updated" },
      { value: "deal.stage_changed", label: "Deal Stage Changed" },
      { value: "deal.won", label: "Deal Won" },
      { value: "deal.lost", label: "Deal Lost" },
    ],
  },
  {
    name: "Activities",
    events: [
      { value: "activity.created", label: "Activity Created" },
      { value: "activity.completed", label: "Activity Completed" },
    ],
  },
  {
    name: "Messages",
    events: [
      { value: "message.received", label: "Message Received" },
      { value: "message.sent", label: "Message Sent" },
    ],
  },
];

interface EventSelectorProps {
  selectedEvents: string[];
  onChange: (events: string[]) => void;
  disabled?: boolean;
}

export function EventSelector({
  selectedEvents,
  onChange,
  disabled = false,
}: EventSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    EVENT_CATEGORIES.map((c) => c.name)
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleEvent = (eventValue: string) => {
    if (disabled) return;

    if (selectedEvents.includes(eventValue)) {
      onChange(selectedEvents.filter((e) => e !== eventValue));
    } else {
      onChange([...selectedEvents, eventValue]);
    }
  };

  const toggleAllInCategory = (category: EventCategory) => {
    if (disabled) return;

    const categoryEventValues = category.events.map((e) => e.value);
    const allSelected = categoryEventValues.every((e) =>
      selectedEvents.includes(e)
    );

    if (allSelected) {
      // Deselect all in category
      onChange(
        selectedEvents.filter((e) => !categoryEventValues.includes(e))
      );
    } else {
      // Select all in category
      const newEvents = new Set([...selectedEvents, ...categoryEventValues]);
      onChange(Array.from(newEvents));
    }
  };

  const selectAll = () => {
    if (disabled) return;
    const allEvents = EVENT_CATEGORIES.flatMap((c) =>
      c.events.map((e) => e.value)
    );
    onChange(allEvents);
  };

  const deselectAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const totalEvents = EVENT_CATEGORIES.reduce(
    (sum, c) => sum + c.events.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {selectedEvents.length} of {totalEvents} events selected
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={disabled || selectedEvents.length === totalEvents}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={deselectAll}
            disabled={disabled || selectedEvents.length === 0}
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {EVENT_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.includes(category.name);
          const categoryEventValues = category.events.map((e) => e.value);
          const selectedInCategory = categoryEventValues.filter((e) =>
            selectedEvents.includes(e)
          ).length;
          const allSelectedInCategory =
            selectedInCategory === category.events.length;
          const someSelectedInCategory =
            selectedInCategory > 0 && !allSelectedInCategory;

          return (
            <div key={category.name}>
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  !isExpanded && "border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                )}
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {category.name}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    ({selectedInCategory}/{category.events.length})
                  </span>
                </div>
                <div
                  className="flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllInCategory(category);
                  }}
                >
                  <Checkbox
                    checked={allSelectedInCategory}
                    // @ts-ignore - indeterminate is valid
                    indeterminate={someSelectedInCategory}
                    disabled={disabled}
                    className="mr-2"
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                  {category.events.map((event) => {
                    const isSelected = selectedEvents.includes(event.value);
                    return (
                      <div
                        key={event.value}
                        className={cn(
                          "flex items-center justify-between pl-11 pr-4 py-2.5 cursor-pointer transition-colors",
                          isSelected
                            ? "bg-zinc-50 dark:bg-zinc-800/50"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => toggleEvent(event.value)}
                      >
                        <div className="flex items-center gap-3">
                          <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {event.value}
                          </code>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {event.label}
                          </span>
                        </div>
                        <Checkbox
                          checked={isSelected}
                          disabled={disabled}
                          onCheckedChange={() => toggleEvent(event.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
