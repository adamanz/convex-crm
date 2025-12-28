"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpSearch } from "./HelpSearch";
import { CategoryNav } from "./CategoryNav";
import { ArticleList } from "./ArticleList";
import { ArticleView } from "./ArticleView";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PanelView = "home" | "category" | "article" | "search";

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  const [view, setView] = useState<PanelView>("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"helpCategories"> | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const popularArticles = useQuery(api.help.getPopularArticles, { limit: 5 });
  const categories = useQuery(api.help.getCategoriesWithArticleCount);

  // Reset view when panel closes
  useEffect(() => {
    if (!open) {
      setView("home");
      setSelectedCategoryId(null);
      setSelectedArticleSlug(null);
      setSearchQuery("");
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  const handleCategorySelect = (categoryId: Id<"helpCategories">) => {
    setSelectedCategoryId(categoryId);
    setView("category");
  };

  const handleArticleSelect = (slug: string) => {
    setSelectedArticleSlug(slug);
    setView("article");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setView("search");
    } else {
      setView("home");
    }
  };

  const handleBack = () => {
    if (view === "article") {
      if (selectedCategoryId) {
        setView("category");
      } else if (searchQuery) {
        setView("search");
      } else {
        setView("home");
      }
      setSelectedArticleSlug(null);
    } else if (view === "category") {
      setView("home");
      setSelectedCategoryId(null);
    } else if (view === "search") {
      setView("home");
      setSearchQuery("");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md",
          "bg-background shadow-xl",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            {view !== "home" && (
              <button
                onClick={handleBack}
                className="rounded-lg p-1.5 hover:bg-muted"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {view === "home" && "Help Center"}
              {view === "category" && "Articles"}
              {view === "article" && "Article"}
              {view === "search" && "Search Results"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/help"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Open full help center"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 hover:bg-muted"
              aria-label="Close help panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          {/* Search */}
          <div className="p-4">
            <HelpSearch
              value={searchQuery}
              onChange={handleSearch}
              onSelect={handleArticleSelect}
            />
          </div>

          {/* Home View */}
          {view === "home" && (
            <div className="space-y-6 px-4 pb-6">
              {/* Categories */}
              {categories && categories.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Browse by Category
                  </h3>
                  <CategoryNav
                    categories={categories}
                    onSelect={handleCategorySelect}
                  />
                </div>
              )}

              {/* Popular Articles */}
              {popularArticles && popularArticles.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    Popular Articles
                  </h3>
                  <ArticleList
                    articles={popularArticles}
                    onSelect={handleArticleSelect}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {/* Category View */}
          {view === "category" && selectedCategoryId && (
            <div className="px-4 pb-6">
              <ArticleList
                categoryId={selectedCategoryId}
                onSelect={handleArticleSelect}
              />
            </div>
          )}

          {/* Article View */}
          {view === "article" && selectedArticleSlug && (
            <div className="px-4 pb-6">
              <ArticleView
                slug={selectedArticleSlug}
                onRelatedSelect={handleArticleSelect}
              />
            </div>
          )}

          {/* Search View */}
          {view === "search" && searchQuery && (
            <div className="px-4 pb-6">
              <ArticleList
                searchQuery={searchQuery}
                onSelect={handleArticleSelect}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
