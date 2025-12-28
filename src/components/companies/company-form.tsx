"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Media & Entertainment",
  "Professional Services",
  "Transportation",
  "Energy",
  "Agriculture",
  "Construction",
  "Hospitality",
  "Non-Profit",
  "Government",
  "Other",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1001-5000", label: "1,001-5,000 employees" },
  { value: "5001+", label: "5,001+ employees" },
];

interface CompanyFormData {
  name: string;
  domain: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface CompanyFormProps {
  company?: {
    _id: Id<"companies">;
    name: string;
    domain?: string;
    industry?: string;
    size?: string;
    website?: string;
    phone?: string;
    description?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  onSuccess?: (id: Id<"companies">) => void;
  onCancel?: () => void;
  className?: string;
}

export function CompanyForm({
  company,
  onSuccess,
  onCancel,
  className,
}: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name ?? "",
    domain: company?.domain ?? "",
    industry: company?.industry ?? "",
    size: company?.size ?? "",
    website: company?.website ?? "",
    phone: company?.phone ?? "",
    description: company?.description ?? "",
    address: {
      street: company?.address?.street ?? "",
      city: company?.address?.city ?? "",
      state: company?.address?.state ?? "",
      postalCode: company?.address?.postalCode ?? "",
      country: company?.address?.country ?? "",
    },
  });

  const createCompany = useMutation(api.companies.create);
  const updateCompany = useMutation(api.companies.update);

  const isEditing = !!company;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name.trim(),
        domain: formData.domain.trim() || undefined,
        industry: formData.industry || undefined,
        size: formData.size || undefined,
        website: formData.website.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        description: formData.description.trim() || undefined,
        address:
          formData.address.street ||
          formData.address.city ||
          formData.address.state ||
          formData.address.postalCode ||
          formData.address.country
            ? {
                street: formData.address.street.trim() || undefined,
                city: formData.address.city.trim() || undefined,
                state: formData.address.state.trim() || undefined,
                postalCode: formData.address.postalCode.trim() || undefined,
                country: formData.address.country.trim() || undefined,
              }
            : undefined,
      };

      let resultId: Id<"companies">;

      if (isEditing) {
        await updateCompany({ id: company._id, ...data });
        resultId = company._id;
      } else {
        resultId = await createCompany(data);
      }

      onSuccess?.(resultId);
    } catch (error) {
      console.error("Error saving company:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddressField = (
    field: keyof CompanyFormData["address"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {isEditing ? "Edit Company" : "Add Company"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Basic Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Acme Inc."
              required
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="domain"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Domain
            </label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => updateField("domain", e.target.value)}
              placeholder="acme.com"
              className="bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="industry"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Industry
            </label>
            <Select
              value={formData.industry}
              onValueChange={(value) => updateField("industry", value)}
            >
              <SelectTrigger className="bg-white dark:bg-zinc-900">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="size"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Company Size
            </label>
            <Select
              value={formData.size}
              onValueChange={(value) => updateField("size", value)}
            >
              <SelectTrigger className="bg-white dark:bg-zinc-900">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Brief description of the company..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-900"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Contact Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="website"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Website
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://acme.com"
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Address
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="street"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Street Address
            </label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => updateAddressField("street", e.target.value)}
              placeholder="123 Main St"
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                City
              </label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
                placeholder="San Francisco"
                className="bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="state"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                State / Province
              </label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => updateAddressField("state", e.target.value)}
                placeholder="CA"
                className="bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="postalCode"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Postal Code
              </label>
              <Input
                id="postalCode"
                value={formData.address.postalCode}
                onChange={(e) =>
                  updateAddressField("postalCode", e.target.value)
                }
                placeholder="94102"
                className="bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="country"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Country
              </label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => updateAddressField("country", e.target.value)}
                placeholder="United States"
                className="bg-white dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Company"
          )}
        </Button>
      </div>
    </form>
  );
}
