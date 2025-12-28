"use client";

import * as React from "react";
import { usePaginatedQuery } from "convex/react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FullPageSpinner, TableSkeleton } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AuditLogEntry, AuditLogEntryData } from "./AuditLogEntry";
import { AuditLogFilter, AuditLogFilters } from "./AuditLogFilter";

const ITEMS_PER_PAGE = 25;

interface AuditLogTableProps {
  className?: string;
  showFilters?: boolean;
  entityType?: string;
  entityId?: string;
}

export function AuditLogTable({
  className,
  showFilters = true,
  entityType,
  entityId,
}: AuditLogTableProps) {
  const [filters, setFilters] = React.useState<AuditLogFilters>({});

  // Build filter object for query
  const queryFilter = React.useMemo(() => {
    const filter: AuditLogFilters = { ...filters };
    if (entityType) {
      filter.entityType = entityType;
    }
    return Object.keys(filter).length > 0 ? filter : undefined;
  }, [filters, entityType]);

  // Paginated query
  const {
    results,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.auditLog.list,
    {
      paginationOpts: { numItems: ITEMS_PER_PAGE },
      filter: queryFilter,
    },
    { initialNumItems: ITEMS_PER_PAGE }
  );

  // Handle refresh
  const handleRefresh = () => {
    // Trigger a re-fetch by toggling filters
    setFilters({ ...filters });
  };

  // If filtering by specific entity, use getByEntity instead
  const entityResults = entityId
    ? usePaginatedQuery(
        api.auditLog.list,
        {
          paginationOpts: { numItems: ITEMS_PER_PAGE },
          filter: { entityType: entityType || undefined },
        },
        { initialNumItems: ITEMS_PER_PAGE }
      )
    : null;

  const displayResults = entityId ? entityResults?.results : results;
  const displayStatus = entityId ? entityResults?.status : status;
  const displayLoadMore = entityId ? entityResults?.loadMore : loadMore;

  // Filter by entityId client-side if needed
  const filteredResults = React.useMemo(() => {
    if (!displayResults) return [];
    if (entityId) {
      return displayResults.filter((entry) => entry.entityId === entityId);
    }
    return displayResults;
  }, [displayResults, entityId]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilters && !entityId && (
        <AuditLogFilter filters={filters} onFiltersChange={setFilters} />
      )}

      {/* Header with count and refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {filteredResults.length > 0 && (
            <span>
              Showing {filteredResults.length} entries
              {displayStatus === "CanLoadMore" && " (more available)"}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Loading state */}
      {status === "LoadingFirstPage" && (
        <TableSkeleton rows={8} columns={4} />
      )}

      {/* Empty state */}
      {status !== "LoadingFirstPage" && filteredResults.length === 0 && (
        <EmptyState
          title="No activity found"
          description={
            Object.keys(filters).length > 0
              ? "Try adjusting your filters to see more results."
              : "Activity will appear here as changes are made to your data."
          }
          variant="search"
        />
      )}

      {/* Results list */}
      {filteredResults.length > 0 && (
        <div className="space-y-3">
          {filteredResults.map((entry) => (
            <AuditLogEntry
              key={entry._id}
              entry={entry as AuditLogEntryData}
              showEntityLink={!entityId}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {displayStatus === "CanLoadMore" && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => displayLoadMore?.(ITEMS_PER_PAGE)}
            disabled={displayStatus === "LoadingMore"}
            className="gap-2"
          >
            {displayStatus === "LoadingMore" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}

      {/* End of results */}
      {displayStatus === "Exhausted" && filteredResults.length > ITEMS_PER_PAGE && (
        <div className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          End of activity log
        </div>
      )}
    </div>
  );
}

// Compact version for embedding in detail pages
interface AuditLogTableCompactProps {
  entityType: string;
  entityId: string;
  limit?: number;
  className?: string;
}

export function AuditLogTableCompact({
  entityType,
  entityId,
  limit = 10,
  className,
}: AuditLogTableCompactProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.auditLog.list,
    {
      paginationOpts: { numItems: limit },
      filter: { entityType },
    },
    { initialNumItems: limit }
  );

  // Filter by entityId client-side
  const filteredResults = React.useMemo(() => {
    if (!results) return [];
    return results.filter((entry) => entry.entityId === entityId);
  }, [results, entityId]);

  if (status === "LoadingFirstPage") {
    return <TableSkeleton rows={3} columns={3} className={className} />;
  }

  if (filteredResults.length === 0) {
    return (
      <div className={cn("py-6 text-center text-sm text-zinc-500 dark:text-zinc-400", className)}>
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {filteredResults.slice(0, limit).map((entry) => (
        <AuditLogEntry
          key={entry._id}
          entry={entry as AuditLogEntryData}
          showEntityLink={false}
        />
      ))}
      {filteredResults.length > limit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => loadMore(limit)}
        >
          View more activity
        </Button>
      )}
    </div>
  );
}
