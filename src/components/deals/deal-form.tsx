"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Zod Schema for deal form
const dealFormSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  amount: z.number().min(0, "Amount must be positive").optional(),
  currency: z.string().default("USD"),
  companyId: z.string().optional(),
  contactIds: z.array(z.string()).default([]),
  expectedCloseDate: z.string().optional(),
  stageId: z.string().min(1, "Stage is required"),
  ownerId: z.string().optional(),
});

// Use z.input for form data type to match what react-hook-form expects before parsing
export type DealFormData = z.input<typeof dealFormSchema>;
// Output type after validation with defaults applied
export type DealFormOutput = z.output<typeof dealFormSchema>;

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Company {
  _id: Id<"companies">;
  name: string;
  logoUrl?: string;
}

interface Contact {
  _id: Id<"contacts">;
  firstName?: string;
  lastName: string;
  email?: string;
}

interface User {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DealFormData) => Promise<void>;
  defaultValues?: Partial<DealFormData>;
  stages: Stage[];
  companies: Company[];
  contacts: Contact[];
  users?: User[];
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function DealForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  stages,
  companies,
  contacts,
  users = [],
  isLoading = false,
  mode = "create",
}: DealFormProps) {
  const [companySearchOpen, setCompanySearchOpen] = React.useState(false);
  const [contactSearchOpen, setContactSearchOpen] = React.useState(false);
  const [ownerSearchOpen, setOwnerSearchOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      currency: "USD",
      companyId: undefined,
      contactIds: [],
      expectedCloseDate: undefined,
      stageId: stages[0]?.id || "",
      ownerId: undefined,
      ...defaultValues,
    },
  });

  const selectedCompanyId = watch("companyId");
  const selectedContactIds = watch("contactIds");
  const selectedOwnerId = watch("ownerId");

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      reset({
        name: "",
        amount: undefined,
        currency: "USD",
        companyId: undefined,
        contactIds: [],
        expectedCloseDate: undefined,
        stageId: stages[0]?.id || "",
        ownerId: undefined,
        ...defaultValues,
      });
    }
  }, [open, reset, defaultValues, stages]);

  const selectedCompany = companies.find((c) => c._id === selectedCompanyId);
  const selectedContacts = contacts.filter((c) =>
    (selectedContactIds ?? []).includes(c._id)
  );
  const selectedOwner = users.find((u) => u._id === selectedOwnerId);

  const handleFormSubmit = async (data: DealFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setValue(
      "contactIds",
      (selectedContactIds ?? []).filter((id) => id !== contactId)
    );
  };

  const handleToggleContact = (contactId: string) => {
    const ids = selectedContactIds ?? [];
    if (ids.includes(contactId)) {
      setValue(
        "contactIds",
        ids.filter((id) => id !== contactId)
      );
    } else {
      setValue("contactIds", [...ids, contactId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Deal" : "Edit Deal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new deal to your pipeline."
              : "Update the deal details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Deal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name *</Label>
            <Input
              id="name"
              placeholder="Enter deal name"
              {...register("name")}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
                className={cn(errors.amount && "border-destructive")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (E)</SelectItem>
                      <SelectItem value="GBP">GBP (P)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label>Company</Label>
            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <Popover
                  open={companySearchOpen}
                  onOpenChange={setCompanySearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={companySearchOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedCompany ? (
                        selectedCompany.name
                      ) : (
                        <span className="text-muted-foreground">
                          Select company...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
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
                                field.onChange(
                                  company._id === field.value
                                    ? undefined
                                    : company._id
                                );
                                setCompanySearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === company._id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {company.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          {/* Contacts Multi-select */}
          <div className="space-y-2">
            <Label>Contacts</Label>
            <Popover
              open={contactSearchOpen}
              onOpenChange={setContactSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contactSearchOpen}
                  className="w-full justify-between font-normal min-h-[36px] h-auto"
                >
                  {selectedContacts.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedContacts.map((contact) => (
                        <Badge
                          key={contact._id}
                          variant="secondary"
                          className="mr-1"
                        >
                          {contact.firstName} {contact.lastName}
                          <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveContact(contact._id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Select contacts...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search contacts..." />
                  <CommandList>
                    <CommandEmpty>No contact found.</CommandEmpty>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact._id}
                          value={`${contact.firstName} ${contact.lastName}`}
                          onSelect={() => handleToggleContact(contact._id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (selectedContactIds ?? []).includes(contact._id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>
                              {contact.firstName} {contact.lastName}
                            </span>
                            {contact.email && (
                              <span className="text-xs text-muted-foreground">
                                {contact.email}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Owner Selection */}
          {users.length > 0 && (
            <div className="space-y-2">
              <Label>Owner</Label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <Popover
                    open={ownerSearchOpen}
                    onOpenChange={setOwnerSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={ownerSearchOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedOwner ? (
                          selectedOwner.firstName || selectedOwner.lastName
                            ? `${selectedOwner.firstName ?? ""} ${selectedOwner.lastName ?? ""}`.trim()
                            : selectedOwner.email
                        ) : (
                          <span className="text-muted-foreground">
                            Select owner...
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search team members..." />
                        <CommandList>
                          <CommandEmpty>No team member found.</CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => {
                              const userName = user.firstName || user.lastName
                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                                : user.email;
                              return (
                                <CommandItem
                                  key={user._id}
                                  value={userName}
                                  onSelect={() => {
                                    field.onChange(
                                      user._id === field.value
                                        ? undefined
                                        : user._id
                                    );
                                    setOwnerSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === user._id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{userName}</span>
                                    {(user.firstName || user.lastName) && (
                                      <span className="text-xs text-muted-foreground">
                                        {user.email}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          )}

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              {...register("expectedCloseDate")}
            />
          </div>

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label>Stage *</Label>
            <Controller
              name="stageId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={cn(errors.stageId && "border-destructive")}
                  >
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.stageId && (
              <p className="text-sm text-destructive">
                {errors.stageId.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Deal"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
