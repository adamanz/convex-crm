"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, UserPlus, Tag, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "contacts" | "deals" | "companies";
  selectedIds: string[];
  mode: "fields" | "owner" | "tags";
}

export function BulkEditDialog({
  open,
  onOpenChange,
  entityType,
  selectedIds,
  mode,
}: BulkEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const users = useQuery(api.users.list, { includeInactive: false });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement bulk update mutations
      toast.success(`Updated ${selectedIds.length} ${entityType}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const getTitle = () => {
    switch (mode) {
      case "owner":
        return "Assign Owner";
      case "tags":
        return "Add Tags";
      default:
        return "Bulk Edit";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "owner":
        return `Assign an owner to ${selectedIds.length} ${entityType}`;
      case "tags":
        return `Add tags to ${selectedIds.length} ${entityType}`;
      default:
        return `Edit ${selectedIds.length} ${entityType}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "owner" && <UserPlus className="h-5 w-5" />}
            {mode === "tags" && <Tag className="h-5 w-5" />}
            {mode === "fields" && <Pencil className="h-5 w-5" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {mode === "owner" && (
            <div className="grid gap-2">
              <Label htmlFor="owner">Select Owner</Label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "tags" && (
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "fields" && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Bulk field editing coming soon</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply to {selectedIds.length} {entityType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
