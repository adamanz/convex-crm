"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Users, Calendar, GripVertical } from "lucide-react";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

export interface DealCardData {
  id: Id<"deals">;
  name: string;
  amount?: number;
  currency: string;
  probability?: number;
  expectedCloseDate?: number;
  status: "open" | "won" | "lost";
  companyName?: string;
  contactCount: number;
  tags: string[];
  stageChangedAt: number;
}

interface DealCardProps {
  deal: DealCardData;
  onClick?: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function DealCard({
  deal,
  onClick,
  isDragging = false,
  isOverlay = false,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all",
        "hover:border-zinc-300 hover:shadow-md dark:bg-zinc-900 dark:hover:border-zinc-700",
        isActive && "opacity-50 ring-2 ring-primary",
        isOverlay && "shadow-xl ring-2 ring-primary opacity-100"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute right-2 top-2 cursor-grab p-1 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-zinc-400" />
      </div>

      {/* Deal Name and Amount */}
      <div className="mb-2 pr-6">
        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {deal.name}
        </h4>
        {deal.amount !== undefined && (
          <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(deal.amount, deal.currency)}
          </p>
        )}
      </div>

      {/* Company and Contacts */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {deal.companyName && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{deal.companyName}</span>
          </div>
        )}
        {deal.contactCount > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{deal.contactCount}</span>
          </div>
        )}
      </div>

      {/* Expected Close Date */}
      {deal.expectedCloseDate && (
        <div className="mb-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Calendar className="h-3 w-3" />
          <span>Close: {formatDate(deal.expectedCloseDate)}</span>
        </div>
      )}

      {/* Tags */}
      {deal.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {deal.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {tag}
            </Badge>
          ))}
          {deal.tags.length > 3 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              +{deal.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Footer: Probability and Last Updated */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
        {deal.probability !== undefined && (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span>{deal.probability}%</span>
          </div>
        )}
        <span>{formatRelativeTime(deal.stageChangedAt)}</span>
      </div>

      {/* Status Indicator for Won/Lost */}
      {deal.status !== "open" && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-1 rounded-b-lg",
            deal.status === "won" && "bg-emerald-500",
            deal.status === "lost" && "bg-red-500"
          )}
        />
      )}
    </div>
  );
}
