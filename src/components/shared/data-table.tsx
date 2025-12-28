"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, type EmptyStateVariant } from "./empty-state";
import { TableSkeleton } from "./loading-state";

// =============================================================================
// DataTableColumnHeader
// =============================================================================

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    getCanSort: () => boolean;
    toggleSorting: (desc?: boolean) => void;
  };
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}

// =============================================================================
// DataTablePagination
// =============================================================================

interface DataTablePaginationProps<TData> {
  table: TanstackTable<TData>;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50],
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 px-2 sm:flex-row",
        className
      )}
    >
      <div className="flex-1 text-sm text-muted-foreground">
        {totalRows > 0 ? (
          <>
            Showing {startRow} to {endRow} of {totalRows}{" "}
            {totalRows === 1 ? "row" : "rows"}
          </>
        ) : (
          "No rows"
        )}
      </div>
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DataTableToolbar
// =============================================================================

interface DataTableToolbarProps<TData> {
  table: TanstackTable<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  searchColumn,
  filterSlot,
  actionsSlot,
  className,
}: DataTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = React.useState("");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    } else {
      table.setGlobalFilter(value);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        {filterSlot}
      </div>
      {actionsSlot && (
        <div className="flex items-center gap-2">{actionsSlot}</div>
      )}
    </div>
  );
}

// =============================================================================
// DataTable
// =============================================================================

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyStateVariant?: EmptyStateVariant;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  enableSorting?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowSelectionChange?: (rows: Row<TData>[]) => void;
  className?: string;
  // Toolbar props
  showToolbar?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyStateVariant = "default",
  emptyStateTitle,
  emptyStateDescription,
  emptyStateActionLabel,
  onEmptyStateAction,
  enableRowSelection = false,
  enablePagination = true,
  enableSorting = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onRowSelectionChange,
  className,
  showToolbar = false,
  searchPlaceholder,
  searchColumn,
  filterSlot,
  actionsSlot,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Add selection column if row selection is enabled
  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection,
    enableSorting,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onRowSelectionChange]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {showToolbar && (
          <div className="flex items-center gap-2">
            <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        )}
        <TableSkeleton
          rows={pageSize}
          columns={columns.length + (enableRowSelection ? 1 : 0)}
        />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {showToolbar && (
          <DataTableToolbar
            table={table}
            searchPlaceholder={searchPlaceholder}
            searchColumn={searchColumn}
            filterSlot={filterSlot}
            actionsSlot={actionsSlot}
          />
        )}
        <div className="rounded-lg border">
          <EmptyState
            variant={emptyStateVariant}
            title={emptyStateTitle}
            description={emptyStateDescription}
            actionLabel={emptyStateActionLabel}
            onAction={onEmptyStateAction}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showToolbar && (
        <DataTableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          searchColumn={searchColumn}
          filterSlot={filterSlot}
          actionsSlot={actionsSlot}
        />
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {enablePagination && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}

// =============================================================================
// Helper: Selection column creator
// =============================================================================

export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

// =============================================================================
// Export types
// =============================================================================

export type { ColumnDef, Row, SortingState };
