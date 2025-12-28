"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ListPageLayout, ListEmptyState } from "@/components/shared/list-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Import the TAG_COLORS array from the backend schema
const TAG_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
] as const;

type SortOption = "name" | "usage" | "created";

interface TagFormData {
  name: string;
  color: string;
  description?: string;
}

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{
    _id: Id<"tags">;
    name: string;
    color: string;
    description?: string;
  } | null>(null);
  const [deletingTag, setDeletingTag] = useState<{
    _id: Id<"tags">;
    name: string;
    usageCount: number;
  } | null>(null);

  // Queries
  const tags = useQuery(api.tags.list, { sortBy });
  const searchResults = useQuery(
    api.tags.search,
    searchQuery.trim().length >= 2
      ? { searchTerm: searchQuery.trim(), limit: 50 }
      : "skip"
  );
  const stats = useQuery(api.tags.getStats);

  // Mutations
  const createTag = useMutation(api.tags.create);
  const updateTag = useMutation(api.tags.update);
  const deleteTag = useMutation(api.tags.delete_);
  const recalculateUsageCounts = useMutation(api.tags.recalculateUsageCounts);

  const displayTags = useMemo(() => {
    if (searchQuery.trim().length >= 2 && searchResults) {
      return searchResults;
    }
    return tags ?? [];
  }, [searchQuery, searchResults, tags]);

  const isLoading = tags === undefined;

  const handleCreateTag = async (data: TagFormData) => {
    try {
      await createTag({
        name: data.name,
        color: data.color,
        description: data.description,
      });
      toast.success("Tag created successfully");
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create tag");
    }
  };

  const handleUpdateTag = async (data: TagFormData) => {
    if (!editingTag) return;
    try {
      await updateTag({
        id: editingTag._id,
        name: data.name,
        color: data.color,
        description: data.description,
      });
      toast.success("Tag updated successfully");
      setEditingTag(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update tag");
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    try {
      await deleteTag({ id: deletingTag._id });
      toast.success("Tag deleted successfully");
      setDeletingTag(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tag");
    }
  };

  const handleRecalculateUsage = async () => {
    try {
      await recalculateUsageCounts({});
      toast.success("Usage counts recalculated");
    } catch (error: any) {
      toast.error(error.message || "Failed to recalculate usage counts");
    }
  };

  return (
    <>
      <ListPageLayout
        title="Tags"
        description={
          stats
            ? `${stats.totalTags} tags • ${stats.totalUsage} total uses${
                stats.unusedTags > 0 ? ` • ${stats.unusedTags} unused` : ""
              }`
            : "Manage your tags and labels"
        }
        icon={<Tag className="h-4 w-4 text-zinc-500" />}
        searchPlaceholder="Search tags..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        customFilters={
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="h-8 w-[140px] text-[12px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Most used</SelectItem>
                <SelectItem value="created">Recently added</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRecalculateUsage}
              className="h-8 gap-1.5 text-[12px]"
              title="Recalculate usage counts"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        }
        primaryAction={{
          label: "Create Tag",
          onClick: () => setIsCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4 mr-1" />,
        }}
        isLoading={isLoading}
        isEmpty={displayTags.length === 0}
        emptyState={
          <ListEmptyState
            icon={<Tag className="h-7 w-7 text-zinc-400" />}
            title="No tags yet"
            description="Create tags to organize and categorize your contacts, companies, and deals."
            searchQuery={searchQuery}
            action={
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create your first tag
              </Button>
            }
          />
        }
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {displayTags.map((tag) => (
            <TagRow
              key={tag._id}
              tag={tag}
              onEdit={() =>
                setEditingTag({
                  _id: tag._id,
                  name: tag.name,
                  color: tag.color,
                  description: tag.description,
                })
              }
              onDelete={() =>
                setDeletingTag({
                  _id: tag._id,
                  name: tag.name,
                  usageCount: tag.usageCount,
                })
              }
            />
          ))}
        </div>
      </ListPageLayout>

      {/* Create Tag Dialog */}
      <TagFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateTag}
        title="Create Tag"
        description="Create a new tag to organize your data."
      />

      {/* Edit Tag Dialog */}
      {editingTag && (
        <TagFormDialog
          open={!!editingTag}
          onOpenChange={(open) => !open && setEditingTag(null)}
          onSubmit={handleUpdateTag}
          title="Edit Tag"
          description="Update the tag name, color, or description."
          initialData={editingTag}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTag && deletingTag.usageCount > 0 ? (
                <>
                  Are you sure you want to delete the tag{" "}
                  <span className="font-semibold">{deletingTag.name}</span>? This tag is currently
                  used {deletingTag.usageCount} time{deletingTag.usageCount !== 1 ? "s" : ""}. The
                  tag will remain on existing records but won't be available for new use.
                </>
              ) : (
                <>
                  Are you sure you want to delete the tag{" "}
                  <span className="font-semibold">{deletingTag?.name}</span>? This action cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface TagRowProps {
  tag: {
    _id: Id<"tags">;
    name: string;
    color: string;
    description?: string;
    usageCount: number;
    createdAt: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function TagRow({ tag, onEdit, onDelete }: TagRowProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      {/* Color indicator */}
      <div
        className="h-10 w-10 shrink-0 rounded-lg shadow-sm"
        style={{ backgroundColor: tag.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
            {tag.name}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: `${tag.color}40`,
            }}
          >
            {tag.usageCount} {tag.usageCount === 1 ? "use" : "uses"}
          </Badge>
        </div>

        {tag.description && (
          <p className="mt-0.5 text-[12px] text-zinc-500 truncate">{tag.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Color preview badge */}
        <Badge
          variant="outline"
          className="text-[11px] px-2 py-0.5"
          style={{
            backgroundColor: `${tag.color}10`,
            color: tag.color,
            borderColor: `${tag.color}30`,
          }}
        >
          {tag.color}
        </Badge>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TagFormData) => Promise<void>;
  title: string;
  description: string;
  initialData?: TagFormData;
}

function TagFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  initialData,
}: TagFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [color, setColor] = useState(initialData?.color ?? TAG_COLORS[0]);
  const [customColor, setCustomColor] = useState("");
  const [desc, setDesc] = useState(initialData?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setColor(initialData?.color ?? TAG_COLORS[0]);
      setCustomColor("");
      setDesc(initialData?.description ?? "");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalColor = customColor || color;
      await onSubmit({ name, color: finalColor, description: desc || undefined });
      // Reset form on success
      setName("");
      setColor(TAG_COLORS[0]);
      setCustomColor("");
      setDesc("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedColor = customColor || color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              placeholder="e.g., VIP, Hot Lead, Partner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {TAG_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    setColor(presetColor);
                    setCustomColor("");
                  }}
                  className={cn(
                    "h-10 rounded-md transition-all hover:scale-105",
                    selectedColor === presetColor && "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-50"
                  )}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>

            {/* Custom color picker */}
            <div className="flex items-center gap-2 pt-2">
              <Label htmlFor="custom-color" className="text-[12px] text-zinc-500">
                Custom color:
              </Label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  id="custom-color"
                  type="color"
                  value={customColor || color}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
                />
                <Input
                  placeholder="#000000"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-8 text-[12px] font-mono"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[12px] text-zinc-500">Preview:</span>
              <Badge
                variant="secondary"
                className="text-[11px]"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                  borderColor: `${selectedColor}40`,
                }}
              >
                {name || "Tag name"}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tag-description">Description (optional)</Label>
            <Textarea
              id="tag-description"
              placeholder="Add a description for this tag..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="text-[13px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Saving..." : initialData ? "Update Tag" : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
