"use client";

import * as React from "react";
import { Search, X, Filter, Calendar } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

export interface AuditLogFilters {
  userId?: Id<"users">;
  action?: string;
  entityType?: string;
  searchTerm?: string;
  startDate?: number;
  endDate?: number;
}

interface AuditLogFilterProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  className?: string;
}

export function AuditLogFilter({
  filters,
  onFiltersChange,
  className,
}: AuditLogFilterProps) {
  const [searchInput, setSearchInput] = React.useState(filters.searchTerm || "");
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  // Fetch filter options
  const actions = useQuery(api.auditLog.getDistinctActions);
  const entityTypes = useQuery(api.auditLog.getDistinctEntityTypes);
  const activeUsers = useQuery(api.auditLog.getActiveUsers);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.searchTerm) {
        onFiltersChange({ ...filters, searchTerm: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Count active filters
  const activeFilterCount = [
    filters.userId,
    filters.action,
    filters.entityType,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  // Format action for display
  const formatAction = (action: string): string => {
    return action
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Format entity type for display
  const formatEntityType = (entityType: string): string => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  // Get user display name
  const getUserDisplayName = (user: { firstName?: string; lastName?: string; email: string }): string => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.email;
  };

  // Convert date string to timestamp
  const dateToTimestamp = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return date.getTime();
  };

  // Convert timestamp to date string for input
  const timestampToDate = (timestamp?: number): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and main filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search activity log..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Entity type filter */}
        <Select
          value={filters.entityType || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              entityType: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes?.map((type) => (
              <SelectItem key={type} value={type}>
                {formatEntityType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action filter */}
        <Select
          value={filters.action || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              action: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions?.map((action) => (
              <SelectItem key={action} value={action}>
                {formatAction(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters popover */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2",
                activeFilterCount > 0 && "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                Advanced Filters
              </h4>

              {/* User filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  User
                </label>
                <Select
                  value={filters.userId || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      userId: value === "all" ? undefined : (value as Id<"users">),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {activeUsers?.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="date"
                      value={timestampToDate(filters.startDate)}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          startDate: dateToTimestamp(e.target.value),
                        })
                      }
                      className="pl-9"
                    />
                  </div>
                  <span className="text-zinc-400">to</span>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="date"
                      value={timestampToDate(filters.endDate)}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          endDate: dateToTimestamp(e.target.value),
                        })
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setIsAdvancedOpen(false);
                  }}
                  disabled={activeFilterCount === 0 && !searchInput}
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear button (visible when filters are active) */}
        {(activeFilterCount > 0 || searchInput) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {(activeFilterCount > 0 || filters.searchTerm) && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2"
            >
              Search: {filters.searchTerm}
              <button
                onClick={() => {
                  setSearchInput("");
                  onFiltersChange({ ...filters, searchTerm: undefined });
                }}
                className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.entityType && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2"
            >
              Entity: {formatEntityType(filters.entityType)}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, entityType: undefined })
                }
                className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.action && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2"
            >
              Action: {formatAction(filters.action)}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, action: undefined })
                }
                className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.userId && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2"
            >
              User filter active
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, userId: undefined })
                }
                className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2"
            >
              Date range active
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    startDate: undefined,
                    endDate: undefined,
                  })
                }
                className="ml-1 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
