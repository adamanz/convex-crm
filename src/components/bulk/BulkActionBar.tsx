"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Pencil,
  Trash2,
  UserPlus,
  Tag,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelection } from "./SelectionProvider";
import { BulkEditDialog } from "./BulkEditDialog";
import { BulkDeleteConfirm } from "./BulkDeleteConfirm";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  className?: string;
}

export function BulkActionBar({ className }: BulkActionBarProps) {
  const { selectedItems, selectionCount, deselectAll, entityType } = useSelection();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState<"fields" | "owner" | "tags">("fields");

  if (selectionCount === 0) {
    return null;
  }

  const entityLabel = entityType === "contacts"
    ? selectionCount === 1 ? "contact" : "contacts"
    : entityType === "deals"
    ? selectionCount === 1 ? "deal" : "deals"
    : selectionCount === 1 ? "company" : "companies";

  const handleEdit = () => {
    setEditMode("fields");
    setShowEditDialog(true);
  };

  const handleAssignOwner = () => {
    setEditMode("owner");
    setShowEditDialog(true);
  };

  const handleAddTags = () => {
    setEditMode("tags");
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const selectedIds = selectedItems.map((item) => item.id);

  return (
    <>
      <AnimatePresence>
        {selectionCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
              className
            )}
          >
            <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-3">
              {/* Selection count */}
              <div className="flex items-center gap-2 pr-4 border-r">
                <span className="text-sm font-medium">
                  {selectionCount} {entityLabel} selected
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={deselectAll}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear selection</span>
                </Button>
              </div>

              {/* Primary actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAssignOwner}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTags}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Tag
                </Button>

                {/* More actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Bulk Edit Fields
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAssignOwner}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddTags}>
                      <Tag className="mr-2 h-4 w-4" />
                      Add Tags
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <BulkEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        entityType={entityType ?? "contacts"}
        selectedIds={selectedIds}
        mode={editMode}
      />

      <BulkDeleteConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        entityType={entityType ?? "contacts"}
        selectedIds={selectedIds}
      />
    </>
  );
}

// Simplified version without framer-motion animations
export function BulkActionBarSimple({ className }: BulkActionBarProps) {
  const { selectedItems, selectionCount, deselectAll, entityType } = useSelection();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState<"fields" | "owner" | "tags">("fields");

  if (selectionCount === 0) {
    return null;
  }

  const entityLabel = entityType === "contacts"
    ? selectionCount === 1 ? "contact" : "contacts"
    : entityType === "deals"
    ? selectionCount === 1 ? "deal" : "deals"
    : selectionCount === 1 ? "company" : "companies";

  const handleEdit = () => {
    setEditMode("fields");
    setShowEditDialog(true);
  };

  const handleAssignOwner = () => {
    setEditMode("owner");
    setShowEditDialog(true);
  };

  const handleAddTags = () => {
    setEditMode("tags");
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const selectedIds = selectedItems.map((item) => item.id);

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200",
          selectionCount > 0 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          className
        )}
      >
        <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-3">
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-4 border-r">
            <span className="text-sm font-medium">
              {selectionCount} {entityLabel} selected
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={deselectAll}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
            </Button>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAssignOwner}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTags}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Tag
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BulkEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        entityType={entityType ?? "contacts"}
        selectedIds={selectedIds}
        mode={editMode}
      />

      <BulkDeleteConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        entityType={entityType ?? "contacts"}
        selectedIds={selectedIds}
      />
    </>
  );
}

export default BulkActionBar;
