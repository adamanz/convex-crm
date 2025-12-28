"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

const priceBookFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  currency: z.string().min(1, "Currency is required"),
});

type PriceBookFormValues = z.infer<typeof priceBookFormSchema>;

interface PriceBookFormProps {
  priceBookId?: Id<"priceBooks">;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

export function PriceBookForm({
  priceBookId,
  onSuccess,
  onCancel,
  className,
}: PriceBookFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const priceBook = useQuery(
    api.products.getPriceBook,
    priceBookId ? { id: priceBookId } : "skip"
  );
  const createPriceBook = useMutation(api.products.createPriceBook);
  const updatePriceBook = useMutation(api.products.updatePriceBook);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PriceBookFormValues>({
    resolver: zodResolver(priceBookFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      isActive: true,
      currency: "USD",
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (priceBook) {
      reset({
        name: priceBook.name,
        description: priceBook.description || "",
        isDefault: priceBook.isDefault,
        isActive: priceBook.isActive,
        currency: priceBook.currency,
      });
    }
  }, [priceBook, reset]);

  const isDefault = watch("isDefault");

  const onSubmit = async (data: PriceBookFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = {
        name: data.name,
        description: data.description || undefined,
        isDefault: data.isDefault,
        isActive: data.isActive,
        currency: data.currency,
      };

      if (priceBookId) {
        await updatePriceBook({ id: priceBookId, ...formData });
      } else {
        await createPriceBook(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save price book:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (priceBookId && priceBook === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Standard Pricing, Enterprise, Partner"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe when this price book should be used..."
            rows={3}
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">
            Currency <span className="text-red-500">*</span>
          </Label>
          <Select
            value={watch("currency")}
            onValueChange={(v) => setValue("currency", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <Label htmlFor="isDefault" className="font-medium">Default Price Book</Label>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Use this price book when no specific one is selected
            </p>
          </div>
          <Switch
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setValue("isDefault", checked)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <Label htmlFor="isActive" className="font-medium">Active</Label>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Only active price books can be used in quotes
            </p>
          </div>
          <Switch
            id="isActive"
            checked={watch("isActive")}
            onCheckedChange={(checked) => setValue("isActive", checked)}
          />
        </div>
      </div>

      {isDefault && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          Setting this as the default will remove the default status from any existing default price book.
        </p>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {priceBookId ? "Update Price Book" : "Create Price Book"}
        </Button>
      </div>
    </form>
  );
}

export default PriceBookForm;
