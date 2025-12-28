"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Share2,
  Megaphone,
  Calendar,
  Gift,
  MoreHorizontal,
  Check,
  Users,
} from "lucide-react";

const typeIcons = {
  email: Mail,
  social: Share2,
  ads: Megaphone,
  event: Calendar,
  referral: Gift,
  other: MoreHorizontal,
};

const statusColors = {
  draft: "bg-zinc-100 text-zinc-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
};

interface AddToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: Id<"contacts">[];
  onSuccess?: () => void;
}

export function AddToCampaignDialog({
  open,
  onOpenChange,
  contactIds,
  onSuccess,
}: AddToCampaignDialogProps) {
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<Id<"campaigns"> | null>(null);
  const [source, setSource] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const campaignsData = useQuery(api.campaigns.list, {
    paginationOpts: { numItems: 100 },
    filter: { status: "active" },
  });

  const addMembers = useMutation(api.campaigns.addMembers);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedCampaignId(null);
      setSource("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedCampaignId) {
      toast.error("Please select a campaign");
      return;
    }

    if (contactIds.length === 0) {
      toast.error("No contacts selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addMembers({
        campaignId: selectedCampaignId,
        contactIds,
        source: source || undefined,
      });

      if (result.added > 0) {
        toast.success(
          `Added ${result.added} contact${result.added > 1 ? "s" : ""} to campaign`
        );
      }

      if (result.skipped > 0) {
        toast.info(
          `${result.skipped} contact${result.skipped > 1 ? "s were" : " was"} already in the campaign`
        );
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add contacts to campaign");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCampaign = React.useMemo(() => {
    if (!selectedCampaignId || !campaignsData?.page) return null;
    return campaignsData.page.find((c) => c._id === selectedCampaignId);
  }, [selectedCampaignId, campaignsData?.page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Campaign</DialogTitle>
          <DialogDescription>
            Add {contactIds.length} contact{contactIds.length > 1 ? "s" : ""} to a
            marketing campaign for tracking and attribution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campaign Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Campaign</label>
            {campaignsData === undefined ? (
              <Skeleton className="h-10 w-full" />
            ) : campaignsData.page.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                No active campaigns available.
                <br />
                Create a campaign first to add contacts.
              </div>
            ) : (
              <Command className="border rounded-md">
                <CommandInput placeholder="Search campaigns..." />
                <CommandList className="max-h-48">
                  <CommandEmpty>No campaigns found.</CommandEmpty>
                  <CommandGroup>
                    {campaignsData.page.map((campaign) => {
                      const TypeIcon = typeIcons[campaign.type];
                      const isSelected = selectedCampaignId === campaign._id;

                      return (
                        <CommandItem
                          key={campaign._id}
                          value={campaign.name}
                          onSelect={() => setSelectedCampaignId(campaign._id)}
                          className={cn(
                            "flex items-center justify-between cursor-pointer",
                            isSelected && "bg-zinc-100 dark:bg-zinc-800"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{campaign.name}</span>
                            <Badge
                              className={cn("text-xs", statusColors[campaign.status])}
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {campaign.memberCount}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>

          {/* Selected Campaign Info */}
          {selectedCampaign && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm">
              <p className="font-medium">{selectedCampaign.name}</p>
              {selectedCampaign.description && (
                <p className="text-muted-foreground text-xs mt-1">
                  {selectedCampaign.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{selectedCampaign.memberCount} members</span>
                <span>{selectedCampaign.convertedCount} converted</span>
              </div>
            </div>
          )}

          {/* Source Tag (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Source Tag <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., webinar-signup, linkedin-ad"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Tag to track how these contacts were added to the campaign
            </p>
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
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCampaignId}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddToCampaignDialog;
