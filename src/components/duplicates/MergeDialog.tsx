"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Check,
  AlertTriangle,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
} from "lucide-react";

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "contact" | "company";
  primaryId: Id<"contacts"> | Id<"companies">;
  duplicateIds: Array<Id<"contacts"> | Id<"companies">>;
}

interface ContactRecord {
  _id: Id<"contacts">;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  source?: string;
  companyId?: Id<"companies">;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  tags: string[];
  company?: { name: string } | null;
}

interface CompanyRecord {
  _id: Id<"companies">;
  name: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  description?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  tags: string[];
}

type FieldSelection = { [key: string]: string };

export function MergeDialog({
  open,
  onOpenChange,
  type,
  primaryId,
  duplicateIds,
}: MergeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fieldSelections, setFieldSelections] = useState<FieldSelection>({});
  const [customValues, setCustomValues] = useState<{ [key: string]: string }>({});
  const [useCustom, setUseCustom] = useState<{ [key: string]: boolean }>({});

  // Fetch all records
  const allRecordIds = [primaryId, ...duplicateIds];

  // Query for contacts
  const contactRecords = useQuery(
    api.contacts.get,
    type === "contact" ? { id: primaryId as Id<"contacts"> } : "skip"
  );

  // We need to fetch each duplicate contact separately
  const duplicateContactQueries = duplicateIds.map((id) =>
    useQuery(
      api.contacts.get,
      type === "contact" ? { id: id as Id<"contacts"> } : "skip"
    )
  );

  // Query for companies
  const companyRecords = useQuery(
    api.companies.get,
    type === "company" ? { id: primaryId as Id<"companies"> } : "skip"
  );

  const duplicateCompanyQueries = duplicateIds.map((id) =>
    useQuery(
      api.companies.get,
      type === "company" ? { id: id as Id<"companies"> } : "skip"
    )
  );

  // Merge mutations
  const mergeContacts = useMutation(api.duplicates.mergeContacts);
  const mergeCompanies = useMutation(api.duplicates.mergeCompanies);

  // Build records array
  const records = useMemo(() => {
    if (type === "contact") {
      const all = [contactRecords, ...duplicateContactQueries].filter(Boolean);
      return all as ContactRecord[];
    } else {
      const all = [companyRecords, ...duplicateCompanyQueries].filter(Boolean);
      return all as CompanyRecord[];
    }
  }, [type, contactRecords, duplicateContactQueries, companyRecords, duplicateCompanyQueries]);

  // Contact-specific fields
  const contactFields = [
    { key: "firstName", label: "First Name", icon: User },
    { key: "lastName", label: "Last Name", icon: User, required: true },
    { key: "email", label: "Email", icon: Mail },
    { key: "phone", label: "Phone", icon: Phone },
    { key: "title", label: "Job Title", icon: Briefcase },
    { key: "linkedinUrl", label: "LinkedIn URL", icon: Globe },
    { key: "twitterHandle", label: "Twitter Handle", icon: Globe },
    { key: "source", label: "Source", icon: User },
  ];

  // Company-specific fields
  const companyFields = [
    { key: "name", label: "Company Name", icon: Building2, required: true },
    { key: "domain", label: "Domain", icon: Globe },
    { key: "industry", label: "Industry", icon: Briefcase },
    { key: "size", label: "Company Size", icon: User },
    { key: "phone", label: "Phone", icon: Phone },
    { key: "website", label: "Website", icon: Globe },
    { key: "description", label: "Description", icon: Building2 },
  ];

  const fields = type === "contact" ? contactFields : companyFields;

  // Initialize field selections when records load
  useEffect(() => {
    if (records.length > 0) {
      const initialSelections: FieldSelection = {};
      const initialCustom: { [key: string]: string } = {};

      fields.forEach((field) => {
        // Find the first record with a value for this field
        const recordWithValue = records.find((r) => {
          const value = r[field.key as keyof typeof r];
          return value !== undefined && value !== null && value !== "";
        });

        if (recordWithValue) {
          initialSelections[field.key] = recordWithValue._id;
          initialCustom[field.key] = String(recordWithValue[field.key as keyof typeof recordWithValue] || "");
        } else {
          initialSelections[field.key] = records[0]?._id || "";
          initialCustom[field.key] = "";
        }
      });

      setFieldSelections(initialSelections);
      setCustomValues(initialCustom);
    }
  }, [records, fields]);

  const handleFieldSelect = (field: string, recordId: string) => {
    setFieldSelections((prev) => ({ ...prev, [field]: recordId }));
    setUseCustom((prev) => ({ ...prev, [field]: false }));

    // Update custom value to match selected record
    const record = records.find((r) => r._id === recordId);
    if (record) {
      setCustomValues((prev) => ({
        ...prev,
        [field]: String(record[field as keyof typeof record] || ""),
      }));
    }
  };

  const handleCustomValueChange = (field: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [field]: value }));
    setUseCustom((prev) => ({ ...prev, [field]: true }));
  };

  const handleMerge = async () => {
    if (records.length === 0) return;

    setIsLoading(true);
    try {
      // Build merged data from selections
      const mergedData: Record<string, unknown> = {};

      fields.forEach((field) => {
        const value = useCustom[field.key]
          ? customValues[field.key]
          : records.find((r) => r._id === fieldSelections[field.key])?.[field.key as keyof typeof records[0]];

        if (value !== undefined && value !== null && value !== "") {
          mergedData[field.key] = value;
        }
      });

      // Merge tags from all records
      const allTags = new Set<string>();
      records.forEach((record) => {
        (record.tags || []).forEach((tag) => allTags.add(tag));
      });
      mergedData.tags = Array.from(allTags);

      // Use address from primary if available
      const primaryRecord = records[0];
      if (primaryRecord?.address) {
        mergedData.address = primaryRecord.address;
      }

      if (type === "contact") {
        await mergeContacts({
          primaryId: primaryId as Id<"contacts">,
          duplicateIds: duplicateIds as Id<"contacts">[],
          mergedData: {
            firstName: mergedData.firstName as string | undefined,
            lastName: mergedData.lastName as string || records[0]?.lastName || "Unknown",
            email: mergedData.email as string | undefined,
            phone: mergedData.phone as string | undefined,
            title: mergedData.title as string | undefined,
            linkedinUrl: mergedData.linkedinUrl as string | undefined,
            twitterHandle: mergedData.twitterHandle as string | undefined,
            source: mergedData.source as string | undefined,
            companyId: (records[0] as ContactRecord)?.companyId,
            address: mergedData.address as {
              street?: string;
              city?: string;
              state?: string;
              postalCode?: string;
              country?: string;
            } | undefined,
            tags: mergedData.tags as string[],
          },
        });
      } else {
        await mergeCompanies({
          primaryId: primaryId as Id<"companies">,
          duplicateIds: duplicateIds as Id<"companies">[],
          mergedData: {
            name: mergedData.name as string || records[0]?.name || "Unknown",
            domain: mergedData.domain as string | undefined,
            industry: mergedData.industry as string | undefined,
            size: mergedData.size as string | undefined,
            phone: mergedData.phone as string | undefined,
            website: mergedData.website as string | undefined,
            description: mergedData.description as string | undefined,
            address: mergedData.address as {
              street?: string;
              city?: string;
              state?: string;
              postalCode?: string;
              country?: string;
            } | undefined,
            tags: mergedData.tags as string[],
          },
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to merge records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordLabel = (record: ContactRecord | CompanyRecord, index: number) => {
    if (type === "contact") {
      const c = record as ContactRecord;
      return `${c.firstName || ""} ${c.lastName}`.trim() || `Contact ${index + 1}`;
    } else {
      const c = record as CompanyRecord;
      return c.name || `Company ${index + 1}`;
    }
  };

  const isDataLoading = records.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "contact" ? (
              <User className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            Merge {type === "contact" ? "Contacts" : "Companies"}
          </DialogTitle>
          <DialogDescription>
            Select which values to keep for each field. The primary record will be
            updated and duplicates will be deleted.
          </DialogDescription>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Record summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">
                    Merging {records.length} records
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {records.map((record, index) => (
                    <Badge
                      key={record._id}
                      variant={index === 0 ? "default" : "secondary"}
                    >
                      {index === 0 && <Check className="h-3 w-3 mr-1" />}
                      {getRecordLabel(record, index)}
                      {index === 0 && " (Primary)"}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Field selection */}
              <div className="space-y-6">
                {fields.map((field) => {
                  const Icon = field.icon;
                  const valuesFromRecords = records
                    .map((r) => ({
                      id: r._id,
                      value: r[field.key as keyof typeof r] as string | undefined,
                      label: getRecordLabel(r, records.indexOf(r)),
                    }))
                    .filter((v) => v.value !== undefined && v.value !== null && v.value !== "");

                  return (
                    <div key={field.key} className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>

                      {valuesFromRecords.length === 0 ? (
                        <Input
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={customValues[field.key] || ""}
                          onChange={(e) => handleCustomValueChange(field.key, e.target.value)}
                        />
                      ) : (
                        <div className="space-y-2">
                          <RadioGroup
                            value={
                              useCustom[field.key]
                                ? "custom"
                                : fieldSelections[field.key]
                            }
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setUseCustom((prev) => ({ ...prev, [field.key]: true }));
                              } else {
                                handleFieldSelect(field.key, value);
                              }
                            }}
                          >
                            {valuesFromRecords.map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center space-x-3 rounded-md border p-3"
                              >
                                <RadioGroupItem value={v.id} id={`${field.key}-${v.id}`} />
                                <Label
                                  htmlFor={`${field.key}-${v.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <span className="font-medium">{v.value}</span>
                                  <span className="text-muted-foreground text-sm ml-2">
                                    ({v.label})
                                  </span>
                                </Label>
                              </div>
                            ))}

                            <div className="flex items-center space-x-3 rounded-md border p-3">
                              <RadioGroupItem value="custom" id={`${field.key}-custom`} />
                              <Label
                                htmlFor={`${field.key}-custom`}
                                className="flex-1 cursor-pointer"
                              >
                                <span className="font-medium">Custom value</span>
                              </Label>
                            </div>
                          </RadioGroup>

                          {useCustom[field.key] && (
                            <Input
                              placeholder={`Enter custom ${field.label.toLowerCase()}`}
                              value={customValues[field.key] || ""}
                              onChange={(e) => handleCustomValueChange(field.key, e.target.value)}
                              className="mt-2"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tags summary */}
              <div className="space-y-2">
                <Label>Tags (merged from all records)</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                  {Array.from(
                    new Set(records.flatMap((r) => r.tags || []))
                  ).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {records.every((r) => !r.tags || r.tags.length === 0) && (
                    <span className="text-muted-foreground text-sm">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMerge}
            disabled={isLoading || isDataLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Merge {records.length} Records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
