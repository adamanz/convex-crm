"use client";

import * as React from "react";
import { FileText, Check, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  tags?: string[];
  usageCount?: number;
}

export interface EmailTemplatesProps {
  /** Available templates */
  templates: EmailTemplate[];
  /** Currently selected template ID */
  selectedId?: string;
  /** Callback when a template is selected */
  onSelect?: (template: EmailTemplate) => void;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Additional class name */
  className?: string;
}

export function EmailTemplates({
  templates,
  selectedId,
  onSelect,
  showSearch = true,
  className,
}: EmailTemplatesProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTemplates = React.useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    const groups = new Map<string, EmailTemplate[]>();
    const uncategorized: EmailTemplate[] = [];

    filteredTemplates.forEach((template) => {
      if (template.category) {
        const group = groups.get(template.category) || [];
        group.push(template);
        groups.set(template.category, group);
      } else {
        uncategorized.push(template);
      }
    });

    return { groups, uncategorized };
  }, [filteredTemplates]);

  if (templates.length === 0) {
    return (
      <EmptyState
        variant="documents"
        title="No templates yet"
        description="Create your first email template to speed up your communications."
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
      )}

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        {filteredTemplates.length === 0 ? (
          <EmptyState
            variant="search"
            title="No templates found"
            description="Try adjusting your search query."
          />
        ) : (
          <div className="space-y-6">
            {/* Uncategorized templates */}
            {groupedTemplates.uncategorized.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupedTemplates.uncategorized.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedId === template.id}
                    onSelect={() => onSelect?.(template)}
                  />
                ))}
              </div>
            )}

            {/* Grouped templates */}
            {Array.from(groupedTemplates.groups.entries()).map(
              ([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoryTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedId === template.id}
                        onSelect={() => onSelect?.(template)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: EmailTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isSelected ? (
              <Check className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{template.name}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {template.subject}
            </p>

            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {template.usageCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                Used {template.usageCount} times
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailTemplates;
