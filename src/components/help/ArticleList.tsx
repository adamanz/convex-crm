"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FileText, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";

interface Article {
  _id: Id<"helpArticles">;
  title: string;
  slug: string;
  excerpt?: string;
  viewCount: number;
  category?: {
    _id: Id<"helpCategories">;
    name: string;
    slug: string;
  } | null;
}

interface ArticleListProps {
  categoryId?: Id<"helpCategories">;
  searchQuery?: string;
  articles?: Article[];
  onSelect: (slug: string) => void;
  compact?: boolean;
  className?: string;
}

export function ArticleList({
  categoryId,
  searchQuery,
  articles: providedArticles,
  onSelect,
  compact = false,
  className,
}: ArticleListProps) {
  // Fetch articles if not provided
  const categoryArticles = useQuery(
    api.help.listArticles,
    categoryId ? { categoryId, publishedOnly: true } : "skip"
  );

  const searchResults = useQuery(
    api.help.searchArticles,
    searchQuery ? { searchTerm: searchQuery } : "skip"
  );

  const articles = providedArticles || (searchQuery ? searchResults : categoryArticles);
  const isLoading = articles === undefined;

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            <Skeleton className="h-5 w-5 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className={cn("rounded-lg border p-6 text-center", className)}>
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {searchQuery
            ? `No articles found for "${searchQuery}"`
            : "No articles in this category yet"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {articles.map((article) => (
        <button
          key={article._id}
          onClick={() => onSelect(article.slug)}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
            "hover:bg-muted/50",
            compact && "py-2"
          )}
        >
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{article.title}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {!compact && article.excerpt && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {article.excerpt}
              </p>
            )}
            <div className="mt-1 flex items-center gap-3">
              {article.category && (
                <span className="text-xs text-muted-foreground">
                  {article.category.name}
                </span>
              )}
              {article.viewCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {article.viewCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
