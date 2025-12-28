"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  MoreHorizontal,
  Users,
  Building2,
  Handshake,
  RefreshCw,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EntityType = "contact" | "company" | "deal";

interface SmartListSidebarProps {
  entityType: EntityType;
  onCreateNew?: () => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  selectedListId?: string;
  className?: string;
}

const entityIcons: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  contact: Users,
  company: Building2,
  deal: Handshake,
};

export function SmartListSidebar({
  entityType,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
  onRefresh,
  selectedListId,
  className,
}: SmartListSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const smartLists = useQuery(api.smartLists.listSmartLists, {
    entityType,
  });

  const isLoading = smartLists === undefined;

  const Icon = entityIcons[entityType];

  const getEntityLabel = (type: EntityType): string => {
    switch (type) {
      case "contact":
        return "Contacts";
      case "company":
        return "Companies";
      case "deal":
        return "Deals";
      default:
        return "Items";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between py-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 p-0 h-auto font-medium text-sm hover:bg-transparent"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Filter className="h-4 w-4" />
              <span>Smart Lists</span>
            </Button>
          </CollapsibleTrigger>
          {onCreateNew && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onCreateNew();
              }}
              title="Create new smart list"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-1">
          {isLoading ? (
            <div className="space-y-2 pl-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : smartLists && smartLists.length > 0 ? (
            <div className="space-y-1 pl-2">
              {smartLists.map((list) => (
                <SmartListItem
                  key={list._id}
                  id={list._id}
                  name={list.name}
                  count={list.cachedCount ?? 0}
                  isSelected={selectedListId === list._id}
                  entityType={entityType}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          ) : (
            <div className="pl-6 py-3 text-sm text-muted-foreground">
              <p className="mb-2">No smart lists yet</p>
              {onCreateNew && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateNew}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first list
                </Button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface SmartListItemProps {
  id: string;
  name: string;
  count: number;
  isSelected: boolean;
  entityType: EntityType;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
}

function SmartListItem({
  id,
  name,
  count,
  isSelected,
  entityType,
  onEdit,
  onDuplicate,
  onDelete,
  onRefresh,
}: SmartListItemProps) {
  const getHref = () => {
    switch (entityType) {
      case "contact":
        return `/contacts?smartList=${id}`;
      case "company":
        return `/companies?smartList=${id}`;
      case "deal":
        return `/deals?smartList=${id}`;
      default:
        return "#";
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      )}
    >
      <Link
        href={getHref()}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{name}</span>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
          {count}
        </Badge>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onRefresh && (
            <DropdownMenuItem onClick={() => onRefresh(id)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh count
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(id)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SmartListSidebar;
