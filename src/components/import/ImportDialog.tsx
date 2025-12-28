"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportType = "contacts" | "companies" | "deals";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: ImportType;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

interface ColumnMapping {
  [csvColumn: string]: string | null;
}

// Field definitions for each import type
const CONTACT_FIELDS = [
  { key: "firstName", label: "First Name", required: false },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "title", label: "Job Title", required: false },
  { key: "companyName", label: "Company Name", required: false },
  { key: "linkedinUrl", label: "LinkedIn URL", required: false },
  { key: "twitterHandle", label: "Twitter Handle", required: false },
  { key: "source", label: "Source", required: false },
  { key: "street", label: "Street", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "postalCode", label: "Postal Code", required: false },
  { key: "country", label: "Country", required: false },
];

const COMPANY_FIELDS = [
  { key: "name", label: "Company Name", required: true },
  { key: "domain", label: "Domain", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "size", label: "Size", required: false },
  { key: "annualRevenue", label: "Annual Revenue", required: false },
  { key: "description", label: "Description", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "website", label: "Website", required: false },
  { key: "street", label: "Street", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "postalCode", label: "Postal Code", required: false },
  { key: "country", label: "Country", required: false },
];

const DEAL_FIELDS = [
  { key: "name", label: "Deal Name", required: true },
  { key: "companyName", label: "Company Name", required: false },
  { key: "contactEmail", label: "Contact Email", required: false },
  { key: "stageId", label: "Stage", required: false },
  { key: "amount", label: "Amount", required: false },
  { key: "currency", label: "Currency", required: false },
  { key: "probability", label: "Probability (%)", required: false },
  { key: "expectedCloseDate", label: "Expected Close Date", required: false },
  { key: "status", label: "Status", required: false },
];

function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse CSV respecting quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

function autoMapColumns(
  csvHeaders: string[],
  fields: { key: string; label: string }[]
): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const header of csvHeaders) {
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");

    // Try to find matching field
    const matchedField = fields.find((field) => {
      const normalizedKey = field.key.toLowerCase();
      const normalizedLabel = field.label.toLowerCase().replace(/[_\s-]/g, "");

      return (
        normalizedHeader === normalizedKey ||
        normalizedHeader === normalizedLabel ||
        normalizedHeader.includes(normalizedKey) ||
        normalizedKey.includes(normalizedHeader)
      );
    });

    mapping[header] = matchedField?.key ?? null;
  }

  return mapping;
}

export function ImportDialog({
  open,
  onOpenChange,
  defaultType = "contacts",
}: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [importType, setImportType] = useState<ImportType>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const importContacts = useMutation(api.import.importContacts);
  const importCompanies = useMutation(api.import.importCompanies);
  const importDeals = useMutation(api.import.importDeals);

  // Queries for deals
  const pipelines = useQuery(api.pipelines.list, {});

  const fields = useMemo(() => {
    switch (importType) {
      case "contacts":
        return CONTACT_FIELDS;
      case "companies":
        return COMPANY_FIELDS;
      case "deals":
        return DEAL_FIELDS;
    }
  }, [importType]);

  const handleFileUpload = useCallback(
    async (uploadedFile: File) => {
      setFile(uploadedFile);
      setError(null);

      try {
        const text = await uploadedFile.text();
        const parsed = parseCSV(text);

        if (parsed.headers.length === 0) {
          setError("Could not parse CSV file. Please check the file format.");
          return;
        }

        if (parsed.rows.length === 0) {
          setError("CSV file has no data rows.");
          return;
        }

        setParsedData(parsed);
        setColumnMapping(autoMapColumns(parsed.headers, fields));
        setStep("mapping");
      } catch (err) {
        setError("Failed to read file. Please try again.");
      }
    },
    [fields]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        handleFileUpload(droppedFile);
      } else {
        setError("Please upload a CSV file.");
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileUpload(selectedFile);
      }
    },
    [handleFileUpload]
  );

  const handleMappingChange = (csvColumn: string, fieldKey: string | null) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvColumn]: fieldKey,
    }));
  };

  const transformRow = useCallback(
    (row: Record<string, string>) => {
      const result: Record<string, string | number | undefined> = {};

      for (const [csvColumn, fieldKey] of Object.entries(columnMapping)) {
        if (fieldKey && row[csvColumn]) {
          const value = row[csvColumn];

          // Handle numeric fields
          if (
            fieldKey === "amount" ||
            fieldKey === "annualRevenue" ||
            fieldKey === "probability"
          ) {
            const numValue = parseFloat(value.replace(/[^0-9.-]/g, ""));
            if (!isNaN(numValue)) {
              result[fieldKey] = numValue;
            }
          } else {
            result[fieldKey] = value;
          }
        }
      }

      return result;
    },
    [columnMapping]
  );

  const previewData = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.rows.slice(0, 5).map(transformRow);
  }, [parsedData, transformRow]);

  const canProceedToPreview = useMemo(() => {
    const requiredFields = fields.filter((f) => f.required);
    const mappedFields = Object.values(columnMapping).filter(Boolean);
    return requiredFields.every((f) => mappedFields.includes(f.key));
  }, [fields, columnMapping]);

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setStep("importing");
    setError(null);

    try {
      const transformedData = parsedData.rows.map(transformRow);

      let result;

      switch (importType) {
        case "contacts":
          result = await importContacts({
            contacts: transformedData.map((row) => ({
              firstName: row.firstName as string | undefined,
              lastName: (row.lastName as string) || "Unknown",
              email: row.email as string | undefined,
              phone: row.phone as string | undefined,
              title: row.title as string | undefined,
              companyName: row.companyName as string | undefined,
              linkedinUrl: row.linkedinUrl as string | undefined,
              twitterHandle: row.twitterHandle as string | undefined,
              source: row.source as string | undefined,
              street: row.street as string | undefined,
              city: row.city as string | undefined,
              state: row.state as string | undefined,
              postalCode: row.postalCode as string | undefined,
              country: row.country as string | undefined,
            })),
            skipDuplicateEmails: skipDuplicates,
            defaultSource: "CSV Import",
          });
          break;

        case "companies":
          result = await importCompanies({
            companies: transformedData.map((row) => ({
              name: (row.name as string) || "Unknown",
              domain: row.domain as string | undefined,
              industry: row.industry as string | undefined,
              size: row.size as string | undefined,
              annualRevenue: row.annualRevenue as number | undefined,
              description: row.description as string | undefined,
              phone: row.phone as string | undefined,
              website: row.website as string | undefined,
              street: row.street as string | undefined,
              city: row.city as string | undefined,
              state: row.state as string | undefined,
              postalCode: row.postalCode as string | undefined,
              country: row.country as string | undefined,
            })),
            skipDuplicateDomains: skipDuplicates,
            skipDuplicateNames: skipDuplicates,
          });
          break;

        case "deals":
          if (!selectedPipelineId || !selectedStageId) {
            throw new Error("Please select a pipeline and default stage");
          }
          result = await importDeals({
            deals: transformedData.map((row) => ({
              name: (row.name as string) || "Unknown Deal",
              companyName: row.companyName as string | undefined,
              contactEmail: row.contactEmail as string | undefined,
              stageId: row.stageId as string | undefined,
              amount: row.amount as number | undefined,
              currency: row.currency as string | undefined,
              probability: row.probability as number | undefined,
              expectedCloseDate: row.expectedCloseDate as string | undefined,
              status: row.status as string | undefined,
            })),
            pipelineId: selectedPipelineId as Id<"pipelines">,
            defaultStageId: selectedStageId,
          });
          break;
      }

      setImportResult(result);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep("upload");
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setImportResult(null);
    setError(null);
    setSelectedPipelineId("");
    setSelectedStageId("");
    onOpenChange(false);
  };

  const handleBack = () => {
    switch (step) {
      case "mapping":
        setStep("upload");
        setFile(null);
        setParsedData(null);
        break;
      case "preview":
        setStep("mapping");
        break;
    }
  };

  const selectedPipeline = pipelines?.find((p) => p._id === selectedPipelineId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import {importType}</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import data"}
            {step === "mapping" && "Map CSV columns to fields"}
            {step === "preview" && "Review data before importing"}
            {step === "importing" && "Importing your data..."}
            {step === "complete" && "Import complete"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {["upload", "mapping", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["upload", "mapping", "preview", "importing", "complete"].indexOf(
                        step
                      ) >
                      ["upload", "mapping", "preview", "complete"].indexOf(s)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    ["upload", "mapping", "preview", "importing", "complete"].indexOf(
                      step
                    ) > i
                      ? "bg-primary/20"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto py-4">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Import type selector */}
              <div className="space-y-2">
                <Label>What do you want to import?</Label>
                <Select
                  value={importType}
                  onValueChange={(v) => setImportType(v as ImportType)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="companies">Companies</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File upload area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  "hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Drop your CSV file here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports .csv files up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{file?.name}</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{parsedData.rows.length} rows</span>
              </div>

              {/* Mapping table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">CSV Column</TableHead>
                      <TableHead className="w-[60%]">Maps To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.headers.map((header) => (
                      <TableRow key={header}>
                        <TableCell className="font-mono text-sm">
                          {header}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={columnMapping[header] ?? "skip"}
                            onValueChange={(v) =>
                              handleMappingChange(
                                header,
                                v === "skip" ? null : v
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Skip this column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">
                                Skip this column
                              </SelectItem>
                              {fields.map((field) => (
                                <SelectItem key={field.key} value={field.key}>
                                  {field.label}
                                  {field.required && " *"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!canProceedToPreview && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Please map all required fields (marked with *)
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && parsedData && (
            <div className="space-y-4">
              {/* Options */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) =>
                      setSkipDuplicates(checked as boolean)
                    }
                  />
                  <Label htmlFor="skip-duplicates" className="text-sm">
                    Skip duplicate records
                  </Label>
                </div>

                {importType === "deals" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Pipeline:</Label>
                      <Select
                        value={selectedPipelineId}
                        onValueChange={(v) => {
                          setSelectedPipelineId(v);
                          setSelectedStageId("");
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines?.map((pipeline) => (
                            <SelectItem key={pipeline._id} value={pipeline._id}>
                              {pipeline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPipeline && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Default Stage:</Label>
                        <Select
                          value={selectedStageId}
                          onValueChange={setSelectedStageId}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedPipeline.stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Preview table */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Preview (first 5 rows of {parsedData.rows.length} total)
                </p>
                <div className="border rounded-lg overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {fields
                          .filter((f) =>
                            Object.values(columnMapping).includes(f.key)
                          )
                          .map((field) => (
                            <TableHead key={field.key}>{field.label}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          {fields
                            .filter((f) =>
                              Object.values(columnMapping).includes(f.key)
                            )
                            .map((field) => (
                              <TableCell
                                key={field.key}
                                className="max-w-[200px] truncate"
                              >
                                {String(row[field.key] ?? "")}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg font-medium">Importing your data...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && importResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-8">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Import Complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {importResult.imported}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Records imported
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Records skipped
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-destructive">
                    {importResult.errors.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="border rounded-lg p-4 max-h-[200px] overflow-auto">
                  <p className="font-medium mb-2">Errors:</p>
                  <ul className="text-sm space-y-1">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className="text-destructive">
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {importResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!canProceedToPreview}
              >
                Preview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  importType === "deals" &&
                  (!selectedPipelineId || !selectedStageId)
                }
              >
                Import {parsedData?.rows.length} records
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
