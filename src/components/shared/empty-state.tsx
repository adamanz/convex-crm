"use client";

import * as React from "react";
import {
  Users,
  Building2,
  DollarSign,
  MessageSquare,
  Calendar,
  FileText,
  Search,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const variantIcons: Record<string, LucideIcon> = {
  contacts: Users,
  companies: Building2,
  deals: DollarSign,
  conversations: MessageSquare,
  activities: Calendar,
  documents: FileText,
  search: Search,
  default: Inbox,
};

const variantDefaults: Record<
  string,
  { title: string; description: string }
> = {
  contacts: {
    title: "No contacts yet",
    description: "Get started by adding your first contact.",
  },
  companies: {
    title: "No companies yet",
    description: "Start building your company directory.",
  },
  deals: {
    title: "No deals in pipeline",
    description: "Create your first deal to start tracking revenue.",
  },
  conversations: {
    title: "No conversations",
    description: "Start a conversation with a contact.",
  },
  activities: {
    title: "No activities scheduled",
    description: "Schedule your first meeting or task.",
  },
  documents: {
    title: "No documents",
    description: "Upload or create your first document.",
  },
  search: {
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
  default: {
    title: "Nothing here yet",
    description: "Get started by creating your first item.",
  },
};

export type EmptyStateVariant =
  | "contacts"
  | "companies"
  | "deals"
  | "conversations"
  | "activities"
  | "documents"
  | "search"
  | "default";

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant] || variantIcons.default;
  const defaults = variantDefaults[variant] || variantDefaults.default;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title || defaults.title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description || defaults.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
