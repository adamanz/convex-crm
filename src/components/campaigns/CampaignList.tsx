"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { CampaignCard } from "./CampaignCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignStatus = "draft" | "active" | "paused" | "completed";
type CampaignType = "email" | "social" | "ads" | "event" | "referral" | "other";

interface CampaignListProps {
  onCreateClick?: () => void;
  onCampaignClick?: (campaignId: Id<"campaigns">) => void;
}

export function CampaignList({ onCreateClick, onCampaignClick }: CampaignListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<CampaignType | "all">("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Build filter object
  const filter = React.useMemo(() => {
    const f: {
      status?: CampaignStatus;
      type?: CampaignType;
    } = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (typeFilter !== "all") f.type = typeFilter;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [statusFilter, typeFilter]);

  const campaignsData = useQuery(api.campaigns.list, {
    paginationOpts: { numItems: 50 },
    filter,
  });

  // Client-side search filtering
  const filteredCampaigns = React.useMemo(() => {
    if (!campaignsData?.page) return [];
    if (!searchQuery) return campaignsData.page;

    const query = searchQuery.toLowerCase();
    return campaignsData.page.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query)
    );
  }, [campaignsData?.page, searchQuery]);

  if (campaignsData === undefined) {
    return <CampaignListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as CampaignStatus | "all")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as CampaignType | "all")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="ads">Ads</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded",
                viewMode === "grid"
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded",
                viewMode === "list"
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Grid/List */}
      {filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No campaigns found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Get started by creating your first campaign."}
          </p>
          {onCreateClick && !searchQuery && statusFilter === "all" && typeFilter === "all" && (
            <Button onClick={onCreateClick} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              onClick={() => onCampaignClick?.(campaign._id)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {!campaignsData.isDone && filteredCampaigns.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline">Load more</Button>
        </div>
      )}
    </div>
  );
}

function CampaignListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default CampaignList;
