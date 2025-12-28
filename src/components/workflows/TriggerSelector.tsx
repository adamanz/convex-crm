"use client";

import * as React from "react";
import {
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  Clock,
  MousePointer,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TriggerType =
  | "manual"
  | "deal_stage_change"
  | "new_contact"
  | "inbound_message"
  | "scheduled";

interface TriggerOption {
  type: TriggerType;
  label: string;
  description: string;
  icon: LucideIcon;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: "manual",
    label: "Manual",
    description: "Triggered manually by a user",
    icon: MousePointer,
  },
  {
    type: "new_contact",
    label: "New Contact",
    description: "When a new contact is created",
    icon: UserPlus,
  },
  {
    type: "deal_stage_change",
    label: "Deal Stage Change",
    description: "When a deal moves to a specific stage",
    icon: ArrowRightLeft,
  },
  {
    type: "inbound_message",
    label: "Inbound Message",
    description: "When a new message is received",
    icon: MessageSquare,
  },
  {
    type: "scheduled",
    label: "Scheduled",
    description: "Run on a set schedule",
    icon: Clock,
  },
];

interface TriggerSelectorProps {
  value: TriggerType;
  onChange: (type: TriggerType) => void;
  className?: string;
}

export function TriggerSelector({
  value,
  onChange,
  className,
}: TriggerSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground">
        Trigger
      </label>
      <div className="grid grid-cols-1 gap-2">
        {TRIGGER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onChange(option.type)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for inline display
interface TriggerBadgeProps {
  type: TriggerType;
  className?: string;
}

export function TriggerBadge({ type, className }: TriggerBadgeProps) {
  const option = TRIGGER_OPTIONS.find((o) => o.type === type);
  if (!option) return null;

  const Icon = option.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{option.label}</span>
    </div>
  );
}

export { TRIGGER_OPTIONS };
