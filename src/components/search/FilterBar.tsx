"use client";

import * as React from "react";
import { X, Filter, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type FilterValue = string | string[] | { from?: Date; to?: Date } | undefined;

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: "select" | "multi-select" | "date-range";
  options?: FilterOption[];
  placeholder?: string;
}

export interface ActiveFilter {
  id: string;
  value: FilterValue;
  label: string;
  displayValue: string;
}

export interface FilterBarProps {
  filters: FilterDefinition[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filterId: string, value: FilterValue) => void;
  onClearFilter: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
}

// ============================================================================
// FilterBar Component
// ============================================================================

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilter,
  onClearAll,
  className,
}: FilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        {filters.map((filter) => (
          <FilterControl
            key={filter.id}
            filter={filter}
            value={activeFilters.find((f) => f.id === filter.id)?.value}
            onChange={(value) => onFilterChange(filter.id, value)}
          />
        ))}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter) => (
            <FilterChip
              key={filter.id}
              filter={filter}
              onRemove={() => onClearFilter(filter.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FilterControl - Individual filter dropdown/picker
// ============================================================================

interface FilterControlProps {
  filter: FilterDefinition;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  const isActive = value !== undefined && value !== "";

  switch (filter.type) {
    case "select":
      return (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v || undefined)}
        >
          <SelectTrigger
            className={cn(
              "h-8 w-auto min-w-[120px] gap-1",
              isActive && "border-primary text-primary"
            )}
          >
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multi-select":
      return (
        <MultiSelectFilter
          filter={filter}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          isActive={isActive}
        />
      );

    case "date-range":
      return (
        <DateRangeFilter
          filter={filter}
          value={
            value && typeof value === "object" && "from" in value
              ? value
              : undefined
          }
          onChange={onChange}
          isActive={isActive}
        />
      );

    default:
      return null;
  }
}

// ============================================================================
// MultiSelectFilter - Filter with multiple selection
// ============================================================================

interface MultiSelectFilterProps {
  filter: FilterDefinition;
  value: string[];
  onChange: (value: FilterValue) => void;
  isActive: boolean;
}

function MultiSelectFilter({
  filter,
  value,
  onChange,
  isActive,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue.length > 0 ? newValue : undefined);
  };

  const selectedLabels = filter.options
    ?.filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)
    .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1",
            isActive && "border-primary text-primary"
          )}
        >
          {value.length > 0 ? (
            <span className="max-w-[150px] truncate">{selectedLabels}</span>
          ) : (
            <span>{filter.placeholder || filter.label}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1">
          {filter.options?.map((option) => (
            <button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md",
                "hover:bg-accent transition-colors",
                value.includes(option.value) && "bg-accent"
              )}
            >
              <div
                className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center",
                  value.includes(option.value)
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                )}
              >
                {value.includes(option.value) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {option.color && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// DateRangeFilter - Date range picker filter
// ============================================================================

interface DateRangeFilterProps {
  filter: FilterDefinition;
  value: { from?: Date; to?: Date } | undefined;
  onChange: (value: FilterValue) => void;
  isActive: boolean;
}

function DateRangeFilter({
  filter,
  value,
  onChange,
  isActive,
}: DateRangeFilterProps) {
  return (
    <DateRangePicker
      value={value ? { from: value.from, to: value.to } : undefined}
      onChange={(range) =>
        onChange(range?.from ? { from: range.from, to: range.to } : undefined)
      }
      placeholder={filter.placeholder || filter.label}
      className={cn(
        "h-8 w-auto min-w-[200px]",
        isActive && "border-primary text-primary"
      )}
      clearable
    />
  );
}

// ============================================================================
// FilterChip - Active filter display chip
// ============================================================================

interface FilterChipProps {
  filter: ActiveFilter;
  onRemove: () => void;
}

function FilterChip({ filter, onRemove }: FilterChipProps) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 py-1 px-2 pr-1 font-normal"
    >
      <span className="text-muted-foreground">{filter.label}:</span>
      <span className="font-medium">{filter.displayValue}</span>
      <button
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
        aria-label={`Remove ${filter.label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// ============================================================================
// useFilterBar - Hook for managing filter state
// ============================================================================

export interface UseFilterBarOptions {
  filters: FilterDefinition[];
  initialValues?: Record<string, FilterValue>;
  onFiltersChange?: (filters: Record<string, FilterValue>) => void;
}

export function useFilterBar({
  filters,
  initialValues = {},
  onFiltersChange,
}: UseFilterBarOptions) {
  const [filterValues, setFilterValues] = React.useState<
    Record<string, FilterValue>
  >(initialValues);

  // Compute active filters for display
  const activeFilters: ActiveFilter[] = React.useMemo(() => {
    return Object.entries(filterValues)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([id, value]) => {
        const filterDef = filters.find((f) => f.id === id);
        if (!filterDef) return null;

        let displayValue = "";
        if (typeof value === "string") {
          displayValue =
            filterDef.options?.find((o) => o.value === value)?.label || value;
        } else if (Array.isArray(value)) {
          displayValue = value
            .map((v) => filterDef.options?.find((o) => o.value === v)?.label || v)
            .join(", ");
        } else if (value && typeof value === "object" && "from" in value) {
          const from = value.from
            ? value.from.toLocaleDateString()
            : "";
          const to = value.to ? value.to.toLocaleDateString() : "";
          displayValue = to ? `${from} - ${to}` : from;
        }

        return {
          id,
          value,
          label: filterDef.label,
          displayValue,
        };
      })
      .filter((f): f is ActiveFilter => f !== null);
  }, [filterValues, filters]);

  const handleFilterChange = React.useCallback(
    (filterId: string, value: FilterValue) => {
      const newValues = { ...filterValues, [filterId]: value };
      if (value === undefined || value === "") {
        delete newValues[filterId];
      }
      setFilterValues(newValues);
      onFiltersChange?.(newValues);
    },
    [filterValues, onFiltersChange]
  );

  const handleClearFilter = React.useCallback(
    (filterId: string) => {
      const newValues = { ...filterValues };
      delete newValues[filterId];
      setFilterValues(newValues);
      onFiltersChange?.(newValues);
    },
    [filterValues, onFiltersChange]
  );

  const handleClearAll = React.useCallback(() => {
    setFilterValues({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  return {
    filterValues,
    activeFilters,
    onFilterChange: handleFilterChange,
    onClearFilter: handleClearFilter,
    onClearAll: handleClearAll,
  };
}

// ============================================================================
// Pre-built filter definitions for common CRM entities
// ============================================================================

export const contactFilterDefinitions: FilterDefinition[] = [
  {
    id: "source",
    label: "Source",
    type: "select",
    placeholder: "All sources",
    options: [
      { value: "website", label: "Website" },
      { value: "referral", label: "Referral" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "cold_outreach", label: "Cold Outreach" },
      { value: "event", label: "Event" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    type: "multi-select",
    placeholder: "Select tags",
    options: [
      { value: "vip", label: "VIP", color: "#f59e0b" },
      { value: "lead", label: "Lead", color: "#3b82f6" },
      { value: "customer", label: "Customer", color: "#22c55e" },
      { value: "churned", label: "Churned", color: "#ef4444" },
    ],
  },
  {
    id: "createdAt",
    label: "Created",
    type: "date-range",
    placeholder: "Select date range",
  },
];

export const companyFilterDefinitions: FilterDefinition[] = [
  {
    id: "industry",
    label: "Industry",
    type: "select",
    placeholder: "All industries",
    options: [
      { value: "technology", label: "Technology" },
      { value: "finance", label: "Finance" },
      { value: "healthcare", label: "Healthcare" },
      { value: "retail", label: "Retail" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "size",
    label: "Company Size",
    type: "select",
    placeholder: "All sizes",
    options: [
      { value: "1-10", label: "1-10 employees" },
      { value: "11-50", label: "11-50 employees" },
      { value: "51-200", label: "51-200 employees" },
      { value: "201-500", label: "201-500 employees" },
      { value: "501+", label: "500+ employees" },
    ],
  },
  {
    id: "createdAt",
    label: "Created",
    type: "date-range",
    placeholder: "Select date range",
  },
];

export const dealFilterDefinitions: FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    placeholder: "All statuses",
    options: [
      { value: "open", label: "Open", color: "#3b82f6" },
      { value: "won", label: "Won", color: "#22c55e" },
      { value: "lost", label: "Lost", color: "#ef4444" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    type: "multi-select",
    placeholder: "Select tags",
    options: [
      { value: "hot", label: "Hot Lead", color: "#ef4444" },
      { value: "enterprise", label: "Enterprise", color: "#8b5cf6" },
      { value: "renewal", label: "Renewal", color: "#f59e0b" },
      { value: "upsell", label: "Upsell", color: "#22c55e" },
    ],
  },
  {
    id: "expectedCloseDate",
    label: "Close Date",
    type: "date-range",
    placeholder: "Select date range",
  },
];

export default FilterBar;
