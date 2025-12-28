"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { FilterRow, Filter, FieldDefinition, OperatorDefinition } from "./FilterRow";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface FilterGroupEditorProps {
  filters: Filter[];
  fields: FieldDefinition[];
  operators: OperatorDefinition[];
  onChange: (filters: Filter[]) => void;
  maxFilters?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function FilterGroupEditor({
  filters,
  fields,
  operators,
  onChange,
  maxFilters = 10,
  className,
}: FilterGroupEditorProps) {
  // Generate a unique ID for a new filter
  const generateFilterId = () => {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new filter
  const handleAddFilter = () => {
    if (filters.length >= maxFilters) return;

    const newFilter: Filter = {
      id: generateFilterId(),
      field: fields[0]?.field ?? "",
      operator: "equals",
      value: "",
      conjunction: "and",
    };

    onChange([...filters, newFilter]);
  };

  // Update a filter
  const handleUpdateFilter = (index: number, updatedFilter: Filter) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    onChange(newFilters);
  };

  // Remove a filter
  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    onChange(newFilters);
  };

  // Check if we have any valid filters
  const hasValidFilters = filters.some(
    (f) => f.field && f.operator && (
      ["isEmpty", "isNotEmpty"].includes(f.operator) ||
      (f.value !== "" && f.value !== null && f.value !== undefined)
    )
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter rows */}
      {filters.length > 0 ? (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              fields={fields}
              operators={operators}
              onChange={(updatedFilter) => handleUpdateFilter(index, updatedFilter)}
              onRemove={() => handleRemoveFilter(index)}
              showConjunction={filters.length > 1}
              isFirst={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            No filters added yet. Add a filter to define your smart list criteria.
          </p>
          <Button onClick={handleAddFilter} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add your first filter
          </Button>
        </div>
      )}

      {/* Add filter button */}
      {filters.length > 0 && filters.length < maxFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddFilter}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add filter
        </Button>
      )}

      {/* Max filters warning */}
      {filters.length >= maxFilters && (
        <p className="text-sm text-muted-foreground text-center">
          Maximum of {maxFilters} filters reached
        </p>
      )}

      {/* Validation warning */}
      {filters.length > 0 && !hasValidFilters && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Please ensure all filters have valid values before saving.
          </span>
        </div>
      )}
    </div>
  );
}

export default FilterGroupEditor;
