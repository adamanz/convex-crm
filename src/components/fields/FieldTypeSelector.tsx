"use client";

import * as React from "react";
import {
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  ToggleLeft,
  Link,
  Mail,
  Phone,
  DollarSign,
  AlignLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type FieldType,
} from "@/types/customFields";

// Icon mapping for field types
const FIELD_TYPE_ICON_COMPONENTS: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  number: Hash,
  date: Calendar,
  select: ChevronDown,
  multiselect: CheckSquare,
  checkbox: ToggleLeft,
  url: Link,
  email: Mail,
  phone: Phone,
  currency: DollarSign,
  textarea: AlignLeft,
};

// Descriptions for each field type
const FIELD_TYPE_DESCRIPTIONS: Record<FieldType, string> = {
  text: "Short text input",
  number: "Numeric values",
  date: "Date picker",
  select: "Choose one option",
  multiselect: "Choose multiple options",
  checkbox: "True/false toggle",
  url: "Website links",
  email: "Email addresses",
  phone: "Phone numbers",
  currency: "Money values",
  textarea: "Multi-line text",
};

interface FieldTypeSelectorProps {
  value?: FieldType;
  onChange: (value: FieldType) => void;
  disabled?: boolean;
  className?: string;
}

export function FieldTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: FieldTypeSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedType = value;
  const SelectedIcon = selectedType
    ? FIELD_TYPE_ICON_COMPONENTS[selectedType]
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedType ? (
            <div className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon className="h-4 w-4 text-muted-foreground" />}
              <span>{FIELD_TYPE_LABELS[selectedType]}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select field type...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search field types..." />
          <CommandList>
            <CommandEmpty>No field type found.</CommandEmpty>
            <CommandGroup>
              {FIELD_TYPES.map((type) => {
                const Icon = FIELD_TYPE_ICON_COMPONENTS[type];
                return (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={() => {
                      onChange(type);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 py-2"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selectedType === type ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="font-medium">{FIELD_TYPE_LABELS[type]}</div>
                        <div className="text-xs text-muted-foreground">
                          {FIELD_TYPE_DESCRIPTIONS[type]}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Grid view of field types for initial selection
interface FieldTypeGridProps {
  value?: FieldType;
  onChange: (value: FieldType) => void;
  disabled?: boolean;
  className?: string;
}

export function FieldTypeGrid({
  value,
  onChange,
  disabled = false,
  className,
}: FieldTypeGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {FIELD_TYPES.map((type) => {
        const Icon = FIELD_TYPE_ICON_COMPONENTS[type];
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
              "hover:bg-accent hover:border-accent",
              isSelected && "border-primary bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium text-center",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            >
              {FIELD_TYPE_LABELS[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Inline icon for displaying a field type
interface FieldTypeIconProps {
  type: FieldType;
  className?: string;
  showLabel?: boolean;
}

export function FieldTypeIcon({
  type,
  className,
  showLabel = false,
}: FieldTypeIconProps) {
  const Icon = FIELD_TYPE_ICON_COMPONENTS[type];

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {FIELD_TYPE_LABELS[type]}
        </span>
      </div>
    );
  }

  return <Icon className={cn("h-4 w-4", className)} />;
}

export default FieldTypeSelector;
