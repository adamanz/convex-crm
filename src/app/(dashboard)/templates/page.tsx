"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ListPageLayout, ListItem, ListEmptyState } from "@/components/shared/list-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Tag,
  Filter,
  Clock,
  Code,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

type FilterType = "all" | "recent" | "most-used";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<Id<"emailTemplates"> | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [editTemplate, setEditTemplate] = useState<any>(null);

  // Fetch templates and categories
  const templates = useQuery(api.email.listTemplates, {
    includeInactive: false,
  });
  const categories = useQuery(api.email.getTemplateCategories);

  // Mutations
  const createTemplate = useMutation(api.email.createTemplate);
  const updateTemplate = useMutation(api.email.updateTemplate);
  const deleteTemplate = useMutation(api.email.deleteTemplate);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Sort by filter type
    if (activeFilter === "recent") {
      filtered.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    } else if (activeFilter === "most-used") {
      filtered.sort((a, b) => b.usageCount - a.usageCount);
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  }, [templates, searchQuery, selectedCategory, activeFilter]);

  // Handlers
  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = async (template: any) => {
    try {
      await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        subject: template.subject,
        body: template.body,
        bodyHtml: template.bodyHtml,
        category: template.category,
        tags: template.tags,
        variables: template.variables,
      });
      toast.success("Template duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;
    try {
      await deleteTemplate({ id: deleteTemplateId });
      toast.success("Template deleted successfully");
      setDeleteTemplateId(null);
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const filters = [
    { id: "all" as const, label: "All Templates", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "recent" as const, label: "Recently Used", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "most-used" as const, label: "Most Used", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      <ListPageLayout
        title="Email Templates"
        description="Create and manage reusable email templates"
        icon={<Mail className="h-4 w-4 text-zinc-500" />}
        searchPlaceholder="Search templates..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={(id) => setActiveFilter(id as FilterType)}
        primaryAction={{
          label: "Create Template",
          onClick: () => setIsCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4 mr-1" />,
        }}
        sidebar={
          <div className="p-4">
            <CategorySidebar
              categories={categories ?? []}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              templates={templates ?? []}
            />
          </div>
        }
        activeFilterBadge={
          selectedCategory
            ? {
                label: selectedCategory,
                count: filteredTemplates.length,
                onClear: () => setSelectedCategory(null),
              }
            : undefined
        }
        isLoading={templates === undefined}
        isEmpty={filteredTemplates.length === 0}
        emptyState={
          <ListEmptyState
            icon={<Mail className="h-7 w-7 text-zinc-400" />}
            title="No templates yet"
            description="Create your first email template to save time when sending messages."
            searchQuery={searchQuery}
            action={
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create your first template
              </Button>
            }
          />
        }
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {filteredTemplates.map((template) => (
            <TemplateRow
              key={template._id}
              template={template}
              onPreview={() => handlePreview(template)}
              onEdit={() => handleEdit(template)}
              onDuplicate={() => handleDuplicate(template)}
              onDelete={() => setDeleteTemplateId(template._id)}
            />
          ))}
        </div>
      </ListPageLayout>

      {/* Create Template Dialog */}
      <TemplateFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        categories={categories ?? []}
      />

      {/* Edit Template Dialog */}
      {editTemplate && (
        <TemplateFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          template={editTemplate}
          categories={categories ?? []}
        />
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <TemplatePreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
          template={previewTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Template Row Component
interface TemplateRowProps {
  template: {
    _id: Id<"emailTemplates">;
    name: string;
    description?: string;
    subject: string;
    category?: string;
    tags?: string[];
    usageCount: number;
    lastUsedAt?: number;
    createdAt: number;
    variables?: Array<{ name: string; defaultValue?: string; description?: string }>;
  };
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function TemplateRow({ template, onPreview, onEdit, onDuplicate, onDelete }: TemplateRowProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <Mail className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {template.name}
          </button>
          {template.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {template.category}
            </Badge>
          )}
          {template.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {(template.tags?.length ?? 0) > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{(template.tags?.length ?? 0) - 2}
            </Badge>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-zinc-500">
          <span className="truncate">{template.subject}</span>
          {template.variables && template.variables.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                {template.variables.length} variable{template.variables.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="hidden items-center gap-5 text-[12px] text-zinc-500 md:flex">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          <span>{template.usageCount} use{template.usageCount !== 1 ? "s" : ""}</span>
        </div>
        {template.lastUsedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{formatRelativeTime(template.lastUsedAt)}</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Category Sidebar Component
interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  templates: Array<{ category?: string }>;
}

function CategorySidebar({ categories, selectedCategory, onCategorySelect, templates }: CategorySidebarProps) {
  const categoryCount = (category: string) => {
    return templates.filter((t) => t.category === category).length;
  };

  const uncategorizedCount = templates.filter((t) => !t.category).length;

  return (
    <div className="space-y-1">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Categories</h3>

      <Button
        variant={selectedCategory === null ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onCategorySelect(null)}
        className="w-full justify-start text-[13px] font-normal"
      >
        <Filter className="h-3.5 w-3.5 mr-2" />
        All Templates
        <span className="ml-auto text-[11px] text-zinc-500">{templates.length}</span>
      </Button>

      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onCategorySelect(category)}
          className="w-full justify-start text-[13px] font-normal"
        >
          <Tag className="h-3.5 w-3.5 mr-2" />
          {category}
          <span className="ml-auto text-[11px] text-zinc-500">{categoryCount(category)}</span>
        </Button>
      ))}

      {uncategorizedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {}}
          className="w-full justify-start text-[13px] font-normal text-zinc-400"
        >
          <Tag className="h-3.5 w-3.5 mr-2" />
          Uncategorized
          <span className="ml-auto text-[11px]">{uncategorizedCount}</span>
        </Button>
      )}
    </div>
  );
}

// Template Form Dialog
interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  categories: string[];
}

function TemplateFormDialog({ open, onOpenChange, template, categories }: TemplateFormDialogProps) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [tags, setTags] = useState(template?.tags?.join(", ") ?? "");
  const [variables, setVariables] = useState<string>(
    template?.variables?.map((v: any) => v.name).join(", ") ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTemplate = useMutation(api.email.createTemplate);
  const updateTemplate = useMutation(api.email.updateTemplate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const variablesList = variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          defaultValue: "",
          description: "",
        }));

      const tagsList = tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      if (template) {
        await updateTemplate({
          id: template._id,
          name,
          description: description || undefined,
          subject,
          body,
          category: category || undefined,
          tags: tagsList.length > 0 ? tagsList : undefined,
          variables: variablesList.length > 0 ? variablesList : undefined,
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate({
          name,
          description: description || undefined,
          subject,
          body,
          category: category || undefined,
          tags: tagsList.length > 0 ? tagsList : undefined,
          variables: variablesList.length > 0 ? variablesList : undefined,
        });
        toast.success("Template created successfully");
      }

      onOpenChange(false);
      // Reset form
      setName("");
      setDescription("");
      setSubject("");
      setBody("");
      setCategory("");
      setTags("");
      setVariables("");
    } catch (error) {
      toast.error(`Failed to ${template ? "update" : "create"} template`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create New Template"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Update your email template details."
              : "Create a reusable email template with variables and placeholders."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Sales, Support"
                list="categories"
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., onboarding, follow-up"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to {{company_name}}"
              required
            />
            <p className="text-xs text-zinc-500">
              Use double curly braces for variables: {"{{"} variable_name {"}}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{first_name}},&#10;&#10;Welcome to our platform!&#10;&#10;Best regards,&#10;{{sender_name}}"
              rows={12}
              required
              className="font-mono text-[13px]"
            />
            <p className="text-xs text-zinc-500">
              Use double curly braces for variables: {"{{"} first_name {"}}"}, {"{{"} company_name {"}}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variables">Variables (comma separated)</Label>
            <Input
              id="variables"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder="e.g., first_name, company_name, sender_name"
            />
            <p className="text-xs text-zinc-500">
              These will be available when using the template. Common variables: first_name, last_name,
              company_name, email, phone
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Available Variables
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {"{{"} first_name {"}}"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {"{{"} last_name {"}}"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {"{{"} company_name {"}}"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {"{{"} email {"}}"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {"{{"} phone {"}}"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {"{{"} sender_name {"}}"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Template Preview Dialog
interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    name: string;
    description?: string;
    subject: string;
    body: string;
    category?: string;
    tags?: string[];
    variables?: Array<{ name: string; defaultValue?: string; description?: string }>;
    usageCount: number;
    createdAt: number;
    lastUsedAt?: number;
  };
}

function TemplatePreviewDialog({ open, onOpenChange, template }: TemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          {template.description && (
            <DialogDescription>{template.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {template.category && (
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {template.category}
              </Badge>
            )}
            {template.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline">
              <MessageSquare className="h-3 w-3 mr-1" />
              {template.usageCount} use{template.usageCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          <Separator />

          {/* Subject */}
          <div>
            <Label className="text-xs text-zinc-500">Subject</Label>
            <p className="mt-1 text-sm font-medium">{template.subject}</p>
          </div>

          {/* Body */}
          <div>
            <Label className="text-xs text-zinc-500">Body</Label>
            <div className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-900 dark:text-zinc-100">
                {template.body}
              </pre>
            </div>
          </div>

          {/* Variables */}
          {template.variables && template.variables.length > 0 && (
            <div>
              <Label className="text-xs text-zinc-500">Variables</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <Badge key={variable.name} variant="secondary" className="font-mono text-xs">
                    {"{{"} {variable.name} {"}}"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div>
              Created: {new Date(template.createdAt).toLocaleDateString()}
            </div>
            {template.lastUsedAt && (
              <div>
                Last used: {formatRelativeTime(template.lastUsedAt)}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
