"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type CampaignType = "email" | "social" | "ads" | "event" | "referral" | "other";
type CampaignStatus = "draft" | "active" | "paused" | "completed";

interface CampaignFormData {
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency: string;
  goals?: {
    impressions?: number;
    clicks?: number;
    leads?: number;
    revenue?: number;
  };
}

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Doc<"campaigns"> | null;
  onSuccess?: (campaignId: Id<"campaigns">) => void;
}

export function CampaignForm({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignFormProps) {
  const isEditing = !!campaign;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState<CampaignFormData>({
    name: "",
    description: "",
    type: "email",
    status: "draft",
    currency: "USD",
    goals: {},
  });

  // Reset form when dialog opens/closes or campaign changes
  React.useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description ?? "",
        type: campaign.type,
        status: campaign.status,
        startDate: campaign.startDate ? new Date(campaign.startDate) : undefined,
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
        budget: campaign.budget,
        currency: campaign.currency,
        goals: campaign.goals ?? {},
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "email",
        status: "draft",
        currency: "USD",
        goals: {},
      });
    }
  }, [campaign, open]);

  const createCampaign = useMutation(api.campaigns.create);
  const updateCampaign = useMutation(api.campaigns.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && campaign) {
        await updateCampaign({
          id: campaign._id,
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          status: formData.status,
          startDate: formData.startDate?.getTime(),
          endDate: formData.endDate?.getTime(),
          budget: formData.budget,
          currency: formData.currency,
          goals: Object.keys(formData.goals ?? {}).length > 0 ? formData.goals : undefined,
        });
        toast.success("Campaign updated successfully");
        onSuccess?.(campaign._id);
      } else {
        const campaignId = await createCampaign({
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          status: formData.status,
          startDate: formData.startDate?.getTime(),
          endDate: formData.endDate?.getTime(),
          budget: formData.budget,
          currency: formData.currency,
          goals: Object.keys(formData.goals ?? {}).length > 0 ? formData.goals : undefined,
        });
        toast.success("Campaign created successfully");
        onSuccess?.(campaignId);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update campaign" : "Failed to create campaign");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof CampaignFormData>(
    field: K,
    value: CampaignFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateGoal = (field: keyof NonNullable<CampaignFormData["goals"]>, value: number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Campaign" : "Create Campaign"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the campaign details below."
              : "Fill in the details to create a new marketing campaign."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., Summer Sale 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField("type", value as CampaignType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="ads">Paid Ads</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value as CampaignStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of the campaign..."
                rows={3}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Timeline</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  date={formData.startDate}
                  onSelect={(date) => updateField("startDate", date)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  date={formData.endDate}
                  onSelect={(date) => updateField("endDate", date)}
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Budget</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Amount</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget ?? ""}
                  onChange={(e) =>
                    updateField(
                      "budget",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => updateField("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Goals (Optional)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goalImpressions">Target Impressions</Label>
                <Input
                  id="goalImpressions"
                  type="number"
                  min="0"
                  value={formData.goals?.impressions ?? ""}
                  onChange={(e) =>
                    updateGoal(
                      "impressions",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalClicks">Target Clicks</Label>
                <Input
                  id="goalClicks"
                  type="number"
                  min="0"
                  value={formData.goals?.clicks ?? ""}
                  onChange={(e) =>
                    updateGoal(
                      "clicks",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalLeads">Target Leads</Label>
                <Input
                  id="goalLeads"
                  type="number"
                  min="0"
                  value={formData.goals?.leads ?? ""}
                  onChange={(e) =>
                    updateGoal(
                      "leads",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalRevenue">Target Revenue</Label>
                <Input
                  id="goalRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.goals?.revenue ?? ""}
                  onChange={(e) =>
                    updateGoal(
                      "revenue",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignForm;
