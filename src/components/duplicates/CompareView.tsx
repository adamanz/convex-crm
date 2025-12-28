"use client";

import * as React from "react";
import { useQuery } from "convex/react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GitMerge, Check } from "lucide-react";

type RecordType = "contact" | "company";

interface CompareViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: RecordType;
  recordIds: Id<"contacts">[] | Id<"companies">[];
  onMerge: () => void;
}

export function CompareView({
  open,
  onOpenChange,
  type,
  recordIds,
  onMerge,
}: CompareViewProps) {
  const [selectedValues, setSelectedValues] = React.useState<Record<string, number>>({});

  // Fetch contact or company records
  const contacts = useQuery(
    api.contacts.list,
    type === "contact" ? { paginationOpts: { numItems: 100 } } : "skip"
  );

  const companies = useQuery(
    api.companies.list,
    type === "company" ? { paginationOpts: { numItems: 100 } } : "skip"
  );

  const isLoading = type === "contact" ? contacts === undefined : companies === undefined;

  const records = React.useMemo(() => {
    if (type === "contact" && contacts?.page) {
      return contacts.page.filter((c) => (recordIds as Id<"contacts">[]).includes(c._id));
    }
    if (type === "company" && companies?.page) {
      return companies.page.filter((c) => (recordIds as Id<"companies">[]).includes(c._id));
    }
    return [];
  }, [type, contacts, companies, recordIds]);

  const fields = React.useMemo(() => {
    if (type === "contact") {
      return [
        { label: "First Name", field: "firstName" },
        { label: "Last Name", field: "lastName" },
        { label: "Email", field: "email" },
        { label: "Phone", field: "phone" },
        { label: "Title", field: "title" },
        { label: "Status", field: "status" },
      ];
    }
    return [
      { label: "Name", field: "name" },
      { label: "Domain", field: "domain" },
      { label: "Industry", field: "industry" },
      { label: "Size", field: "size" },
      { label: "Website", field: "website" },
    ];
  }, [type]);

  const handleSelectValue = (field: string, index: number) => {
    setSelectedValues((prev) => ({
      ...prev,
      [field]: index,
    }));
  };

  const getValue = (record: Record<string, unknown>, field: string) => {
    const value = record[field];
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Empty</span>;
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare {type === "contact" ? "Contacts" : "Companies"}</DialogTitle>
          <DialogDescription>
            Review the records below and select which values to keep when merging.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <Skeleton key={field.field} className="h-12 w-full" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No records found to compare.
          </div>
        ) : (
          <div className="overflow-x-auto py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Field</th>
                  {records.map((_, i) => (
                    <th key={i} className="px-4 py-2 text-left font-medium">
                      {i === 0 ? "Primary Record" : `Duplicate ${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => {
                  const values = records.map((r) => (r as Record<string, unknown>)[field.field]);
                  const allSame = values.every((v) => v === values[0]);
                  return (
                    <tr
                      key={field.field}
                      className={cn(
                        "border-b last:border-0",
                        !allSame && "bg-yellow-50 dark:bg-yellow-950/20"
                      )}
                    >
                      <td className="px-4 py-2 font-medium">{field.label}</td>
                      {records.map((record, i) => (
                        <td
                          key={i}
                          className={cn(
                            "px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedValues[field.field] === i && "bg-blue-50 dark:bg-blue-950/30"
                          )}
                          onClick={() => handleSelectValue(field.field, i)}
                        >
                          <div className="flex items-center gap-2">
                            {getValue(record as Record<string, unknown>, field.field)}
                            {selectedValues[field.field] === i && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onMerge} disabled={isLoading || records.length === 0}>
            <GitMerge className="h-4 w-4 mr-2" />
            Proceed to Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CompareView;
