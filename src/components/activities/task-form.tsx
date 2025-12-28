"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
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
import { cn } from "@/lib/utils";
import {
  Loader2,
  User,
  Building2,
  Briefcase,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface TaskFormData {
  subject: string;
  description: string;
  relatedToType: "contact" | "company" | "deal";
  relatedToId: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  assignedToId: string;
}

interface TaskFormProps {
  onSuccess?: () => void;
  defaultRelatedTo?: {
    type: "contact" | "company" | "deal";
    id: string;
    name: string;
  };
}

export function TaskForm({ onSuccess, defaultRelatedTo }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedType, setRelatedType] = useState<"contact" | "company" | "deal">(
    defaultRelatedTo?.type || "contact"
  );

  const createActivity = useMutation(api.activities.create);

  // Fetch contacts, companies, and deals for the selector
  const contactsResult = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 100 },
  });
  const companiesResult = useQuery(api.companies.list, {
    paginationOpts: { numItems: 100 },
  });
  const dealsResult = useQuery(api.deals.list, {
    paginationOpts: { numItems: 100 },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaskFormData>({
    defaultValues: {
      subject: "",
      description: "",
      relatedToType: defaultRelatedTo?.type || "contact",
      relatedToId: defaultRelatedTo?.id || "",
      dueDate: "",
      priority: "medium",
      assignedToId: "",
    },
  });

  const selectedRelatedId = watch("relatedToId");

  const onSubmit = useCallback(
    async (data: TaskFormData) => {
      setIsSubmitting(true);
      try {
        await createActivity({
          type: "task",
          subject: data.subject,
          description: data.description || undefined,
          relatedToType: data.relatedToType,
          relatedToId: data.relatedToId,
          dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
          priority: data.priority,
          assignedToId: data.assignedToId
            ? (data.assignedToId as Id<"users">)
            : undefined,
        });
        onSuccess?.();
      } catch (error) {
        console.error("Failed to create task:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createActivity, onSuccess]
  );

  const handleRelatedTypeChange = useCallback(
    (value: "contact" | "company" | "deal") => {
      setRelatedType(value);
      setValue("relatedToType", value);
      setValue("relatedToId", "");
    },
    [setValue]
  );

  const getRelatedOptions = useCallback(() => {
    switch (relatedType) {
      case "contact":
        return (
          contactsResult?.page?.map((contact) => ({
            id: contact._id,
            name: `${contact.firstName || ""} ${contact.lastName}`.trim(),
          })) || []
        );
      case "company":
        return (
          companiesResult?.page?.map((company) => ({
            id: company._id,
            name: company.name,
          })) || []
        );
      case "deal":
        return (
          dealsResult?.page?.map((deal) => ({
            id: deal._id,
            name: deal.name,
          })) || []
        );
      default:
        return [];
    }
  }, [relatedType, contactsResult, companiesResult, dealsResult]);

  const relatedOptions = getRelatedOptions();
  const isLoading = !contactsResult || !companiesResult || !dealsResult;

  // Get tomorrow's date as a suggestion for due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Follow up with client"
          {...register("subject", { required: "Subject is required" })}
          className={cn(errors.subject && "border-red-500")}
        />
        {errors.subject && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add more details about this task..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Related To */}
      <div className="space-y-2">
        <Label>
          Related To <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          {/* Type selector */}
          <Select value={relatedType} onValueChange={handleRelatedTypeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact
                </div>
              </SelectItem>
              <SelectItem value="company">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </div>
              </SelectItem>
              <SelectItem value="deal">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Deal
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Entity selector */}
          <Select
            value={selectedRelatedId}
            onValueChange={(value) => setValue("relatedToId", value)}
            disabled={isLoading}
          >
            <SelectTrigger
              className={cn("flex-1", errors.relatedToId && "border-red-500")}
            >
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading..."
                    : `Select ${relatedType}...`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {relatedOptions.length === 0 && (
                <div className="p-2 text-center text-sm text-zinc-500">
                  No {relatedType}s found
                </div>
              )}
              {relatedOptions.map((option: { id: string; name: string }) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <input
          type="hidden"
          {...register("relatedToId", { required: "Please select a record" })}
        />
        {errors.relatedToId && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.relatedToId.message}
          </p>
        )}
      </div>

      {/* Due Date and Priority - side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            {...register("dueDate")}
          />
          <p className="text-xs text-zinc-500">
            Suggested: {tomorrowStr}
          </p>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            defaultValue="medium"
            onValueChange={(value: "low" | "medium" | "high") =>
              setValue("priority", value)
            }
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  Low
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  High
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
