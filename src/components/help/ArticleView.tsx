"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Clock, Eye, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ArticleViewProps {
  slug: string;
  onRelatedSelect?: (slug: string) => void;
  className?: string;
}

// Simple markdown renderer
function renderMarkdown(content: string): string {
  let html = content;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li.*<\/li>\n)+/gim, '<ul class="list-disc my-4 space-y-1">$&</ul>');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4">$1</li>');

  // Blockquotes
  html = html.replace(/^>\s+(.*$)/gim, '<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic my-4 text-muted-foreground">$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-6 border-t border-border" />');

  // Paragraphs
  html = html.replace(/^(?!<[a-z])(.*[^\n])$/gim, '<p class="my-3 leading-relaxed">$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p class="my-3 leading-relaxed"><\/p>/g, '');

  return html;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ArticleView({ slug, onRelatedSelect, className }: ArticleViewProps) {
  const article = useQuery(api.help.getArticleBySlug, { slug });
  const relatedArticles = useQuery(
    api.help.getRelatedArticles,
    article ? { articleId: article._id, limit: 3 } : "skip"
  );
  const incrementView = useMutation(api.help.incrementViewCount);

  // Increment view count on mount
  useEffect(() => {
    if (article) {
      incrementView({ id: article._id }).catch(() => {
        // Silently fail - view count is not critical
      });
    }
  }, [article?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (article === undefined) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={cn("rounded-lg border p-6 text-center", className)}>
        <p className="text-sm text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{article.title}</h1>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {article.category && (
            <span className="flex items-center gap-1">
              <Badge variant="secondary">{article.category.name}</Badge>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Updated {formatDate(article.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {article.viewCount} views
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
      />

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && onRelatedSelect && (
        <div className="border-t pt-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Related Articles
          </h3>
          <div className="space-y-2">
            {relatedArticles.map((related) => (
              <button
                key={related._id}
                onClick={() => onRelatedSelect(related.slug)}
                className="flex w-full items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <span className="flex-1 truncate text-sm font-medium">
                  {related.title}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
