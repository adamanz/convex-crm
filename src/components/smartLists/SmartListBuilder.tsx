"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterGroupEditor } from "./FilterGroupEditor";
import { SmartListPreview } from "./SmartListPreview";
import { Filter, FieldDefinition, OperatorDefinition } from "./FilterRow";
import { Loader2, Save, Eye, Settings2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type EntityType = "contact" | "company" | "deal";

interface SmartListBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  editId?: string;
  onSuccess?: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function SmartListBuilder({
  open,
  onOpenChange,
  entityType,
  editId,
  onSuccess,
}: SmartListBuilderProps) {
  // State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"filters" | "preview" | "settings">(
    "filters"
  );

  // Queries
  const fieldDefinitions = useQuery(api.smartLists.getFieldDefinitions, {
    entityType,
  });
  const operatorDefinitions = useQuery(api.smartLists.getOperators, {});
  const existingSmartList = useQuery(
    api.smartLists.getSmartList,
    editId ? { id: editId as Id<"smartLists"> } : "skip"
  );

  // Mutations
  const createSmartList = useMutation(api.smartLists.createSmartList);
  const updateSmartList = useMutation(api.smartLists.updateSmartList);

  // Load existing smart list data when editing
  useEffect(() => {
    if (existingSmartList) {
      setName(existingSmartList.name);
      setDescription(existingSmartList.description ?? "");
      setFilters(existingSmartList.filters as Filter[]);
      setSortField(existingSmartList.sortField ?? "");
      setSortDirection(existingSmartList.sortDirection ?? "desc");
      setIsPublic(existingSmartList.isPublic);
    }
  }, [existingSmartList]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      if (!editId) {
        setName("");
        setDescription("");
        setFilters([]);
        setSortField("");
        setSortDirection("desc");
        setIsPublic(false);
      }
      setActiveTab("filters");
    }
  }, [open, editId]);

  // Derived state
  const isEditing = !!editId;
  const isLoading = fieldDefinitions === undefined || operatorDefinitions === undefined;
  const fields = (fieldDefinitions ?? []) as FieldDefinition[];
  const operators = (operatorDefinitions ?? []) as OperatorDefinition[];

  // Validation
  const isValid =
    name.trim() !== "" &&
    filters.length > 0 &&
    filters.every(
      (f) =>
        f.field &&
        f.operator &&
        (["isEmpty", "isNotEmpty"].includes(f.operator) ||
          (f.value !== "" && f.value !== null && f.value !== undefined))
    );

  // Handle save
  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);

    try {
      const formattedFilters = filters.map((f) => ({
        id: f.id,
        field: f.field,
        operator: f.operator,
        value: f.value,
        conjunction: f.conjunction,
      }));

      let resultId: string;

      if (isEditing && editId) {
        await updateSmartList({
          id: editId as Id<"smartLists">,
          name: name.trim(),
          description: description.trim() || undefined,
          filters: formattedFilters,
          sortField: sortField || undefined,
          sortDirection: sortField ? sortDirection : undefined,
          isPublic,
        });
        resultId = editId;
        toast.success("Smart list updated successfully");
      } else {
        resultId = await createSmartList({
          name: name.trim(),
          description: description.trim() || undefined,
          entityType,
          filters: formattedFilters,
          sortField: sortField || undefined,
          sortDirection: sortField ? sortDirection : undefined,
          isPublic,
        });
        toast.success("Smart list created successfully");
      }

      onSuccess?.(resultId);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving smart list:", error);
      toast.error("Failed to save smart list");
    } finally {
      setIsSaving(false);
    }
  };

  const getEntityLabel = (type: EntityType): string => {
    switch (type) {
      case "contact":
        return "Contacts";
      case "company":
        return "Companies";
      case "deal":
        return "Deals";
      default:
        return "Items";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Smart List" : "Create Smart List"}
          </DialogTitle>
          <DialogDescription>
            Build a dynamic list of {getEntityLabel(entityType).toLowerCase()} based on filter
            criteria. The list will automatically update as data changes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "filters" | "preview" | "settings")
              }
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filters" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Filters
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                {/* Filters Tab */}
                <TabsContent value="filters" className="mt-0 h-full">
                  <div className="space-y-4">
                    <FilterGroupEditor
                      filters={filters}
                      fields={fields}
                      operators={operators}
                      onChange={setFilters}
                    />
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-0 h-full">
                  <SmartListPreview
                    entityType={entityType}
                    filters={filters}
                    limit={10}
                  />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-0 h-full">
                  <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., High-value leads"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description for this smart list..."
                        rows={3}
                      />
                    </div>

                    {/* Sorting */}
                    <div className="space-y-2">
                      <Label>Default Sort</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={sortField}
                          onValueChange={setSortField}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="No sorting" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No sorting</SelectItem>
                            {fields.map((field) => (
                              <SelectItem key={field.field} value={field.field}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {sortField && (
                          <Select
                            value={sortDirection}
                            onValueChange={(v) =>
                              setSortDirection(v as "asc" | "desc")
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    {/* Public toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="public">Make public</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow other team members to see this smart list
                        </p>
                      </div>
                      <Switch
                        id="public"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Smart List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SmartListBuilder;
