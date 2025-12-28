"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineValidationProps {
  entityType: "contact" | "company" | "deal";
  field: string;
  value: unknown;
  entityId?: string;
  className?: string;
  showOnlyWhenDirty?: boolean;
  isDirty?: boolean;
}

/**
 * Inline field validation component that shows validation errors
 * Can be placed below form inputs to display real-time validation feedback
 */
export function InlineValidation({
  entityType,
  field,
  value,
  entityId,
  className,
  showOnlyWhenDirty = false,
  isDirty = true,
}: InlineValidationProps) {
  // Debounce the validation to avoid too many queries
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const validation = useQuery(api.validation.validateFieldValue, {
    entityType,
    field,
    value: debouncedValue,
    entityId,
  });

  // Don't show anything if not dirty and that option is set
  if (showOnlyWhenDirty && !isDirty) {
    return null;
  }

  // Don't show anything while loading or if valid
  if (validation === undefined || validation.isValid) {
    return null;
  }

  return (
    <div className={cn("space-y-1 mt-1", className)}>
      {validation.errors.map((error, i) => (
        <div
          key={i}
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error.error}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to use validation in forms
 */
export function useFieldValidation(
  entityType: "contact" | "company" | "deal",
  field: string,
  value: unknown,
  entityId?: string
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const validation = useQuery(api.validation.validateFieldValue, {
    entityType,
    field,
    value: debouncedValue,
    entityId,
  });

  return {
    isValidating: validation === undefined,
    isValid: validation?.isValid ?? true,
    errors: validation?.errors ?? [],
  };
}

/**
 * Hook to validate an entire entity
 */
export function useEntityValidation(
  entityType: "contact" | "company" | "deal",
  entityId: string
) {
  const validation = useQuery(api.validation.validateEntity, {
    entityType,
    entityId,
  });

  return {
    isValidating: validation === undefined,
    isValid: validation?.isValid ?? true,
    errors: validation?.errors ?? [],
    getFieldErrors: (field: string) =>
      (validation?.errors ?? []).filter((e) => e.field === field),
  };
}

export default InlineValidation;
