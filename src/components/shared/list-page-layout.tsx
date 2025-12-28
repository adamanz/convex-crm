"use client";

import { ReactNode, useState } from "react";
import { Search, Plus, Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ListPageLayoutProps {
  // Header
  title: string;
  description?: string;
  icon?: ReactNode;

  // Search
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  // Filters
  filters?: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    isActive?: boolean;
  }>;
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  customFilters?: ReactNode;

  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryActions?: ReactNode;

  // Active filter badge (e.g., smart list)
  activeFilterBadge?: {
    label: string;
    count?: number;
    onClear: () => void;
  };

  // Sidebar (e.g., smart lists)
  sidebar?: ReactNode;
  sidebarWidth?: string;

  // Content
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
}

export function ListPageLayout({
  title,
  description,
  icon,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  customFilters,
  primaryAction,
  secondaryActions,
  activeFilterBadge,
  sidebar,
  sidebarWidth = "w-64",
  children,
  isLoading = false,
  isEmpty = false,
  emptyState,
}: ListPageLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {sidebar && (
        <aside className={cn(
          "hidden shrink-0 overflow-y-auto border-r border-zinc-100 bg-zinc-50/50 lg:block dark:border-zinc-800/50 dark:bg-zinc-900/50",
          sidebarWidth
        )}>
          {sidebar}
        </aside>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
                {description && (
                  <p className="text-[13px] text-zinc-500">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {secondaryActions}
              {primaryAction && (
                <Button onClick={primaryAction.onClick} size="sm">
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Badge */}
          {activeFilterBadge && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
                <Filter className="h-3 w-3" />
                {activeFilterBadge.label}
                {activeFilterBadge.count !== undefined && (
                  <span className="ml-1 rounded-full bg-zinc-200 px-1.5 text-[10px] font-semibold dark:bg-zinc-700">
                    {activeFilterBadge.count}
                  </span>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={activeFilterBadge.onClear}
                className="h-7 px-2 text-[12px]"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Search & Filters Row */}
          {(onSearchChange || filters || customFilters) && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              {onSearchChange && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-9 pl-9 text-[13px]"
                  />
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-1.5">
                {filters?.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onFilterChange?.(filter.id)}
                    className="h-8 gap-1.5 text-[12px]"
                  >
                    {filter.icon}
                    {filter.label}
                  </Button>
                ))}
                {customFilters}
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <ListPageSkeleton />
          ) : isEmpty && emptyState ? (
            emptyState
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function ListPageSkeleton() {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="hidden h-4 w-24 lg:block" />
        </div>
      ))}
    </div>
  );
}

// List item component for consistent row styling
interface ListItemProps {
  href?: string;
  onClick?: () => void;
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  metadata?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ListItem({
  href,
  onClick,
  avatar,
  title,
  subtitle,
  metadata,
  badges,
  actions,
  className,
}: ListItemProps) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? { href } : { onClick };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "flex items-center gap-4 px-6 py-3.5 transition-colors",
        (href || onClick) && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        className
      )}
    >
      {avatar}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
            {title}
          </span>
          {badges}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>

      {metadata && (
        <div className="hidden items-center gap-4 text-[12px] text-zinc-500 md:flex">
          {metadata}
        </div>
      )}

      {actions && (
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </Wrapper>
  );
}

// Empty state for list pages
interface ListEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  searchQuery?: string;
}

export function ListEmptyState({
  icon,
  title,
  description,
  action,
  searchQuery,
}: ListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </div>
      <h3 className="mt-5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
        {searchQuery ? `No results for "${searchQuery}"` : title}
      </h3>
      <p className="mt-1.5 text-[13px] text-zinc-500 text-center max-w-sm">
        {searchQuery ? "Try adjusting your search terms or filters" : description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
