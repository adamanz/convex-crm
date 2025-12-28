"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  DollarSign,
  Target,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency, formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { PreviewPanel, PreviewSection, PreviewRow, PreviewActions } from "./PreviewPanel";

export interface DealPreviewData {
  _id: string;
  name: string;
  amount?: number;
  currency: string;
  probability?: number;
  status: "open" | "won" | "lost";
  stageId: string;
  stageName?: string;
  stageColor?: string;
  expectedCloseDate?: number;
  actualCloseDate?: number;
  lostReason?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  company?: {
    _id: string;
    name: string;
    logoUrl?: string;
  } | null;
  contacts?: Array<{
    _id: string;
    firstName?: string;
    lastName: string;
    avatarUrl?: string;
    title?: string;
    email?: string;
  }>;
  pipeline?: {
    _id: string;
    name: string;
    stages: Array<{
      id: string;
      name: string;
      color: string;
      order: number;
    }>;
  } | null;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
}

interface DealPreviewProps {
  deal: DealPreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealPreview({
  deal,
  open,
  onOpenChange,
}: DealPreviewProps) {
  if (!deal) return null;

  const stages = deal.pipeline?.stages || [];
  const currentStageIndex = stages.findIndex((s) => s.id === deal.stageId);

  const statusVariant = {
    open: "secondary",
    won: "success",
    lost: "destructive",
  } as const;

  return (
    <PreviewPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Deal Preview"
    >
      <div className="flex flex-col h-full">
        {/* Deal Header */}
        <div className="px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold truncate">{deal.name}</h2>
                <Badge variant={statusVariant[deal.status]}>
                  {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                </Badge>
              </div>
              {deal.company && (
                <Link
                  href={`/companies/${deal.company._id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {deal.company.name}
                </Link>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold">
                {deal.amount !== undefined
                  ? formatCurrency(deal.amount, deal.currency)
                  : "-"}
              </p>
              {deal.probability !== undefined && (
                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {deal.probability}% probability
                </p>
              )}
            </div>
          </div>

          {/* Stage Progress */}
          {deal.status === "open" && stages.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pipeline Progress</span>
                <span className="font-medium">
                  {deal.stageName || stages[currentStageIndex]?.name} ({currentStageIndex + 1}/{stages.length})
                </span>
              </div>
              <div className="flex gap-1">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-all",
                      index <= currentStageIndex ? "" : "opacity-30"
                    )}
                    style={{
                      backgroundColor:
                        index <= currentStageIndex ? stage.color : "#e4e4e7",
                    }}
                    title={stage.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {deal.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Deal Details */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          {/* Key Info */}
          <PreviewSection title="Deal Information">
            <div className="space-y-2">
              <PreviewRow
                label="Pipeline"
                value={deal.pipeline?.name || "Default Pipeline"}
                icon={<Target className="h-4 w-4" />}
              />
              <PreviewRow
                label="Stage"
                value={
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: deal.stageColor }}
                    />
                    {deal.stageName}
                  </span>
                }
                icon={<Target className="h-4 w-4" />}
              />
              {deal.expectedCloseDate && (
                <PreviewRow
                  label="Expected Close"
                  value={formatDate(deal.expectedCloseDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              )}
              {deal.actualCloseDate && (
                <PreviewRow
                  label="Closed On"
                  value={formatDate(deal.actualCloseDate)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              )}
              {deal.lostReason && (
                <PreviewRow
                  label="Lost Reason"
                  value={deal.lostReason}
                  icon={<Target className="h-4 w-4" />}
                />
              )}
            </div>
          </PreviewSection>

          {/* Company */}
          {deal.company && (
            <PreviewSection title="Company">
              <Link
                href={`/companies/${deal.company._id}`}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {deal.company.logoUrl ? (
                    <img
                      src={deal.company.logoUrl}
                      alt={deal.company.name}
                      className="h-6 w-6 rounded"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{deal.company.name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </PreviewSection>
          )}

          {/* Related Contacts */}
          {deal.contacts && deal.contacts.length > 0 && (
            <PreviewSection title={`Contacts (${deal.contacts.length})`}>
              <div className="space-y-2">
                {deal.contacts.slice(0, 3).map((contact) => (
                  <Link
                    key={contact._id}
                    href={`/contacts/${contact._id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      {contact.avatarUrl && (
                        <AvatarImage src={contact.avatarUrl} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                      </p>
                      {contact.title && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.title}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
                {deal.contacts.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/deals/${deal._id}?tab=contacts`}>
                      View all {deal.contacts.length} contacts
                    </Link>
                  </Button>
                )}
              </div>
            </PreviewSection>
          )}

          {/* Owner */}
          {deal.owner && (
            <PreviewSection title="Deal Owner">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-10 w-10">
                  {deal.owner.avatarUrl && (
                    <AvatarImage src={deal.owner.avatarUrl} />
                  )}
                  <AvatarFallback>
                    {getInitials(deal.owner.firstName, deal.owner.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {[deal.owner.firstName, deal.owner.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="text-sm text-muted-foreground">Owner</p>
                </div>
              </div>
            </PreviewSection>
          )}

          {/* Timestamps */}
          <PreviewSection title="Timeline">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(deal.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(deal.updatedAt)}
                </span>
              </div>
            </div>
          </PreviewSection>
        </div>

        {/* Footer Actions */}
        <PreviewActions>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/deals/${deal._id}`}>
              View Full Details
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </PreviewActions>
      </div>
    </PreviewPanel>
  );
}

export default DealPreview;
