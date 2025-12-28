"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, Building2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export interface DealCardData {
  _id: Id<"deals">;
  name: string;
  amount?: number;
  currency: string;
  expectedCloseDate?: number;
  stageId: string;
  company?: {
    _id: Id<"companies">;
    name: string;
    logoUrl?: string;
  } | null;
  owner?: {
    _id: Id<"users">;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
}

interface DealCardProps {
  deal: DealCardData;
  isDragging?: boolean;
  onClick?: () => void;
}

export function DealCard({ deal, isDragging, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal._id,
    data: {
      type: "deal",
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        isCurrentlyDragging && "opacity-50 shadow-lg rotate-2 scale-105 z-50",
        "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100",
          "cursor-grab active:cursor-grabbing transition-opacity duration-200",
          "p-1 rounded hover:bg-muted"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Card Content */}
      <div className="space-y-3">
        {/* Deal Name */}
        <div className="font-medium text-sm leading-tight line-clamp-2">
          {deal.name}
        </div>

        {/* Company */}
        {deal.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}

        {/* Amount */}
        {deal.amount !== undefined && deal.amount > 0 && (
          <div className="text-sm font-semibold text-primary">
            {formatCurrency(deal.amount, deal.currency)}
          </div>
        )}

        {/* Footer - Date and Owner */}
        <div className="flex items-center justify-between pt-1">
          {/* Expected Close Date */}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(deal.expectedCloseDate)}</span>
            </div>
          )}

          {/* Owner Avatar */}
          {deal.owner && (
            <Avatar
              src={deal.owner.avatarUrl}
              fallback={getInitials(deal.owner.firstName, deal.owner.lastName)}
              size="sm"
              className="ml-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || "";
  const last = lastName?.charAt(0).toUpperCase() || "";
  return first + last || "?";
}

// Overlay component for drag preview
export function DealCardOverlay({ deal }: { deal: DealCardData }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-xl",
        "rotate-3 scale-105 opacity-90"
      )}
    >
      <div className="space-y-2">
        <div className="font-medium text-sm leading-tight line-clamp-2">
          {deal.name}
        </div>
        {deal.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
        {deal.amount !== undefined && deal.amount > 0 && (
          <div className="text-sm font-semibold text-primary">
            {formatCurrency(deal.amount, deal.currency)}
          </div>
        )}
      </div>
    </div>
  );
}
