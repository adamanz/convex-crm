"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  HandshakeIcon,
  ArrowRight,
  Mail,
  Phone,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials, formatCurrency } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type SearchResultType = "contact" | "company" | "deal";

export interface ContactSearchResult {
  type: "contact";
  id: string;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  title?: string;
  company?: {
    name: string;
  } | null;
}

export interface CompanySearchResult {
  type: "company";
  id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  contactCount?: number;
}

export interface DealSearchResult {
  type: "deal";
  id: string;
  name: string;
  amount?: number;
  currency: string;
  status: "open" | "won" | "lost";
  stageName?: string;
  stageColor?: string;
  company?: {
    name: string;
  } | null;
}

export type SearchResult =
  | ContactSearchResult
  | CompanySearchResult
  | DealSearchResult;

// ============================================================================
// Icon mapping
// ============================================================================

const typeIcons: Record<SearchResultType, React.ElementType> = {
  contact: User,
  company: Building2,
  deal: HandshakeIcon,
};

const typeLabels: Record<SearchResultType, string> = {
  contact: "Contact",
  company: "Company",
  deal: "Deal",
};

// ============================================================================
// SearchResult Component
// ============================================================================

export interface SearchResultProps {
  result: SearchResult;
  onSelect?: (result: SearchResult) => void;
  isSelected?: boolean;
  showType?: boolean;
  className?: string;
}

export function SearchResultItem({
  result,
  onSelect,
  isSelected = false,
  showType = true,
  className,
}: SearchResultProps) {
  const router = useRouter();
  const Icon = typeIcons[result.type];

  const handleSelect = () => {
    if (onSelect) {
      onSelect(result);
    } else {
      // Default navigation
      const paths: Record<SearchResultType, string> = {
        contact: `/contacts/${result.id}`,
        company: `/companies/${result.id}`,
        deal: `/deals/${result.id}`,
      };
      router.push(paths[result.type]);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      tabIndex={0}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 cursor-pointer",
        "rounded-lg transition-colors duration-100",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-800",
        isSelected && "bg-neutral-100 dark:bg-neutral-800",
        className
      )}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0">
        {result.type === "contact" ? (
          <Avatar className="h-9 w-9">
            {result.avatarUrl && (
              <AvatarImage src={result.avatarUrl} alt={result.lastName} />
            )}
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {getInitials(result.firstName, result.lastName)}
            </AvatarFallback>
          </Avatar>
        ) : result.type === "company" && result.logoUrl ? (
          <img
            src={result.logoUrl}
            alt={result.name}
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-lg",
              "bg-neutral-100 dark:bg-neutral-800"
            )}
          >
            <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {result.type === "contact"
              ? [result.firstName, result.lastName].filter(Boolean).join(" ")
              : result.name}
          </span>
          {showType && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {typeLabels[result.type]}
            </Badge>
          )}
        </div>
        <SearchResultMeta result={result} />
      </div>

      {/* Trailing icon */}
      <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ============================================================================
// SearchResultMeta - Type-specific metadata display
// ============================================================================

function SearchResultMeta({ result }: { result: SearchResult }) {
  switch (result.type) {
    case "contact":
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {result.title && result.company?.name && (
            <span className="truncate">
              {result.title} at {result.company.name}
            </span>
          )}
          {!result.title && result.company?.name && (
            <span className="truncate">{result.company.name}</span>
          )}
          {result.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {result.email}
            </span>
          )}
          {result.phone && !result.email && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {result.phone}
            </span>
          )}
        </div>
      );

    case "company":
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {result.industry && <span>{result.industry}</span>}
          {result.domain && <span className="truncate">{result.domain}</span>}
          {result.contactCount !== undefined && result.contactCount > 0 && (
            <span>
              {result.contactCount} contact{result.contactCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      );

    case "deal":
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {result.amount !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(result.amount, result.currency)}
            </span>
          )}
          {result.stageName && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{
                borderColor: result.stageColor,
                color: result.stageColor,
              }}
            >
              {result.stageName}
            </Badge>
          )}
          {result.company?.name && (
            <span className="truncate">{result.company.name}</span>
          )}
          {result.status !== "open" && (
            <Badge
              variant={result.status === "won" ? "success" : "destructive"}
              className="text-[10px] px-1.5 py-0"
            >
              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
            </Badge>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default SearchResultItem;
