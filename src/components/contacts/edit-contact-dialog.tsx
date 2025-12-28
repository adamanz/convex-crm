"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
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
import { Loader2 } from "lucide-react";

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    _id: string;
    firstName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
    linkedinUrl?: string;
    twitterHandle?: string;
    source?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
}: EditContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: contact.firstName || "",
    lastName: contact.lastName,
    email: contact.email || "",
    phone: contact.phone || "",
    title: contact.title || "",
    linkedinUrl: contact.linkedinUrl || "",
    twitterHandle: contact.twitterHandle || "",
    source: contact.source || "",
    street: contact.address?.street || "",
    city: contact.address?.city || "",
    state: contact.address?.state || "",
    postalCode: contact.address?.postalCode || "",
    country: contact.address?.country || "",
  });

  // Reset form when contact changes
  useEffect(() => {
    setFormData({
      firstName: contact.firstName || "",
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      linkedinUrl: contact.linkedinUrl || "",
      twitterHandle: contact.twitterHandle || "",
      source: contact.source || "",
      street: contact.address?.street || "",
      city: contact.address?.city || "",
      state: contact.address?.state || "",
      postalCode: contact.address?.postalCode || "",
      country: contact.address?.country || "",
    });
  }, [contact]);

  const updateContact = useMutation(api.contacts.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lastName.trim()) return;

    setIsLoading(true);
    try {
      const hasAddress =
        formData.street ||
        formData.city ||
        formData.state ||
        formData.postalCode ||
        formData.country;

      await updateContact({
        id: contact._id as Id<"contacts">,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        title: formData.title || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        twitterHandle: formData.twitterHandle || undefined,
        source: formData.source || undefined,
        address: hasAddress
          ? {
              street: formData.street || undefined,
              city: formData.city || undefined,
              state: formData.state || undefined,
              postalCode: formData.postalCode || undefined,
              country: formData.country || undefined,
            }
          : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleChange("title")}
                    placeholder="CEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={handleChange("source")}
                    placeholder="Website, Referral, etc."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Social Links
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={handleChange("linkedinUrl")}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Twitter Handle</Label>
                  <Input
                    id="twitterHandle"
                    value={formData.twitterHandle}
                    onChange={handleChange("twitterHandle")}
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Address
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={handleChange("street")}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={handleChange("city")}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={handleChange("state")}
                      placeholder="CA"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange("postalCode")}
                      placeholder="94102"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={handleChange("country")}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
              type="submit"
              disabled={isLoading || !formData.lastName.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
