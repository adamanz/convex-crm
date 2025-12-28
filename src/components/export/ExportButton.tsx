"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";

export type ExportType = "contacts" | "companies" | "deals";
export type ExportFormat = "csv" | "json";

interface ExportButtonProps {
  type: ExportType;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

function convertToCSV(
  data: Record<string, unknown>[],
  columns: string[]
): string {
  if (data.length === 0) return "";

  // Header row
  const header = columns.join(",");

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";

        const stringValue = String(value);

        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function ExportButton({
  type,
  variant = "outline",
  size = "default",
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat | null>(null);

  // Conditionally fetch data based on type and when export is triggered
  const contactsData = useQuery(
    api.export.exportContacts,
    type === "contacts" && format !== null ? {} : "skip"
  );

  const companiesData = useQuery(
    api.export.exportCompanies,
    type === "companies" && format !== null ? {} : "skip"
  );

  const dealsData = useQuery(
    api.export.exportDeals,
    type === "deals" && format !== null ? {} : "skip"
  );

  const handleExport = useCallback(
    async (exportFormat: ExportFormat) => {
      setIsExporting(true);
      setFormat(exportFormat);
    },
    []
  );

  // Effect to handle export when data is loaded
  const currentData =
    type === "contacts"
      ? contactsData
      : type === "companies"
      ? companiesData
      : dealsData;

  if (isExporting && currentData && format) {
    const timestamp = getTimestamp();
    const filename = `${type}-export-${timestamp}`;

    if (format === "csv") {
      const csvContent = convertToCSV(
        currentData.data as Record<string, unknown>[],
        currentData.columns
      );
      downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
    } else {
      const jsonContent = JSON.stringify(currentData.data, null, 2);
      downloadFile(jsonContent, `${filename}.json`, "application/json");
    }

    // Reset state after export
    setIsExporting(false);
    setFormat(null);
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== "icon" && (
            <span className="ml-2">{isExporting ? "Exporting..." : "Export"}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export {typeLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("json")}
          disabled={isExporting}
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Alternative implementation using a more direct approach
 * This version doesn't use conditional queries and fetches on-demand
 */
interface ExportButtonDirectProps {
  onExportCSV: () => Promise<{
    data: Record<string, unknown>[];
    columns: string[];
  }>;
  onExportJSON: () => Promise<{
    data: Record<string, unknown>[];
    columns: string[];
  }>;
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportButtonDirect({
  onExportCSV,
  onExportJSON,
  filename,
  label = "Export",
  variant = "outline",
  size = "default",
  className,
}: ExportButtonDirectProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await onExportCSV();
      const csvContent = convertToCSV(result.data, result.columns);
      const timestamp = getTimestamp();
      downloadFile(
        csvContent,
        `${filename}-${timestamp}.csv`,
        "text/csv;charset=utf-8;"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const result = await onExportJSON();
      const jsonContent = JSON.stringify(result.data, null, 2);
      const timestamp = getTimestamp();
      downloadFile(
        jsonContent,
        `${filename}-${timestamp}.json`,
        "application/json"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== "icon" && (
            <span className="ml-2">{isExporting ? "Exporting..." : label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Utility function to use export functionality imperatively
 */
export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(
    (data: Record<string, unknown>[], columns: string[], filename: string) => {
      setIsExporting(true);
      try {
        const csvContent = convertToCSV(data, columns);
        const timestamp = getTimestamp();
        downloadFile(
          csvContent,
          `${filename}-${timestamp}.csv`,
          "text/csv;charset=utf-8;"
        );
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportToJSON = useCallback(
    (data: Record<string, unknown>[], filename: string) => {
      setIsExporting(true);
      try {
        const jsonContent = JSON.stringify(data, null, 2);
        const timestamp = getTimestamp();
        downloadFile(
          jsonContent,
          `${filename}-${timestamp}.json`,
          "application/json"
        );
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    exportToCSV,
    exportToJSON,
  };
}
