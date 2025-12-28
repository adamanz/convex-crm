"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { RuleType } from "./RuleTypeSelector";

export interface RuleConfig {
  formatType?: "email" | "phone" | "url";
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: string[];
}

interface RuleConfigEditorProps {
  ruleType: RuleType;
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
  disabled?: boolean;
}

export function RuleConfigEditor({
  ruleType,
  config,
  onChange,
  disabled,
}: RuleConfigEditorProps) {
  const [newAllowedValue, setNewAllowedValue] = useState("");

  const handleAddAllowedValue = () => {
    if (!newAllowedValue.trim()) return;

    const currentValues = config.allowedValues || [];
    if (!currentValues.includes(newAllowedValue.trim())) {
      onChange({
        ...config,
        allowedValues: [...currentValues, newAllowedValue.trim()],
      });
    }
    setNewAllowedValue("");
  };

  const handleRemoveAllowedValue = (value: string) => {
    onChange({
      ...config,
      allowedValues: (config.allowedValues || []).filter((v) => v !== value),
    });
  };

  switch (ruleType) {
    case "required":
      return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No additional configuration needed. The field will be required to have a non-empty value.
          </p>
        </div>
      );

    case "format":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formatType">Format Type</Label>
            <Select
              value={config.formatType || "email"}
              onValueChange={(v) => onChange({ ...config, formatType: v as RuleConfig["formatType"] })}
              disabled={disabled}
            >
              <SelectTrigger id="formatType">
                <SelectValue placeholder="Select format type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Address</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {config.formatType === "email" && "Validates standard email format (user@domain.com)"}
              {config.formatType === "phone" && "Validates phone numbers with optional country code"}
              {config.formatType === "url" && "Validates web URLs (http/https)"}
              {!config.formatType && "Select a format type to validate"}
            </p>
          </div>
        </div>
      );

    case "range":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min">Minimum Value</Label>
              <Input
                id="min"
                type="number"
                value={config.min ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="No minimum"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Maximum Value</Label>
              <Input
                id="max"
                type="number"
                value={config.max ?? ""}
                onChange={(e) =>
                  onChange({
                    ...config,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="No maximum"
                disabled={disabled}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Set minimum and/or maximum values for numeric fields.
          </p>
        </div>
      );

    case "regex":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pattern">Regular Expression Pattern</Label>
            <Input
              id="pattern"
              value={config.pattern || ""}
              onChange={(e) => onChange({ ...config, pattern: e.target.value })}
              placeholder="e.g., ^[A-Z]{2}-\d{4}$"
              className="font-mono text-sm"
              disabled={disabled}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter a valid JavaScript regular expression pattern.
            </p>
          </div>

          {/* Pattern preview */}
          {config.pattern && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Pattern Preview
              </p>
              <code className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                /{config.pattern}/
              </code>
            </div>
          )}
        </div>
      );

    case "unique":
      return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No additional configuration needed. The field value must be unique across all entities of this type.
          </p>
        </div>
      );

    case "lookup":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Allowed Values</Label>
            <div className="flex gap-2">
              <Input
                value={newAllowedValue}
                onChange={(e) => setNewAllowedValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAllowedValue();
                  }
                }}
                placeholder="Enter a value and press Enter"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAllowedValue}
                disabled={disabled || !newAllowedValue.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Allowed values list */}
          {config.allowedValues && config.allowedValues.length > 0 ? (
            <div className="space-y-2">
              <Label>Current Values</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                {config.allowedValues.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {value}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAllowedValue(value)}
                        className="ml-1 rounded-full p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {value}</span>
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No allowed values defined yet. Add values that the field can contain.
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default RuleConfigEditor;
