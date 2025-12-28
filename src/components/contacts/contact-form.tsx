"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Company, ContactFormData } from "@/types/contacts";
import { InlineValidation } from "@/components/validation";

// Form values type - explicitly defined for type safety
interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  title: string;
  tags: string[];
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Zod schema for form validation
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.union([z.string().email("Please enter a valid email address"), z.literal("")]),
  phone: z.string(),
  companyId: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
});

interface ContactFormProps {
  companies?: Company[];
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  className?: string;
  entityId?: string; // For validation against existing entity
}

export function ContactForm({
  companies = [],
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Contact",
  className,
  entityId,
}: ContactFormProps) {
  const [tagInput, setTagInput] = React.useState("");
  const [companyOpen, setCompanyOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      companyId: initialData?.companyId || "",
      title: initialData?.title || "",
      tags: initialData?.tags || [],
      address: {
        street: initialData?.address?.street || "",
        city: initialData?.address?.city || "",
        state: initialData?.address?.state || "",
        postalCode: initialData?.address?.postalCode || "",
        country: initialData?.address?.country || "",
      },
    },
  });

  const tags = watch("tags");
  const selectedCompanyId = watch("companyId");
  const selectedCompany = companies.find((c) => c._id === selectedCompanyId);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setValue("tags", [...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onFormSubmit = (data: ContactFormValues) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* Name Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register("firstName")}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register("lastName")}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
          <InlineValidation
            entityType="contact"
            field="email"
            value={watch("email")}
            entityId={entityId}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register("phone")}
          />
          <InlineValidation
            entityType="contact"
            field="phone"
            value={watch("phone")}
            entityId={entityId}
          />
        </div>
      </div>

      {/* Company and Title Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Company</Label>
          <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={companyOpen}
                className="w-full justify-between font-normal"
              >
                {selectedCompany ? (
                  <span className="truncate">{selectedCompany.name}</span>
                ) : (
                  <span className="text-muted-foreground">Select company...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search companies..." />
                <CommandList>
                  <CommandEmpty>No company found.</CommandEmpty>
                  <CommandGroup>
                    {companies.map((company) => (
                      <CommandItem
                        key={company._id}
                        value={company.name}
                        onSelect={() => {
                          setValue(
                            "companyId",
                            company._id === selectedCompanyId ? "" : company._id
                          );
                          setCompanyOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCompanyId === company._id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.name}
                              className="h-5 w-5 rounded object-cover"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{company.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Software Engineer"
            {...register("title")}
          />
        </div>
      </div>

      {/* Tags Section */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="tags"
          placeholder="Type a tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter to add a tag
        </p>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Address</Label>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              placeholder="123 Main St"
              {...register("address.street")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="San Francisco"
                {...register("address.city")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                placeholder="CA"
                {...register("address.state")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="94105"
                {...register("address.postalCode")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="United States"
                {...register("address.country")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
