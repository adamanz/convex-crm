"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";

interface AddCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: Id<"contacts">;
}

export function AddCallDialog({ open, onOpenChange, preselectedContactId }: AddCallDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    relatedToId: preselectedContactId || "",
    relatedToType: "contact" as "contact" | "company" | "deal",
    outcome: "outgoing" as "incoming" | "outgoing" | "missed",
    duration: "",
  });

  const createActivity = useMutation(api.activities.create);

  // Fetch contacts for the combobox
  const contactsResult = useQuery(api.contacts.search, {
    searchTerm: searchQuery,
    limit: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.relatedToId) return;

    setIsLoading(true);
    try {
      await createActivity({
        type: "call",
        subject: formData.subject,
        description: formData.description || undefined,
        relatedToType: formData.relatedToType,
        relatedToId: formData.relatedToId,
        outcome: formData.outcome,
        duration: formData.duration ? parseInt(formData.duration) * 60 : undefined, // Convert minutes to seconds
      });

      toast.success("Call logged successfully");

      setFormData({
        subject: "",
        description: "",
        relatedToId: preselectedContactId || "",
        relatedToType: "contact",
        outcome: "outgoing",
        duration: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create call:", error);
      toast.error("Failed to log call");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const contactOptions = (contactsResult || []).map((contact) => ({
    value: contact._id,
    label: `${contact.firstName || ""} ${contact.lastName}`.trim(),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Record details about a phone call with a contact, company, or deal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Call Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={handleChange("subject")}
                placeholder="e.g., Discovery call, Follow-up, Demo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outcome">
                  Call Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.outcome}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      outcome: value as "incoming" | "outgoing" | "missed",
                    }))
                  }
                >
                  <SelectTrigger id="outcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={handleChange("duration")}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relatedToType">Related To</Label>
                <Select
                  value={formData.relatedToType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      relatedToType: value as "contact" | "company" | "deal",
                      relatedToId: "", // Reset selection when type changes
                    }))
                  }
                >
                  <SelectTrigger id="relatedToType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relatedToId">
                  {formData.relatedToType === "contact"
                    ? "Contact"
                    : formData.relatedToType === "company"
                    ? "Company"
                    : "Deal"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {formData.relatedToType === "contact" ? (
                  <Combobox
                    options={contactOptions}
                    value={formData.relatedToId}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, relatedToId: value || "" }))
                    }
                    onSearchChange={setSearchQuery}
                    placeholder="Search contacts..."
                    emptyText="No contacts found"
                  />
                ) : (
                  <Input
                    id="relatedToId"
                    value={formData.relatedToId}
                    onChange={handleChange("relatedToId")}
                    placeholder={`Select ${formData.relatedToType}...`}
                    required
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleChange("description")}
                placeholder="Call notes, key discussion points, next steps..."
                rows={4}
              />
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
              disabled={isLoading || !formData.subject.trim() || !formData.relatedToId}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Log Call
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
