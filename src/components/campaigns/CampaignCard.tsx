"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Mail,
  Share2,
  Megaphone,
  Calendar,
  Users,
  Gift,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const typeIcons = {
  email: Mail,
  social: Share2,
  ads: Megaphone,
  event: Calendar,
  referral: Gift,
  other: MoreHorizontal,
};

const typeColors = {
  email: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ads: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  event: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  referral: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusColors = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

interface CampaignCardProps {
  campaign: Doc<"campaigns"> & {
    owner?: Doc<"users"> | null;
  };
  onClick?: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const TypeIcon = typeIcons[campaign.type];
  const conversionRate = campaign.memberCount > 0
    ? ((campaign.convertedCount / campaign.memberCount) * 100).toFixed(1)
    : "0";

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        campaign.isActive && "border-l-4 border-l-green-500"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", typeColors[campaign.type])}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {campaign.name}
              </CardTitle>
              {campaign.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {campaign.description}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn("shrink-0", statusColors[campaign.status])}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="text-xs">Members</span>
            </div>
            <span className="text-lg font-semibold">{campaign.memberCount}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Converted</span>
            </div>
            <span className="text-lg font-semibold">{conversionRate}%</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Revenue</span>
            </div>
            <span className="text-lg font-semibold">
              {formatCurrency(campaign.totalRevenue, campaign.currency)}
            </span>
          </div>
        </div>

        {(campaign.startDate || campaign.endDate) && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {campaign.startDate && (
              <span>{format(new Date(campaign.startDate), "MMM d, yyyy")}</span>
            )}
            {campaign.startDate && campaign.endDate && <span>-</span>}
            {campaign.endDate && (
              <span>{format(new Date(campaign.endDate), "MMM d, yyyy")}</span>
            )}
          </div>
        )}

        {campaign.budget && (
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">Budget</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatCurrency(campaign.actualSpend ?? 0, campaign.currency)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span>{formatCurrency(campaign.budget, campaign.currency)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignCard;
