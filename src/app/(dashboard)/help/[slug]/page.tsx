"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleView } from "@/components/help/ArticleView";
import { ArticleList } from "@/components/help/ArticleList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Home,
  Clock,
  Eye,
  Tag,
} from "lucide-react";
import Link from "next/link";

// Simple markdown renderer (same as ArticleView)
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
    month: "long",
    day: "numeric",
  });
}

export default function HelpArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

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

  const isLoading = article === undefined;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-16" />
          <ChevronRight className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <ChevronRight className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Article Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-6">
              <Link href="/help">Browse Help Center</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/help" className="flex items-center gap-1 hover:text-foreground">
          <Home className="h-4 w-4" />
          Help Center
        </Link>
        <ChevronRight className="h-4 w-4" />
        {article.category && (
          <>
            <Link
              href={`/help?category=${article.category._id}`}
              className="hover:text-foreground"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="truncate text-foreground">{article.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Main Content */}
        <article className="lg:col-span-3">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.category && (
                <Badge variant="secondary">{article.category.name}</Badge>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated {formatDate(article.updatedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount} views
              </span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />

          {/* Related Articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <section className="mt-12 border-t pt-8">
              <h2 className="mb-4 text-lg font-semibold">Related Articles</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related._id}
                    href={`/help/${related.slug}`}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <h3 className="font-medium">{related.title}</h3>
                    {related.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {related.excerpt}
                      </p>
                    )}
                    {related.category && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {related.category.name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Quick Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2 text-sm">
                <Link
                  href="/help"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-4 w-4" />
                  Back to Help Center
                </Link>
                {article.category && (
                  <Link
                    href={`/help?category=${article.category._id}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="h-4 w-4" />
                    More in {article.category.name}
                  </Link>
                )}
              </nav>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardContent className="py-6 text-center">
              <h3 className="font-semibold">Still need help?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Contact our support team for assistance.
              </p>
              <a
                href="mailto:support@example.com"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Contact Support
              </a>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
