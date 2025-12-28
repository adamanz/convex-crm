"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "greaterThan"
  | "lessThan"
  | "between"
  | "inList"
  | "notInList"
  | "daysAgo"
  | "daysFromNow";

export interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  conjunction: "and" | "or";
}

export interface FieldDefinition {
  field: string;
  label: string;
  type: "string" | "number" | "date" | "array";
}

export interface OperatorDefinition {
  value: FilterOperator;
  label: string;
  types: string[];
}

interface FilterRowProps {
  filter: Filter;
  fields: FieldDefinition[];
  operators: OperatorDefinition[];
  onChange: (filter: Filter) => void;
  onRemove: () => void;
  showConjunction: boolean;
  isFirst: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function FilterRow({
  filter,
  fields,
  operators,
  onChange,
  onRemove,
  showConjunction,
  isFirst,
  className,
}: FilterRowProps) {
  const selectedField = fields.find((f) => f.field === filter.field);
  const fieldType = selectedField?.type ?? "string";

  // Filter operators based on field type
  const availableOperators = operators.filter((op) =>
    op.types.includes(fieldType)
  );

  // Check if operator requires value input
  const operatorNeedsValue = !["isEmpty", "isNotEmpty"].includes(filter.operator);
  const operatorNeedsBetween = filter.operator === "between";
  const operatorNeedsList = ["inList", "notInList"].includes(filter.operator);

  // Handle field change
  const handleFieldChange = (fieldValue: string) => {
    const newField = fields.find((f) => f.field === fieldValue);
    const newType = newField?.type ?? "string";

    // Reset operator if current one is not valid for new field type
    const validOperators = operators.filter((op) => op.types.includes(newType));
    const currentOperatorValid = validOperators.some(
      (op) => op.value === filter.operator
    );

    onChange({
      ...filter,
      field: fieldValue,
      operator: currentOperatorValid
        ? filter.operator
        : validOperators[0]?.value ?? "equals",
      value: "", // Reset value when field changes
    });
  };

  // Handle operator change
  const handleOperatorChange = (operatorValue: string) => {
    const newOperator = operatorValue as FilterOperator;

    // Reset value for certain operators
    let newValue: unknown = filter.value;
    if (newOperator === "isEmpty" || newOperator === "isNotEmpty") {
      newValue = null;
    } else if (newOperator === "between") {
      newValue = { min: "", max: "" };
    } else if (newOperator === "inList" || newOperator === "notInList") {
      newValue = [];
    } else if (typeof filter.value === "object" || Array.isArray(filter.value)) {
      newValue = "";
    }

    onChange({
      ...filter,
      operator: newOperator,
      value: newValue,
    });
  };

  // Handle value change
  const handleValueChange = (newValue: unknown) => {
    onChange({
      ...filter,
      value: newValue,
    });
  };

  // Handle conjunction change
  const handleConjunctionChange = (conjunction: "and" | "or") => {
    onChange({
      ...filter,
      conjunction,
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Conjunction selector (shown for all except first row) */}
      {!isFirst && showConjunction && (
        <Select
          value={filter.conjunction}
          onValueChange={(v) => handleConjunctionChange(v as "and" | "or")}
        >
          <SelectTrigger className="w-20 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Placeholder for first row alignment */}
      {isFirst && showConjunction && <div className="w-20" />}

      {/* Field selector */}
      <Select value={filter.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-40 h-9">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.field} value={field.field}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select value={filter.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-36 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {operatorNeedsValue && (
        <div className="flex-1">
          {operatorNeedsBetween ? (
            <BetweenInput
              value={filter.value as { min: string; max: string } | undefined}
              onChange={handleValueChange}
              fieldType={fieldType}
            />
          ) : operatorNeedsList ? (
            <ListInput
              value={filter.value as string[] | undefined}
              onChange={handleValueChange}
            />
          ) : (
            <ValueInput
              value={filter.value as string | number | undefined}
              onChange={handleValueChange}
              fieldType={fieldType}
            />
          )}
        </div>
      )}

      {/* No value needed placeholder */}
      {!operatorNeedsValue && <div className="flex-1" />}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// Value Input Components
// ============================================================================

interface ValueInputProps {
  value: string | number | undefined;
  onChange: (value: unknown) => void;
  fieldType: string;
}

function ValueInput({ value, onChange, fieldType }: ValueInputProps) {
  const inputType =
    fieldType === "number" || fieldType === "date" ? "number" : "text";

  return (
    <Input
      type={inputType}
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        if (inputType === "number") {
          onChange(val === "" ? "" : Number(val));
        } else {
          onChange(val);
        }
      }}
      placeholder="Enter value..."
      className="h-9"
    />
  );
}

interface BetweenInputProps {
  value: { min: string | number; max: string | number } | undefined;
  onChange: (value: unknown) => void;
  fieldType: string;
}

function BetweenInput({ value, onChange, fieldType }: BetweenInputProps) {
  const inputType = fieldType === "number" ? "number" : "text";

  return (
    <div className="flex items-center gap-2">
      <Input
        type={inputType}
        value={value?.min ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange({
            min: inputType === "number" && val !== "" ? Number(val) : val,
            max: value?.max ?? "",
          });
        }}
        placeholder="Min"
        className="h-9"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type={inputType}
        value={value?.max ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange({
            min: value?.min ?? "",
            max: inputType === "number" && val !== "" ? Number(val) : val,
          });
        }}
        placeholder="Max"
        className="h-9"
      />
    </div>
  );
}

interface ListInputProps {
  value: string[] | undefined;
  onChange: (value: unknown) => void;
}

function ListInput({ value, onChange }: ListInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...(value ?? []), inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...(value ?? [])];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add value and press Enter"
          className="h-9"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          className="shrink-0"
        >
          Add
        </Button>
      </div>
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary rounded-md"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterRow;
