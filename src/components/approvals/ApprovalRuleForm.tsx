"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

// Validation schema
const conditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: z.enum([
    "equals",
    "notEquals",
    "greaterThan",
    "lessThan",
    "greaterThanOrEqual",
    "lessThanOrEqual",
    "contains",
    "in",
  ]),
  value: z.string().min(1, "Value is required"),
});

const approvalRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  entityType: z.enum(["quote", "deal"]),
  conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
  approvers: z.array(z.string()).min(1, "At least one approver is required"),
  approvalType: z.enum(["any", "all", "sequential"]),
  priority: z.number().optional(),
  isActive: z.boolean(),
});

type ApprovalRuleFormValues = z.infer<typeof approvalRuleSchema>;

const FIELD_OPTIONS = {
  deal: [
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
    { value: "probability", label: "Probability" },
    { value: "stageId", label: "Stage" },
  ],
  quote: [
    { value: "total", label: "Total" },
    { value: "status", label: "Status" },
    { value: "discountAmount", label: "Discount Amount" },
    { value: "taxRate", label: "Tax Rate" },
  ],
};

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
  { value: "greaterThanOrEqual", label: "Greater Than or Equal" },
  { value: "lessThanOrEqual", label: "Less Than or Equal" },
  { value: "contains", label: "Contains" },
  { value: "in", label: "In List" },
];

const APPROVAL_TYPE_OPTIONS = [
  { value: "any", label: "Any One Approver", description: "Approval from any single approver is sufficient" },
  { value: "all", label: "All Approvers", description: "All approvers must approve" },
  { value: "sequential", label: "Sequential", description: "Approvers must approve in order" },
];

interface ApprovalRuleFormProps {
  initialData?: {
    _id?: Id<"approvalRules">;
    name: string;
    description?: string;
    entityType: "quote" | "deal";
    conditions: Array<{ field: string; operator: string; value: any }>;
    approvers: Id<"users">[];
    approvalType: "any" | "all" | "sequential";
    priority?: number;
    isActive: boolean;
  };
  onSubmit?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ApprovalRuleForm({
  initialData,
  onSubmit: onSubmitCallback,
  onCancel,
  className,
}: ApprovalRuleFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const users = useQuery(api.users.list);
  const createRule = useMutation(api.approvals.createRule);
  const updateRule = useMutation(api.approvals.updateRule);

  const isEditing = !!initialData?._id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApprovalRuleFormValues>({
    resolver: zodResolver(approvalRuleSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      entityType: initialData?.entityType || "deal",
      conditions: initialData?.conditions?.map((c) => ({
        ...c,
        value: String(c.value),
      })) || [{ field: "", operator: "greaterThan", value: "" }],
      approvers: initialData?.approvers?.map(String) || [],
      approvalType: initialData?.approvalType || "any",
      priority: initialData?.priority || 0,
      isActive: initialData?.isActive ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conditions",
  });

  const entityType = watch("entityType");
  const approvers = watch("approvers");
  const approvalType = watch("approvalType");
  const isActive = watch("isActive");

  const userOptions = React.useMemo(() => {
    if (!users) return [];
    return users.map((user) => ({
      value: user._id,
      label:
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      description: user.email,
    }));
  }, [users]);

  const fieldOptions = FIELD_OPTIONS[entityType] || [];

  const onFormSubmit = async (data: ApprovalRuleFormValues) => {
    setIsSubmitting(true);

    try {
      // Parse condition values to appropriate types
      const conditions = data.conditions.map((c) => {
        let parsedValue: any = c.value;
        // Try to parse as number if it looks like one
        if (!isNaN(Number(c.value)) && c.value.trim() !== "") {
          parsedValue = Number(c.value);
        }
        // Check if it's a comma-separated list for "in" operator
        if (c.operator === "in") {
          parsedValue = c.value.split(",").map((v) => {
            const trimmed = v.trim();
            return !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed;
          });
        }
        return {
          field: c.field,
          operator: c.operator as any,
          value: parsedValue,
        };
      });

      if (isEditing && initialData?._id) {
        await updateRule({
          id: initialData._id,
          name: data.name,
          description: data.description || undefined,
          conditions,
          approvers: data.approvers as Id<"users">[],
          approvalType: data.approvalType,
          priority: data.priority,
          isActive: data.isActive,
        });
        toast.success("Approval rule updated successfully");
      } else {
        await createRule({
          name: data.name,
          description: data.description || undefined,
          entityType: data.entityType,
          conditions,
          approvers: data.approvers as Id<"users">[],
          approvalType: data.approvalType,
          priority: data.priority,
          isActive: data.isActive,
        });
        toast.success("Approval rule created successfully");
      }

      onSubmitCallback?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save approval rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Rule Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Large Deal Approval"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe when this rule should apply..."
            {...register("description")}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Entity Type <span className="text-destructive">*</span></Label>
            <Select
              value={entityType}
              onValueChange={(value: "quote" | "deal") => setValue("entityType", value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">Deal</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Entity type cannot be changed after creation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              placeholder="0"
              {...register("priority", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Higher priority rules are evaluated first
            </p>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Conditions <span className="text-destructive">*</span></Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ field: "", operator: "greaterThan", value: "" })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Condition
          </Button>
        </div>

        {errors.conditions && (
          <p className="text-sm text-destructive">
            {errors.conditions.message || "Please add at least one condition"}
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={watch(`conditions.${index}.field`)}
                        onValueChange={(value) =>
                          setValue(`conditions.${index}.field`, value)
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.conditions?.[index]?.field
                              ? "border-destructive"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Operator</Label>
                      <Select
                        value={watch(`conditions.${index}.operator`)}
                        onValueChange={(value) =>
                          setValue(`conditions.${index}.operator`, value as any)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      <Input
                        placeholder={
                          watch(`conditions.${index}.operator`) === "in"
                            ? "value1, value2, ..."
                            : "Enter value"
                        }
                        {...register(`conditions.${index}.value`)}
                        className={
                          errors.conditions?.[index]?.value
                            ? "border-destructive"
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          All conditions must be met for the rule to trigger (AND logic)
        </p>
      </div>

      {/* Approvers */}
      <div className="space-y-4">
        <Label>Approvers <span className="text-destructive">*</span></Label>
        <MultiSelect
          options={userOptions}
          value={approvers}
          onChange={(value) => setValue("approvers", value)}
          placeholder="Select approvers..."
          searchPlaceholder="Search users..."
          emptyText="No users found"
        />
        {errors.approvers && (
          <p className="text-sm text-destructive">{errors.approvers.message}</p>
        )}
      </div>

      {/* Approval Type */}
      <div className="space-y-4">
        <Label>Approval Type <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-3 gap-3">
          {APPROVAL_TYPE_OPTIONS.map((option) => (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-colors",
                approvalType === option.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => setValue("approvalType", option.value as any)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2",
                      approvalType === option.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {approvalType === option.value && (
                      <div className="h-full w-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Active</Label>
          <p className="text-sm text-muted-foreground">
            Only active rules will be evaluated
          </p>
        </div>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked)}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
}

export default ApprovalRuleForm;
