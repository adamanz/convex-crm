"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Filter,
  MoreHorizontal,
  Users,
  Building2,
  Handshake,
  RefreshCw,
  Copy,
  Trash2,
  Pencil,
  Globe,
  Lock,
  Clock,
  Loader2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type EntityType = "contact" | "company" | "deal";

interface SmartListCardProps {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  filterCount: number;
  cachedCount: number;
  isPublic: boolean;
  lastRefreshedAt?: number;
  createdAt: number;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SmartListCard({
  id,
  name,
  description,
  entityType,
  filterCount,
  cachedCount,
  isPublic,
  lastRefreshedAt,
  createdAt,
  onEdit,
  onView,
  className,
}: SmartListCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshCount = useMutation(api.smartLists.refreshCount);
  const duplicateSmartList = useMutation(api.smartLists.duplicateSmartList);
  const deleteSmartList = useMutation(api.smartLists.deleteSmartList);

  const getEntityIcon = () => {
    switch (entityType) {
      case "contact":
        return Users;
      case "company":
        return Building2;
      case "deal":
        return Handshake;
      default:
        return Filter;
    }
  };

  const getEntityLabel = () => {
    switch (entityType) {
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

  const EntityIcon = getEntityIcon();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCount({ id: id as Id<"smartLists"> });
      toast.success("Count refreshed");
    } catch (error) {
      console.error("Error refreshing count:", error);
      toast.error("Failed to refresh count");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateSmartList({ id: id as Id<"smartLists"> });
      toast.success("Smart list duplicated");
    } catch (error) {
      console.error("Error duplicating smart list:", error);
      toast.error("Failed to duplicate smart list");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSmartList({ id: id as Id<"smartLists"> });
      toast.success("Smart list deleted");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting smart list:", error);
      toast.error("Failed to delete smart list");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group hover:shadow-md transition-shadow cursor-pointer",
          className
        )}
        onClick={() => onView?.(id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <EntityIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{name}</CardTitle>
                <CardDescription className="text-xs">
                  {getEntityLabel()}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 mr-2",
                      isRefreshing && "animate-spin"
                    )}
                  />
                  Refresh count
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(id);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate();
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="font-semibold">
                {cachedCount}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {cachedCount === 1 ? "result" : "results"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              {filterCount} {filterCount === 1 ? "filter" : "filters"}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 pb-3">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </>
              )}
            </div>

            {lastRefreshedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated {formatRelativeTime(lastRefreshedAt)}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Smart List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SmartListCard;
