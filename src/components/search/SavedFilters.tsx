"use client";

import * as React from "react";
import {
  Bookmark,
  BookmarkPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FilterValue } from "./FilterBar";

// ============================================================================
// Types
// ============================================================================

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, FilterValue>;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface SavedFiltersProps {
  entityType: "contacts" | "companies" | "deals";
  savedFilters: SavedFilter[];
  activeFilterId?: string;
  currentFilters: Record<string, FilterValue>;
  onApplyFilter: (filter: SavedFilter) => void;
  onSaveFilter: (name: string, filters: Record<string, FilterValue>) => void;
  onUpdateFilter: (id: string, updates: Partial<SavedFilter>) => void;
  onDeleteFilter: (id: string) => void;
  onSetDefault: (id: string | undefined) => void;
  className?: string;
}

// ============================================================================
// SavedFilters Component
// ============================================================================

export function SavedFilters({
  entityType,
  savedFilters,
  activeFilterId,
  currentFilters,
  onApplyFilter,
  onSaveFilter,
  onUpdateFilter,
  onDeleteFilter,
  onSetDefault,
  className,
}: SavedFiltersProps) {
  const [savePopoverOpen, setSavePopoverOpen] = React.useState(false);
  const [newFilterName, setNewFilterName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const hasCurrentFilters = Object.keys(currentFilters).length > 0;
  const defaultFilter = savedFilters.find((f) => f.isDefault);

  const handleSave = () => {
    if (newFilterName.trim() && hasCurrentFilters) {
      onSaveFilter(newFilterName.trim(), currentFilters);
      setNewFilterName("");
      setSavePopoverOpen(false);
    }
  };

  const handleStartEdit = (filter: SavedFilter) => {
    setEditingId(filter.id);
    setEditingName(filter.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onUpdateFilter(id, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Saved Filters List */}
      <div className="flex items-center gap-1.5">
        <Bookmark className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Saved:</span>
      </div>

      {savedFilters.length === 0 ? (
        <span className="text-sm text-muted-foreground">
          No saved filters
        </span>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {savedFilters.map((filter) => (
            <SavedFilterItem
              key={filter.id}
              filter={filter}
              isActive={activeFilterId === filter.id}
              isEditing={editingId === filter.id}
              editingName={editingName}
              onEditingNameChange={setEditingName}
              onApply={() => onApplyFilter(filter)}
              onStartEdit={() => handleStartEdit(filter)}
              onSaveEdit={() => handleSaveEdit(filter.id)}
              onCancelEdit={handleCancelEdit}
              onDelete={() => onDeleteFilter(filter.id)}
              onSetDefault={() =>
                onSetDefault(filter.isDefault ? undefined : filter.id)
              }
              onUpdateWithCurrentFilters={
                hasCurrentFilters
                  ? () => onUpdateFilter(filter.id, { filters: currentFilters })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Save Current Filters Button */}
      {hasCurrentFilters && (
        <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1">
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-3" align="end">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Save current filters
                </label>
                <p className="text-xs text-muted-foreground">
                  Create a saved filter preset for quick access
                </p>
              </div>
              <Input
                placeholder="Filter name..."
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSavePopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!newFilterName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ============================================================================
// SavedFilterItem - Individual saved filter chip
// ============================================================================

interface SavedFilterItemProps {
  filter: SavedFilter;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onApply: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUpdateWithCurrentFilters?: () => void;
}

function SavedFilterItem({
  filter,
  isActive,
  isEditing,
  editingName,
  onEditingNameChange,
  onApply,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSetDefault,
  onUpdateWithCurrentFilters,
}: SavedFilterItemProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          className="h-7 w-[120px] text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSaveEdit();
            } else if (e.key === "Escape") {
              onCancelEdit();
            }
          }}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveEdit}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelEdit}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 group">
      <Badge
        variant={isActive ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-colors",
          !isActive && "hover:bg-accent"
        )}
        onClick={onApply}
      >
        {filter.name}
        {filter.isDefault && (
          <span className="ml-1 text-[10px] opacity-70">(default)</span>
        )}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={onApply}>
            <Check className="mr-2 h-4 w-4" />
            Apply filter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onStartEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          {onUpdateWithCurrentFilters && (
            <DropdownMenuItem onClick={onUpdateWithCurrentFilters}>
              <Bookmark className="mr-2 h-4 w-4" />
              Update with current
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSetDefault}>
            <Bookmark className="mr-2 h-4 w-4" />
            {filter.isDefault ? "Remove as default" : "Set as default"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// useSavedFilters - Hook for managing saved filters with localStorage
// ============================================================================

const SAVED_FILTERS_KEY_PREFIX = "crm-saved-filters-";

export function useSavedFilters(entityType: "contacts" | "companies" | "deals") {
  const storageKey = `${SAVED_FILTERS_KEY_PREFIX}${entityType}`;

  const [savedFilters, setSavedFilters] = React.useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = React.useState<string | undefined>();
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedFilters(parsed);
        // Auto-apply default filter
        const defaultFilter = parsed.find((f: SavedFilter) => f.isDefault);
        if (defaultFilter) {
          setActiveFilterId(defaultFilter.id);
        }
      }
    } catch {
      // Ignore parsing errors
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save to localStorage when filters change
  React.useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedFilters));
    } catch {
      // Ignore storage errors
    }
  }, [savedFilters, storageKey, isLoaded]);

  const saveFilter = React.useCallback(
    (name: string, filters: Record<string, FilterValue>) => {
      const now = Date.now();
      const newFilter: SavedFilter = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        filters,
        createdAt: now,
        updatedAt: now,
      };
      setSavedFilters((prev) => [...prev, newFilter]);
      setActiveFilterId(newFilter.id);
      return newFilter;
    },
    []
  );

  const updateFilter = React.useCallback(
    (id: string, updates: Partial<SavedFilter>) => {
      setSavedFilters((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
        )
      );
    },
    []
  );

  const deleteFilter = React.useCallback((id: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== id));
    setActiveFilterId((prev) => (prev === id ? undefined : prev));
  }, []);

  const setDefault = React.useCallback((id: string | undefined) => {
    setSavedFilters((prev) =>
      prev.map((f) => ({
        ...f,
        isDefault: f.id === id,
      }))
    );
  }, []);

  const applyFilter = React.useCallback((filter: SavedFilter) => {
    setActiveFilterId(filter.id);
    return filter.filters;
  }, []);

  const getActiveFilter = React.useCallback(() => {
    return savedFilters.find((f) => f.id === activeFilterId);
  }, [savedFilters, activeFilterId]);

  const getDefaultFilter = React.useCallback(() => {
    return savedFilters.find((f) => f.isDefault);
  }, [savedFilters]);

  return {
    savedFilters,
    activeFilterId,
    setActiveFilterId,
    saveFilter,
    updateFilter,
    deleteFilter,
    setDefault,
    applyFilter,
    getActiveFilter,
    getDefaultFilter,
    isLoaded,
  };
}

export default SavedFilters;
