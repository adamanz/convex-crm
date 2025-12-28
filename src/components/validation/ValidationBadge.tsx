"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationBadgeProps {
  entityType: "contact" | "company" | "deal";
  entityId: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ValidationBadge({
  entityType,
  entityId,
  showLabel = false,
  size = "sm",
  className,
}: ValidationBadgeProps) {
  const validation = useQuery(api.validation.validateEntity, {
    entityType,
    entityId,
  });

  if (validation === undefined) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
          size === "sm" ? "h-5 px-1.5" : "h-6 px-2",
          className
        )}
      >
        <Loader2 className={cn("animate-spin", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        {showLabel && <span className="ml-1">Validating...</span>}
      </Badge>
    );
  }

  if (validation.isValid) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                size === "sm" ? "h-5 px-1.5" : "h-6 px-2",
                className
              )}
            >
              <CheckCircle2 className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
              {showLabel && <span className="ml-1">Valid</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>All validation rules pass</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
              size === "sm" ? "h-5 px-1.5" : "h-6 px-2",
              className
            )}
          >
            <AlertTriangle className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
            {showLabel && (
              <span className="ml-1">
                {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Validation Errors:</p>
            <ul className="list-disc pl-4 text-sm">
              {validation.errors.slice(0, 5).map((error, i) => (
                <li key={i}>
                  <span className="font-medium">{error.field}:</span> {error.error}
                </li>
              ))}
              {validation.errors.length > 5 && (
                <li className="text-zinc-400">
                  +{validation.errors.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline field validation indicator
 */
interface FieldValidationProps {
  entityType: "contact" | "company" | "deal";
  field: string;
  value: unknown;
  entityId?: string;
  className?: string;
}

export function FieldValidation({
  entityType,
  field,
  value,
  entityId,
  className,
}: FieldValidationProps) {
  const validation = useQuery(api.validation.validateFieldValue, {
    entityType,
    field,
    value,
    entityId,
  });

  if (validation === undefined || validation.isValid) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {validation.errors.map((error, i) => (
        <p key={i} className="text-sm text-destructive">
          {error.error}
        </p>
      ))}
    </div>
  );
}

export default ValidationBadge;
