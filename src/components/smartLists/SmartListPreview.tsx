"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Building2,
  Handshake,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn, getInitials, formatCurrency } from "@/lib/utils";
import { Filter } from "./FilterRow";

// ============================================================================
// Types
// ============================================================================

type EntityType = "contact" | "company" | "deal";

interface SmartListPreviewProps {
  entityType: EntityType;
  filters: Filter[];
  limit?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SmartListPreview({
  entityType,
  filters,
  limit = 10,
  className,
}: SmartListPreviewProps) {
  // Convert filters to the format expected by the API
  const apiFilters = filters.map((f) => ({
    id: f.id,
    field: f.field,
    operator: f.operator,
    value: f.value,
    conjunction: f.conjunction,
  }));

  const previewData = useQuery(api.smartLists.previewSmartListMembers, {
    entityType,
    filters: apiFilters,
    limit,
  });

  const isLoading = previewData === undefined;

  const getEntityIcon = () => {
    switch (entityType) {
      case "contact":
        return Users;
      case "company":
        return Building2;
      case "deal":
        return Handshake;
      default:
        return Users;
    }
  };

  const EntityIcon = getEntityIcon();

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <EntityIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Preview</span>
        </div>
        {!isLoading && (
          <Badge variant="secondary">
            {previewData.count} {previewData.count === 1 ? "result" : "results"}
          </Badge>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : previewData.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No {entityType === "company" ? "companies" : `${entityType}s`} match
              your filters
            </p>
            {filters.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Add filters to see matching results
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {previewData.members.map((member) => (
              <PreviewItem
                key={member._id}
                member={member}
                entityType={entityType}
              />
            ))}
            {previewData.count > limit && (
              <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30">
                Showing {limit} of {previewData.count} results
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Preview Item Component
// ============================================================================

interface PreviewItemProps {
  member: Record<string, unknown>;
  entityType: EntityType;
}

function PreviewItem({ member, entityType }: PreviewItemProps) {
  switch (entityType) {
    case "contact":
      return <ContactPreviewItem contact={member} />;
    case "company":
      return <CompanyPreviewItem company={member} />;
    case "deal":
      return <DealPreviewItem deal={member} />;
    default:
      return null;
  }
}

function ContactPreviewItem({ contact }: { contact: Record<string, unknown> }) {
  const firstName = contact.firstName as string | undefined;
  const lastName = contact.lastName as string | undefined;
  const email = contact.email as string | undefined;
  const avatarUrl = contact.avatarUrl as string | undefined;
  const tags = (contact.tags as string[]) ?? [];

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={fullName} />
        <AvatarFallback className="text-xs">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{fullName || "Unknown"}</p>
        {email && (
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyPreviewItem({ company }: { company: Record<string, unknown> }) {
  const name = company.name as string | undefined;
  const industry = company.industry as string | undefined;
  const logoUrl = company.logoUrl as string | undefined;

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30">
      <Avatar className="h-8 w-8">
        <AvatarImage src={logoUrl} alt={name} />
        <AvatarFallback className="text-xs">
          {name?.charAt(0)?.toUpperCase() ?? "C"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{name || "Unknown"}</p>
        {industry && (
          <p className="text-xs text-muted-foreground truncate">{industry}</p>
        )}
      </div>
    </div>
  );
}

function DealPreviewItem({ deal }: { deal: Record<string, unknown> }) {
  const name = deal.name as string | undefined;
  const amount = deal.amount as number | undefined;
  const currency = (deal.currency as string) ?? "USD";
  const status = deal.status as string | undefined;

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Handshake className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{name || "Unknown"}</p>
        {amount !== undefined && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(amount, currency)}
          </p>
        )}
      </div>
      {status && (
        <Badge
          className={cn("text-xs capitalize", statusColors[status] ?? "")}
          variant="secondary"
        >
          {status}
        </Badge>
      )}
    </div>
  );
}

export default SmartListPreview;
