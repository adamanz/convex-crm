"use client";

import * as React from "react";
import {
  User,
  Building2,
  DollarSign,
  MessageSquare,
  ListTodo,
  GitBranch,
  Bot,
  Workflow,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Edit2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/shared/relative-time";
import { Id, Doc } from "../../../../convex/_generated/dataModel";

// Type for audit log entry with user data
export interface AuditLogEntryData {
  _id: Id<"activityLog">;
  _creationTime: number;
  userId?: Id<"users">;
  system?: boolean;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
  user?: Doc<"users"> | null;
}

// Entity type icon mapping
const entityIcons: Record<string, LucideIcon> = {
  contact: User,
  company: Building2,
  deal: DollarSign,
  conversation: MessageSquare,
  activity: ListTodo,
  pipeline: GitBranch,
  workflow: Workflow,
};

// Action type badge variants
function getActionBadgeVariant(
  action: string
): "default" | "success" | "destructive" | "warning" | "info" {
  if (action.includes("created") || action.includes("added")) return "success";
  if (action.includes("deleted") || action.includes("removed"))
    return "destructive";
  if (action.includes("updated") || action.includes("changed")) return "warning";
  return "info";
}

// Format action for display
function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Format entity type for display
function formatEntityType(entityType: string): string {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

// Get initials from user
function getUserInitials(user?: Doc<"users"> | null): string {
  if (!user) return "SYS";
  const first = user.firstName?.charAt(0).toUpperCase() || "";
  const last = user.lastName?.charAt(0).toUpperCase() || "";
  return first + last || user.email.charAt(0).toUpperCase();
}

// Get user display name
function getUserDisplayName(user?: Doc<"users"> | null, isSystem?: boolean): string {
  if (isSystem || !user) return "System";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email;
}

// Diff component for showing changes
interface DiffViewProps {
  changes: Record<string, unknown>;
}

function DiffView({ changes }: DiffViewProps) {
  const entries = Object.entries(changes);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No changes recorded
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
          </div>
          <div className="text-sm text-zinc-900 dark:text-zinc-100">
            {formatValue(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Format value for display
function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-zinc-400 italic">empty</span>;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-zinc-400 italic">empty list</span>;
      }
      return value.map((v) => formatValue(v)).join(", ");
    }
    // For objects (like address), format them nicely
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="text-zinc-400 italic">empty</span>;
    }
    return (
      <div className="space-y-1 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">{k}: </span>
            <span>{formatValue(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
}

// Metadata display component
interface MetadataViewProps {
  metadata: Record<string, unknown>;
}

function MetadataView({ metadata }: MetadataViewProps) {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Additional Information
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}:{" "}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AuditLogEntryProps {
  entry: AuditLogEntryData;
  showEntityLink?: boolean;
  className?: string;
}

export function AuditLogEntry({
  entry,
  showEntityLink = true,
  className,
}: AuditLogEntryProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const EntityIcon = entityIcons[entry.entityType] || ListTodo;
  const hasDetails = entry.changes || entry.metadata;

  // Determine action icon
  const ActionIcon = entry.action.includes("created")
    ? Plus
    : entry.action.includes("deleted")
      ? Trash2
      : entry.action.includes("updated")
        ? Edit2
        : Minus;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-4 transition-all dark:border-zinc-800 dark:bg-zinc-950",
        isExpanded && "ring-1 ring-zinc-300 dark:ring-zinc-700",
        className
      )}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-medium",
              entry.system || !entry.user
                ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
            )}
          >
            {entry.system || !entry.user ? (
              <Bot className="h-4 w-4" />
            ) : (
              getUserInitials(entry.user)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* User name */}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {getUserDisplayName(entry.user, entry.system)}
            </span>

            {/* Action badge */}
            <Badge
              variant={getActionBadgeVariant(entry.action)}
              className="text-xs"
            >
              <ActionIcon className="mr-1 h-3 w-3" />
              {formatAction(entry.action)}
            </Badge>

            {/* Entity info */}
            <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
              <EntityIcon className="h-3.5 w-3.5" />
              <span>{formatEntityType(entry.entityType)}</span>
              {showEntityLink && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  {entry.entityId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <RelativeTime
            date={entry.timestamp}
            className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500"
          />
        </div>

        {/* Expand button */}
        {hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {entry.changes && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Changes
              </h4>
              <DiffView changes={entry.changes as Record<string, unknown>} />
            </div>
          )}
          {entry.metadata && (
            <MetadataView
              metadata={entry.metadata as Record<string, unknown>}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
interface AuditLogEntryCompactProps {
  entry: AuditLogEntryData;
  className?: string;
}

export function AuditLogEntryCompact({
  entry,
  className,
}: AuditLogEntryCompactProps) {
  const EntityIcon = entityIcons[entry.entityType] || ListTodo;

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 text-sm",
        className
      )}
    >
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarFallback
          className={cn(
            "text-[10px] font-medium",
            entry.system || !entry.user
              ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
          )}
        >
          {entry.system || !entry.user ? (
            <Bot className="h-3 w-3" />
          ) : (
            getUserInitials(entry.user)
          )}
        </AvatarFallback>
      </Avatar>

      <span className="text-zinc-500 dark:text-zinc-400">
        {getUserDisplayName(entry.user, entry.system)}
      </span>

      <span className="text-zinc-900 dark:text-zinc-100">
        {formatAction(entry.action)}
      </span>

      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
        <EntityIcon className="h-3 w-3" />
        <span>{formatEntityType(entry.entityType)}</span>
      </div>

      <RelativeTime
        date={entry.timestamp}
        className="ml-auto text-xs"
      />
    </div>
  );
}
