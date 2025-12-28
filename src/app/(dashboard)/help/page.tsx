"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { HelpSearch } from "@/components/help/HelpSearch";
import { CategoryNav } from "@/components/help/CategoryNav";
import { ArticleList } from "@/components/help/ArticleList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Tag } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"helpCategories"> | null>(null);

  const categories = useQuery(api.help.getCategoriesWithArticleCount);
  const popularArticles = useQuery(api.help.getPopularArticles, { limit: 5 });
  const allTags = useQuery(api.help.getAllTags);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSelectedCategoryId(null);
    }
  };

  const handleCategorySelect = (categoryId: Id<"helpCategories">) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery("");
  };

  const handleArticleSelect = (slug: string) => {
    // Navigate to article page
    window.location.href = `/help/${slug}`;
  };

  const isLoading = categories === undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Help Center"
        description="Find answers to your questions and learn how to use the CRM effectively"
      />

      {/* Search */}
      <div className="mx-auto max-w-2xl">
        <HelpSearch
          value={searchQuery}
          onChange={handleSearch}
          onSelect={handleArticleSelect}
          placeholder="Search for help articles..."
          showDropdown={false}
          className="w-full"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Search Results for &quot;{searchQuery}&quot;
          </h2>
          <ArticleList searchQuery={searchQuery} onSelect={handleArticleSelect} />
        </div>
      )}

      {/* Main Content (hidden when searching) */}
      {!searchQuery && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Categories and Articles */}
          <div className="lg:col-span-2 space-y-8">
            {/* Categories */}
            <div>
              <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Browse by Category
              </h2>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <CategoryNav
                  categories={categories}
                  selectedId={selectedCategoryId ?? undefined}
                  onSelect={handleCategorySelect}
                  layout="grid"
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      No help categories available yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Category Articles */}
            {selectedCategoryId && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {categories?.find((c) => c._id === selectedCategoryId)?.name} Articles
                  </h2>
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear filter
                  </button>
                </div>
                <ArticleList
                  categoryId={selectedCategoryId}
                  onSelect={handleArticleSelect}
                />
              </div>
            )}

            {/* All Articles (when no category selected) */}
            {!selectedCategoryId && categories && categories.length > 0 && (
              <div className="space-y-8">
                {categories.map((category) => (
                  <div key={category._id}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{category.name}</h2>
                      <button
                        onClick={() => handleCategorySelect(category._id)}
                        className="text-sm text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                    <ArticleList
                      categoryId={category._id}
                      onSelect={handleArticleSelect}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Articles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Popular Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popularArticles === undefined ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : popularArticles.length > 0 ? (
                  <div className="space-y-2">
                    {popularArticles.map((article) => (
                      <Link
                        key={article._id}
                        href={`/help/${article.slug}`}
                        className="block rounded-lg p-2 text-sm hover:bg-muted"
                      >
                        <p className="font-medium">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.viewCount} views
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No articles yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allTags === undefined ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>
                ) : allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 10).map(({ tag, count }) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleSearch(tag)}
                      >
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Need More Help */}
            <Card>
              <CardContent className="py-6 text-center">
                <h3 className="font-semibold">Need More Help?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Can&apos;t find what you&apos;re looking for? Contact our support team.
                </p>
                <a
                  href="mailto:support@example.com"
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  Contact Support
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
