"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  FileWarning,
  Hash,
  Regex,
  ShieldCheck,
  List,
} from "lucide-react";

export type RuleType = "required" | "format" | "range" | "regex" | "unique" | "lookup";

interface RuleTypeSelectorProps {
  value: RuleType;
  onChange: (value: RuleType) => void;
  disabled?: boolean;
}

const RULE_TYPE_OPTIONS: Array<{
  value: RuleType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    value: "required",
    label: "Required",
    description: "Field must have a value",
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  },
  {
    value: "format",
    label: "Format",
    description: "Email, phone, or URL pattern",
    icon: FileWarning,
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  },
  {
    value: "range",
    label: "Range",
    description: "Min/max for numbers",
    icon: Hash,
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  },
  {
    value: "regex",
    label: "Regex",
    description: "Custom pattern matching",
    icon: Regex,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800",
  },
  {
    value: "unique",
    label: "Unique",
    description: "No duplicate values",
    icon: ShieldCheck,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  },
  {
    value: "lookup",
    label: "Lookup",
    description: "Value from allowed list",
    icon: List,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800",
  },
];

export function RuleTypeSelector({ value, onChange, disabled }: RuleTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Rule Type</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {RULE_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                isSelected
                  ? cn(option.color, "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100")
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    isSelected ? "bg-white/50 dark:bg-black/20" : "bg-zinc-100 dark:bg-zinc-800"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isSelected ? "" : "text-zinc-500 dark:text-zinc-400")} />
                </div>
                <span className={cn("font-medium", isSelected ? "" : "text-zinc-900 dark:text-zinc-100")}>
                  {option.label}
                </span>
              </div>
              <p className={cn("text-xs", isSelected ? "opacity-80" : "text-zinc-500 dark:text-zinc-400")}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RuleTypeSelector;
