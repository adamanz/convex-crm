"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  FileText,
} from "lucide-react";

interface NoteFormData {
  description: string;
  relatedToType: "contact" | "company" | "deal";
  relatedToId: string;
}

interface NoteFormProps {
  onSuccess?: () => void;
  defaultRelatedTo?: {
    type: "contact" | "company" | "deal";
    id: string;
    name: string;
  };
}

export function NoteForm({ onSuccess, defaultRelatedTo }: NoteFormProps) {
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
  } = useForm<NoteFormData>({
    defaultValues: {
      description: "",
      relatedToType: defaultRelatedTo?.type || "contact",
      relatedToId: defaultRelatedTo?.id || "",
    },
  });

  const selectedRelatedId = watch("relatedToId");
  const description = watch("description");

  const onSubmit = useCallback(
    async (data: NoteFormData) => {
      setIsSubmitting(true);
      try {
        // Create subject from first line or truncated description
        const firstLine = data.description.split("\n")[0];
        const subject =
          firstLine.length > 50 ? `${firstLine.slice(0, 50)}...` : firstLine;

        await createActivity({
          type: "note",
          subject: subject || "Quick note",
          description: data.description,
          relatedToType: data.relatedToType,
          relatedToId: data.relatedToId,
        });
        onSuccess?.();
      } catch (error) {
        console.error("Failed to create note:", error);
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

  const characterCount = description?.length || 0;
  const maxCharacters = 2000;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Note <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Write your note here...

You can use multiple lines to organize your thoughts."
          rows={6}
          maxLength={maxCharacters}
          {...register("description", {
            required: "Please enter a note",
            minLength: { value: 1, message: "Note cannot be empty" },
          })}
          className={cn(
            "resize-none",
            errors.description && "border-red-500"
          )}
        />
        <div className="flex items-center justify-between">
          {errors.description ? (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.description.message}
            </p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              "text-xs",
              characterCount > maxCharacters * 0.9
                ? "text-amber-500"
                : "text-zinc-400"
            )}
          >
            {characterCount}/{maxCharacters}
          </span>
        </div>
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
                  isLoading ? "Loading..." : `Select ${relatedType}...`
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

      {/* Quick tips */}
      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Quick tips:
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
          <li>- Notes are timestamped automatically</li>
          <li>- First line becomes the note title</li>
          <li>- Use notes to log meeting summaries or quick updates</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !description}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </form>
  );
}
