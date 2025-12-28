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

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unitPrice: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  taxable: z.boolean(),
  taxRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  productId?: Id<"products">;
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

export function ProductForm({
  productId,
  onSuccess,
  onCancel,
  className,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("");
  const [showNewCategory, setShowNewCategory] = React.useState(false);

  const product = useQuery(
    api.products.get,
    productId ? { id: productId } : "skip"
  );
  const categories = useQuery(api.products.getCategories, {});
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category: "",
      unitPrice: 0,
      currency: "USD",
      taxable: false,
      taxRate: undefined,
      isActive: true,
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || "",
        description: product.description || "",
        category: product.category || "",
        unitPrice: product.unitPrice,
        currency: product.currency,
        taxable: product.taxable,
        taxRate: product.taxRate,
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const taxable = watch("taxable");
  const category = watch("category");

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = {
        name: data.name,
        sku: data.sku || undefined,
        description: data.description || undefined,
        category: data.category || undefined,
        unitPrice: data.unitPrice,
        currency: data.currency,
        taxable: data.taxable,
        taxRate: data.taxable ? data.taxRate : undefined,
        isActive: data.isActive,
      };

      if (productId) {
        await updateProduct({ id: productId, ...formData });
      } else {
        await createProduct(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      setValue("category", newCategory.trim());
      setNewCategory("");
      setShowNewCategory(false);
    }
  };

  if (productId && product === undefined) {
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Product name"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              placeholder="PRD-001"
              {...register("sku")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Product description..."
            rows={3}
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          {showNewCategory ? (
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
              />
              <Button type="button" onClick={handleAddNewCategory}>
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewCategory(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={category || "none"}
                onValueChange={(v) => setValue("category", v === "none" ? "" : v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCategory(true)}
              >
                New
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Pricing</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unitPrice">
              Unit Price <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("unitPrice", { valueAsNumber: true })}
              className={errors.unitPrice ? "border-red-500" : ""}
            />
            {errors.unitPrice && (
              <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
            )}
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
      </div>

      {/* Tax Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Tax Settings</h3>

        <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <Label htmlFor="taxable" className="font-medium">Taxable</Label>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Apply tax to this product
            </p>
          </div>
          <Switch
            id="taxable"
            checked={taxable}
            onCheckedChange={(checked) => setValue("taxable", checked)}
          />
        </div>

        {taxable && (
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="8.5"
              {...register("taxRate", { valueAsNumber: true })}
            />
            <p className="text-xs text-zinc-500">
              Leave blank to use default tax rate
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <Label htmlFor="isActive" className="font-medium">Active</Label>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Active products can be added to quotes
          </p>
        </div>
        <Switch
          id="isActive"
          checked={watch("isActive")}
          onCheckedChange={(checked) => setValue("isActive", checked)}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {productId ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
