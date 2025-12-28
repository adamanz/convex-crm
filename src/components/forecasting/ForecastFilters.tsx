"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export interface ForecastFiltersProps {
  period?: "monthly" | "quarterly" | "yearly";
  pipelineId?: Id<"pipelines">;
  ownerId?: Id<"users">;
  startDate?: Date;
  endDate?: Date;
  pipelines?: Array<{ _id: Id<"pipelines">; name: string }>;
  users?: Array<{ _id: Id<"users">; firstName?: string; lastName?: string; email: string }>;
  onPeriodChange?: (period: "monthly" | "quarterly" | "yearly" | undefined) => void;
  onPipelineChange?: (pipelineId: Id<"pipelines"> | undefined) => void;
  onOwnerChange?: (ownerId: Id<"users"> | undefined) => void;
  onDateRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
  onRefresh?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ForecastFilters({
  period,
  pipelineId,
  ownerId,
  startDate,
  endDate,
  pipelines = [],
  users = [],
  onPeriodChange,
  onPipelineChange,
  onOwnerChange,
  onDateRangeChange,
  onRefresh,
  onReset,
  isLoading = false,
  className,
}: ForecastFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = period || pipelineId || ownerId || startDate || endDate;
  const activeFilterCount = [period, pipelineId, ownerId, startDate || endDate]
    .filter(Boolean).length;

  const getUserDisplayName = (user: { firstName?: string; lastName?: string; email: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email;
  };

  const handleReset = () => {
    onPeriodChange?.(undefined);
    onPipelineChange?.(undefined);
    onOwnerChange?.(undefined);
    onDateRangeChange?.(undefined, undefined);
    onReset?.();
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main filter row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <Select
              value={period || ""}
              onValueChange={(value) =>
                onPeriodChange?.(value as "monthly" | "quarterly" | "yearly" | undefined || undefined)
              }
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {/* Pipeline selector */}
            {pipelines.length > 0 && (
              <Select
                value={pipelineId || ""}
                onValueChange={(value) =>
                  onPipelineChange?.(value as Id<"pipelines"> | undefined || undefined)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Pipelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Pipelines</SelectItem>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline._id} value={pipeline._id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Owner selector */}
            {users.length > 0 && (
              <Select
                value={ownerId || ""}
                onValueChange={(value) =>
                  onOwnerChange?.(value as Id<"users"> | undefined || undefined)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Owners</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* More filters button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                isExpanded && "bg-muted"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              More
              <ChevronDown
                className={cn(
                  "h-4 w-4 ml-2 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </Button>

            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear ({activeFilterCount})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4 mr-2",
                    isLoading && "animate-spin"
                  )}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Expanded filters */}
          {isExpanded && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Date Range:</span>
                <DatePicker
                  value={startDate}
                  onChange={(date) => onDateRangeChange?.(date, endDate)}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <DatePicker
                  value={endDate}
                  onChange={(date) => onDateRangeChange?.(startDate, date)}
                />
              </div>
            </div>
          )}

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {period && (
                <FilterBadge
                  label={`Period: ${period}`}
                  onRemove={() => onPeriodChange?.(undefined)}
                />
              )}
              {pipelineId && (
                <FilterBadge
                  label={`Pipeline: ${pipelines.find((p) => p._id === pipelineId)?.name || pipelineId}`}
                  onRemove={() => onPipelineChange?.(undefined)}
                />
              )}
              {ownerId && (
                <FilterBadge
                  label={`Owner: ${getUserDisplayName(users.find((u) => u._id === ownerId) || { email: ownerId })}`}
                  onRemove={() => onOwnerChange?.(undefined)}
                />
              )}
              {(startDate || endDate) && (
                <FilterBadge
                  label={`Date: ${startDate?.toLocaleDateString() || "..."} - ${endDate?.toLocaleDateString() || "..."}`}
                  onRemove={() => onDateRangeChange?.(undefined, undefined)}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 hover:bg-muted-foreground/20 rounded"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
