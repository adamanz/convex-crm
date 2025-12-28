"use client";

import {
  BookOpen,
  Users,
  Building2,
  Handshake,
  MessageSquare,
  Settings,
  Zap,
  BarChart3,
  ChevronRight,
  HelpCircle,
  Mail,
  Calendar,
  Tag,
  FileText,
  Workflow,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Users,
  Building2,
  Handshake,
  MessageSquare,
  Settings,
  Zap,
  BarChart3,
  HelpCircle,
  Mail,
  Calendar,
  Tag,
  FileText,
  Workflow,
  Shield,
};

interface Category {
  _id: Id<"helpCategories">;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  articleCount: number;
}

interface CategoryNavProps {
  categories: Category[];
  selectedId?: Id<"helpCategories">;
  onSelect: (categoryId: Id<"helpCategories">) => void;
  layout?: "grid" | "list";
  className?: string;
}

export function CategoryNav({
  categories,
  selectedId,
  onSelect,
  layout = "grid",
  className,
}: CategoryNavProps) {
  if (categories.length === 0) {
    return (
      <div className={cn("rounded-lg border p-4 text-center", className)}>
        <p className="text-sm text-muted-foreground">No categories available</p>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className={cn("space-y-1", className)}>
        {categories.map((category) => {
          const IconComponent = category.icon
            ? iconMap[category.icon] || BookOpen
            : BookOpen;

          return (
            <button
              key={category._id}
              onClick={() => onSelect(category._id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                "hover:bg-muted",
                selectedId === category._id && "bg-muted"
              )}
            >
              <IconComponent className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                {category.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {category.articleCount}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {categories.map((category) => {
        const IconComponent = category.icon
          ? iconMap[category.icon] || BookOpen
          : BookOpen;

        return (
          <button
            key={category._id}
            onClick={() => onSelect(category._id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              selectedId === category._id && "border-primary bg-muted/50"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.articleCount} article{category.articleCount !== 1 ? "s" : ""}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
