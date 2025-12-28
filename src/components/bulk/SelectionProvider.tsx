"use client";

import * as React from "react";
import { createContext, useContext, useCallback, useState, useMemo } from "react";

// Types
export type SelectionEntityType = "contacts" | "deals" | "companies";

export interface SelectionItem {
  id: string;
  type: SelectionEntityType;
  data?: Record<string, unknown>;
}

export interface SelectionContextValue {
  // Selection state
  selectedItems: SelectionItem[];
  selectedIds: Set<string>;
  entityType: SelectionEntityType | null;

  // Selection actions
  select: (item: SelectionItem) => void;
  deselect: (id: string) => void;
  toggle: (item: SelectionItem) => void;
  selectAll: (items: SelectionItem[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;

  // Derived state
  hasSelection: boolean;
  selectionCount: number;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

interface SelectionProviderProps {
  children: React.ReactNode;
}

export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [entityType, setEntityType] = useState<SelectionEntityType | null>(null);

  // Memoized set of selected IDs for O(1) lookup
  const selectedIds = useMemo(() => {
    return new Set(selectedItems.map((item) => item.id));
  }, [selectedItems]);

  const select = useCallback((item: SelectionItem) => {
    setSelectedItems((prev) => {
      // If selecting a different entity type, clear previous selection
      if (prev.length > 0 && prev[0].type !== item.type) {
        setEntityType(item.type);
        return [item];
      }

      // If already selected, do nothing
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }

      setEntityType(item.type);
      return [...prev, item];
    });
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      if (newItems.length === 0) {
        setEntityType(null);
      }
      return newItems;
    });
  }, []);

  const toggle = useCallback((item: SelectionItem) => {
    setSelectedItems((prev) => {
      const isCurrentlySelected = prev.some((i) => i.id === item.id);

      if (isCurrentlySelected) {
        const newItems = prev.filter((i) => i.id !== item.id);
        if (newItems.length === 0) {
          setEntityType(null);
        }
        return newItems;
      }

      // If selecting a different entity type, clear previous selection
      if (prev.length > 0 && prev[0].type !== item.type) {
        setEntityType(item.type);
        return [item];
      }

      setEntityType(item.type);
      return [...prev, item];
    });
  }, []);

  const selectAll = useCallback((items: SelectionItem[]) => {
    if (items.length === 0) return;

    // All items must be of the same type
    const type = items[0].type;
    if (!items.every((item) => item.type === type)) {
      console.warn("Cannot select items of different types");
      return;
    }

    setEntityType(type);
    setSelectedItems(items);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
    setEntityType(null);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const value = useMemo(
    (): SelectionContextValue => ({
      selectedItems,
      selectedIds,
      entityType,
      select,
      deselect,
      toggle,
      selectAll,
      deselectAll,
      isSelected,
      hasSelection: selectedItems.length > 0,
      selectionCount: selectedItems.length,
    }),
    [
      selectedItems,
      selectedIds,
      entityType,
      select,
      deselect,
      toggle,
      selectAll,
      deselectAll,
      isSelected,
    ]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}

// Hook for specific entity type selection
export function useEntitySelection<T extends Record<string, unknown>>(
  type: SelectionEntityType
) {
  const selection = useSelection();

  const typedSelect = useCallback(
    (id: string, data?: T) => {
      selection.select({ id, type, data });
    },
    [selection, type]
  );

  const typedToggle = useCallback(
    (id: string, data?: T) => {
      selection.toggle({ id, type, data });
    },
    [selection, type]
  );

  const typedSelectAll = useCallback(
    (items: Array<{ id: string; data?: T }>) => {
      selection.selectAll(
        items.map((item) => ({ id: item.id, type, data: item.data }))
      );
    },
    [selection, type]
  );

  // Only return items of this type
  const typedItems = useMemo(() => {
    return selection.selectedItems.filter((item) => item.type === type) as Array<
      SelectionItem & { data?: T }
    >;
  }, [selection.selectedItems, type]);

  const typedIds = useMemo(() => {
    return typedItems.map((item) => item.id);
  }, [typedItems]);

  return {
    ...selection,
    selectedItems: typedItems,
    selectedIds: new Set(typedIds),
    select: typedSelect,
    toggle: typedToggle,
    selectAll: typedSelectAll,
    // Only has selection if it's for this type
    hasSelection: typedItems.length > 0,
    selectionCount: typedItems.length,
    isActiveType: selection.entityType === type,
  };
}
