import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// HELP CATEGORIES - CRUD Operations
// ============================================================================

/**
 * List all active categories ordered by order field
 */
export const listCategories = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { includeInactive = false } = args;

    let categories;
    if (includeInactive) {
      categories = await ctx.db
        .query("helpCategories")
        .withIndex("by_order")
        .collect();
    } else {
      categories = await ctx.db
        .query("helpCategories")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    // Sort by order
    return categories.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get a single category by ID
 */
export const getCategory = query({
  args: {
    id: v.id("helpCategories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a category by slug
 */
export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("helpCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Create a new category
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if slug already exists
    const existingCategory = await ctx.db
      .query("helpCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingCategory) {
      throw new Error("A category with this slug already exists");
    }

    // Get max order if not provided
    let order = args.order;
    if (order === undefined) {
      const categories = await ctx.db.query("helpCategories").collect();
      order = categories.length > 0
        ? Math.max(...categories.map((c) => c.order)) + 1
        : 0;
    }

    const categoryId = await ctx.db.insert("helpCategories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      order,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * Update an existing category
 */
export const updateCategory = mutation({
  args: {
    id: v.id("helpCategories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existingCategory = await ctx.db.get(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }

    // Check if new slug conflicts with existing one
    if (updates.slug && updates.slug !== existingCategory.slug) {
      const conflictingCategory = await ctx.db
        .query("helpCategories")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();

      if (conflictingCategory) {
        throw new Error("A category with this slug already exists");
      }
    }

    const updateData: Partial<Doc<"helpCategories">> = {
      updatedAt: now,
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete a category (only if no articles use it)
 */
export const deleteCategory = mutation({
  args: {
    id: v.id("helpCategories"),
  },
  handler: async (ctx, args) => {
    // Check if category has articles
    const articles = await ctx.db
      .query("helpArticles")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .first();

    if (articles) {
      throw new Error("Cannot delete category with articles. Move or delete articles first.");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// ============================================================================
// HELP ARTICLES - CRUD Operations
// ============================================================================

/**
 * List articles with optional filtering
 */
export const listArticles = query({
  args: {
    categoryId: v.optional(v.id("helpCategories")),
    publishedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { categoryId, publishedOnly = true, limit } = args;

    let articles;

    if (categoryId) {
      articles = await ctx.db
        .query("helpArticles")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .collect();
    } else if (publishedOnly) {
      articles = await ctx.db
        .query("helpArticles")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .collect();
    } else {
      articles = await ctx.db.query("helpArticles").collect();
    }

    // Filter by published status if needed
    if (publishedOnly && categoryId) {
      articles = articles.filter((a) => a.isPublished);
    }

    // Sort by order
    articles = articles.sort((a, b) => a.order - b.order);

    // Apply limit
    if (limit) {
      articles = articles.slice(0, limit);
    }

    // Fetch category info for each article
    const articlesWithCategory = await Promise.all(
      articles.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category,
        };
      })
    );

    return articlesWithCategory;
  },
});

/**
 * Get a single article by ID
 */
export const getArticle = query({
  args: {
    id: v.id("helpArticles"),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) return null;

    const category = await ctx.db.get(article.categoryId);

    return {
      ...article,
      category,
    };
  },
});

/**
 * Get an article by slug
 */
export const getArticleBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("helpArticles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!article) return null;

    const category = await ctx.db.get(article.categoryId);

    return {
      ...article,
      category,
    };
  },
});

/**
 * Create a new article
 */
export const createArticle = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    categoryId: v.id("helpCategories"),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if slug already exists
    const existingArticle = await ctx.db
      .query("helpArticles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingArticle) {
      throw new Error("An article with this slug already exists");
    }

    // Get max order if not provided
    let order = args.order;
    if (order === undefined) {
      const articles = await ctx.db
        .query("helpArticles")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
        .collect();
      order = articles.length > 0
        ? Math.max(...articles.map((a) => a.order)) + 1
        : 0;
    }

    // Generate excerpt from content if not provided
    const excerpt = args.excerpt || args.content.slice(0, 200).replace(/[#*_`]/g, '').trim() + '...';

    const articleId = await ctx.db.insert("helpArticles", {
      title: args.title,
      slug: args.slug,
      content: args.content,
      excerpt,
      categoryId: args.categoryId,
      tags: args.tags ?? [],
      order,
      isPublished: args.isPublished ?? false,
      createdBy: args.createdBy,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return articleId;
  },
});

/**
 * Update an existing article
 */
export const updateArticle = mutation({
  args: {
    id: v.id("helpArticles"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categoryId: v.optional(v.id("helpCategories")),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    const existingArticle = await ctx.db.get(id);
    if (!existingArticle) {
      throw new Error("Article not found");
    }

    // Verify new category exists if changing
    if (updates.categoryId) {
      const category = await ctx.db.get(updates.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    // Check if new slug conflicts
    if (updates.slug && updates.slug !== existingArticle.slug) {
      const conflictingArticle = await ctx.db
        .query("helpArticles")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();

      if (conflictingArticle) {
        throw new Error("An article with this slug already exists");
      }
    }

    const updateData: Partial<Doc<"helpArticles">> = {
      updatedAt: now,
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.isPublished !== undefined) updateData.isPublished = updates.isPublished;

    await ctx.db.patch(id, updateData);

    return id;
  },
});

/**
 * Delete an article
 */
export const deleteArticle = mutation({
  args: {
    id: v.id("helpArticles"),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) {
      throw new Error("Article not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// ============================================================================
// SEARCH & ANALYTICS
// ============================================================================

/**
 * Full-text search for articles
 */
export const searchArticles = query({
  args: {
    searchTerm: v.string(),
    categoryId: v.optional(v.id("helpCategories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchTerm, categoryId, limit = 20 } = args;

    if (!searchTerm.trim()) {
      return [];
    }

    let searchQuery = ctx.db
      .query("helpArticles")
      .withSearchIndex("search_articles", (q) => {
        let search = q.search("title", searchTerm);
        search = search.eq("isPublished", true);
        if (categoryId) {
          search = search.eq("categoryId", categoryId);
        }
        return search;
      });

    const articles = await searchQuery.take(limit);

    // Also search in content for broader matches
    const allPublishedArticles = await ctx.db
      .query("helpArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const contentMatches = allPublishedArticles.filter((article) => {
      const searchLower = searchTerm.toLowerCase();
      const inContent = article.content.toLowerCase().includes(searchLower);
      const inExcerpt = article.excerpt?.toLowerCase().includes(searchLower);
      const inTags = article.tags.some((tag) =>
        tag.toLowerCase().includes(searchLower)
      );

      // Exclude already found articles
      if (articles.some((a) => a._id === article._id)) {
        return false;
      }

      // Filter by category if specified
      if (categoryId && article.categoryId !== categoryId) {
        return false;
      }

      return inContent || inExcerpt || inTags;
    });

    const combinedResults = [...articles, ...contentMatches].slice(0, limit);

    // Fetch category info
    const resultsWithCategory = await Promise.all(
      combinedResults.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category,
        };
      })
    );

    return resultsWithCategory;
  },
});

/**
 * Increment view count for an article
 */
export const incrementViewCount = mutation({
  args: {
    id: v.id("helpArticles"),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) {
      throw new Error("Article not found");
    }

    await ctx.db.patch(args.id, {
      viewCount: article.viewCount + 1,
    });

    return { success: true };
  },
});

/**
 * Get most popular articles by view count
 */
export const getPopularArticles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 5 } = args;

    const articles = await ctx.db
      .query("helpArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    // Sort by view count descending
    const sortedArticles = articles
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);

    // Fetch category info
    const articlesWithCategory = await Promise.all(
      sortedArticles.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category,
        };
      })
    );

    return articlesWithCategory;
  },
});

/**
 * Get related articles based on tags and category
 */
export const getRelatedArticles = query({
  args: {
    articleId: v.id("helpArticles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { articleId, limit = 3 } = args;

    const article = await ctx.db.get(articleId);
    if (!article) {
      return [];
    }

    // Get all published articles except current one
    const allArticles = await ctx.db
      .query("helpArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const otherArticles = allArticles.filter((a) => a._id !== articleId);

    // Score articles based on similarity
    const scoredArticles = otherArticles.map((a) => {
      let score = 0;

      // Same category = +3
      if (a.categoryId === article.categoryId) {
        score += 3;
      }

      // Shared tags
      const sharedTags = a.tags.filter((tag) => article.tags.includes(tag));
      score += sharedTags.length * 2;

      return { article: a, score };
    });

    // Sort by score and take top results
    const topRelated = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((item) => item.score > 0)
      .map((item) => item.article);

    // Fetch category info
    const articlesWithCategory = await Promise.all(
      topRelated.map(async (a) => {
        const category = await ctx.db.get(a.categoryId);
        return {
          ...a,
          category,
        };
      })
    );

    return articlesWithCategory;
  },
});

/**
 * Get articles by tag
 */
export const getArticlesByTag = query({
  args: {
    tag: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tag, limit = 20 } = args;

    const articles = await ctx.db
      .query("helpArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const taggedArticles = articles
      .filter((a) => a.tags.includes(tag))
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);

    // Fetch category info
    const articlesWithCategory = await Promise.all(
      taggedArticles.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category,
        };
      })
    );

    return articlesWithCategory;
  },
});

/**
 * Get all unique tags from published articles
 */
export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("helpArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const tagCounts: Record<string, number> = {};

    articles.forEach((article) => {
      article.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

/**
 * Get category with article count
 */
export const getCategoriesWithArticleCount = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("helpCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const articles = await ctx.db
          .query("helpArticles")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();

        const publishedCount = articles.filter((a) => a.isPublished).length;

        return {
          ...category,
          articleCount: publishedCount,
        };
      })
    );

    return categoriesWithCount.sort((a, b) => a.order - b.order);
  },
});
