"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface TableWidgetProps {
  data: Array<Record<string, unknown>>;
  config: Record<string, unknown>;
}

export function TableWidget({ data, config }: TableWidgetProps) {
  const { columns } = config;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
        No data to display
      </div>
    );
  }

  // Determine columns to display
  const displayColumns =
    (columns as string[]) ||
    Object.keys(data[0] || {}).filter(
      (k) => !k.startsWith("_") && k !== "createdAt" && k !== "updatedAt"
    );

  // Format cell value based on type
  const formatCellValue = (value: unknown, column: string): string => {
    if (value === null || value === undefined) return "-";

    // Check for currency/amount columns
    if (column.toLowerCase().includes("amount") || column.toLowerCase().includes("revenue")) {
      return formatCurrency(Number(value));
    }

    // Check for date columns
    if (
      column.toLowerCase().includes("date") ||
      column.toLowerCase().includes("at") ||
      column.toLowerCase().includes("time")
    ) {
      const date = new Date(Number(value));
      if (!isNaN(date.getTime())) {
        return format(date, "MMM d, yyyy");
      }
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} items` : "-";
    }

    // Handle objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Format column header
  const formatHeader = (column: string): string => {
    return column
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/Id$/, " ID")
      .trim();
  };

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap">
                {formatHeader(col)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={(row._id as string) || index}>
              {displayColumns.map((col) => (
                <TableCell key={col} className="whitespace-nowrap">
                  {formatCellValue(row[col], col)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
