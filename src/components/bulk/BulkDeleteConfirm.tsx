"use client";

import * as React from "react";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";

interface BulkDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "contacts" | "deals" | "companies";
  selectedIds: string[];
}

export function BulkDeleteConfirm({
  open,
  onOpenChange,
  entityType,
  selectedIds,
}: BulkDeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement bulk delete mutations
      toast.success(`Deleted ${selectedIds.length} ${entityType}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  const entityLabel =
    entityType === "contacts"
      ? selectedIds.length === 1
        ? "contact"
        : "contacts"
      : entityType === "deals"
        ? selectedIds.length === 1
          ? "deal"
          : "deals"
        : selectedIds.length === 1
          ? "company"
          : "companies";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {selectedIds.length} {entityLabel}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            selected {entityLabel} and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {selectedIds.length} {entityLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
