import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// PRODUCTS - CRUD Operations
// ============================================================================

// List products with filtering, search, and pagination
export const list = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // If searching, use search index
    if (args.search && args.search.trim().length > 0) {
      let searchQuery = ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => {
          let sq = q.search("name", args.search!);
          if (args.category !== undefined) {
            sq = sq.eq("category", args.category);
          }
          if (args.isActive !== undefined) {
            sq = sq.eq("isActive", args.isActive);
          }
          return sq;
        });

      const products = await searchQuery.take(limit);
      return {
        products,
        nextCursor: null,
      };
    }

    // Otherwise, use regular query with filters
    let products;

    if (args.isActive !== undefined) {
      products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
        .order("desc")
        .take(limit + 1);
    } else if (args.category !== undefined) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(limit + 1);
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_created")
        .order("desc")
        .take(limit + 1);
    }

    // Check if there are more results
    const hasMore = products.length > limit;
    const results = hasMore ? products.slice(0, -1) : products;

    // Filter by additional criteria if needed
    let filtered = results;
    if (args.category !== undefined && args.isActive === undefined) {
      // Already filtered by index
    } else if (args.category !== undefined) {
      filtered = results.filter((p) => p.category === args.category);
    }

    return {
      products: filtered,
      nextCursor: hasMore ? results[results.length - 1]._id : null,
    };
  },
});

// Get a single product by ID
export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get product by SKU
export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
  },
});

// Search products by name or SKU
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchTerm = args.query.toLowerCase();

    // Search by name using search index
    const byName = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q.search("name", args.query).eq("isActive", true)
      )
      .take(limit);

    // Search by SKU
    const bySku = await ctx.db
      .query("products")
      .withIndex("by_sku")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(100);

    const skuMatches = bySku.filter(
      (p) => p.sku && p.sku.toLowerCase().includes(searchTerm)
    );

    // Combine and dedupe results
    const seen = new Set<string>();
    const results: typeof byName = [];

    for (const product of [...byName, ...skuMatches]) {
      if (!seen.has(product._id)) {
        seen.add(product._id);
        results.push(product);
        if (results.length >= limit) break;
      }
    }

    return results;
  },
});

// Get unique categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const categories = new Set<string>();
    for (const product of products) {
      if (product.category) {
        categories.add(product.category);
      }
    }
    return Array.from(categories).sort();
  },
});

// Create a new product
export const create = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    unitPrice: v.number(),
    currency: v.string(),
    taxable: v.boolean(),
    taxRate: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate SKU if provided
    if (args.sku) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", args.sku))
        .first();
      if (existing) {
        throw new Error(`Product with SKU "${args.sku}" already exists`);
      }
    }

    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

// Update a product
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    taxable: v.optional(v.boolean()),
    taxRate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Product not found");
    }

    // Check for duplicate SKU if changing
    if (updates.sku !== undefined && updates.sku !== existing.sku) {
      const duplicate = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", updates.sku))
        .first();
      if (duplicate && duplicate._id !== id) {
        throw new Error(`Product with SKU "${updates.sku}" already exists`);
      }
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a product (soft delete by setting isActive to false)
export const delete_ = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Product not found");
    }

    // Check if product is used in any price book entries
    const priceBookEntries = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .first();

    if (priceBookEntries) {
      // Soft delete - just mark as inactive
      await ctx.db.patch(args.id, {
        isActive: false,
        updatedAt: Date.now(),
      });
      return { deleted: false, deactivated: true };
    }

    // Hard delete if not referenced
    await ctx.db.delete(args.id);
    return { deleted: true, deactivated: false };
  },
});

// ============================================================================
// PRICE BOOKS - CRUD Operations
// ============================================================================

// List all price books
export const listPriceBooks = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const priceBooks =
      args.isActive !== undefined
        ? await ctx.db
            .query("priceBooks")
            .withIndex("by_active", (q) => q.eq("isActive", args.isActive!))
            .collect()
        : await ctx.db.query("priceBooks").collect();
    return priceBooks.sort((a, b) => {
      // Default first, then by name
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Get a single price book by ID
export const getPriceBook = query({
  args: { id: v.id("priceBooks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get the default price book
export const getDefaultPriceBook = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("priceBooks")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();
  },
});

// Create a new price book
export const createPriceBook = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.boolean(),
    isActive: v.boolean(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    // If this is set as default, unset any existing default
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("priceBooks")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    const priceBookId = await ctx.db.insert("priceBooks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return priceBookId;
  },
});

// Update a price book
export const updatePriceBook = mutation({
  args: {
    id: v.id("priceBooks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Price book not found");
    }

    // If setting as default, unset any existing default
    if (updates.isDefault === true && !existing.isDefault) {
      const existingDefault = await ctx.db
        .query("priceBooks")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();
      if (existingDefault && existingDefault._id !== id) {
        await ctx.db.patch(existingDefault._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete a price book
export const deletePriceBook = mutation({
  args: { id: v.id("priceBooks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Price book not found");
    }

    if (existing.isDefault) {
      throw new Error("Cannot delete the default price book");
    }

    // Delete all price book entries first
    const entries = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_price_book", (q) => q.eq("priceBookId", args.id))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    // Delete the price book
    await ctx.db.delete(args.id);

    return { deleted: true, entriesDeleted: entries.length };
  },
});

// ============================================================================
// PRICE BOOK ENTRIES - Product pricing within price books
// ============================================================================

// Get all entries for a price book
export const getPriceBookEntries = query({
  args: {
    priceBookId: v.id("priceBooks"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_price_book", (q) => q.eq("priceBookId", args.priceBookId))
      .collect();

    // Enrich with product data
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const product = await ctx.db.get(entry.productId);
        return {
          ...entry,
          product,
        };
      })
    );

    return enrichedEntries;
  },
});

// Get price for a product in a price book
export const getProductPrice = query({
  args: {
    priceBookId: v.id("priceBooks"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_price_book_product", (q) =>
        q.eq("priceBookId", args.priceBookId).eq("productId", args.productId)
      )
      .first();

    if (!entry) {
      // Return product's default price if no price book entry
      const product = await ctx.db.get(args.productId);
      if (!product) return null;
      return {
        listPrice: product.unitPrice,
        discountedPrice: undefined,
        source: "product" as const,
      };
    }

    // Check if entry is currently valid
    const now = Date.now();
    if (entry.startDate && entry.startDate > now) {
      return null; // Not yet valid
    }
    if (entry.endDate && entry.endDate < now) {
      return null; // Expired
    }

    return {
      listPrice: entry.listPrice,
      discountedPrice: entry.discountedPrice,
      source: "priceBook" as const,
    };
  },
});

// Add a product to a price book
export const addProductToPriceBook = mutation({
  args: {
    priceBookId: v.id("priceBooks"),
    productId: v.id("products"),
    listPrice: v.number(),
    discountedPrice: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify price book exists
    const priceBook = await ctx.db.get(args.priceBookId);
    if (!priceBook) {
      throw new Error("Price book not found");
    }

    // Verify product exists
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check for existing entry
    const existing = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_price_book_product", (q) =>
        q.eq("priceBookId", args.priceBookId).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      throw new Error("Product already exists in this price book");
    }

    const now = Date.now();
    const entryId = await ctx.db.insert("priceBookEntries", {
      priceBookId: args.priceBookId,
      productId: args.productId,
      listPrice: args.listPrice,
      discountedPrice: args.discountedPrice,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

// Update a price book entry
export const updatePriceBookEntry = mutation({
  args: {
    id: v.id("priceBookEntries"),
    listPrice: v.optional(v.number()),
    discountedPrice: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Price book entry not found");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Remove a product from a price book
export const removeProductFromPriceBook = mutation({
  args: {
    priceBookId: v.id("priceBooks"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("priceBookEntries")
      .withIndex("by_price_book_product", (q) =>
        q.eq("priceBookId", args.priceBookId).eq("productId", args.productId)
      )
      .first();

    if (!entry) {
      throw new Error("Price book entry not found");
    }

    await ctx.db.delete(entry._id);
    return { deleted: true };
  },
});

// Bulk add products to a price book
export const bulkAddProductsToPriceBook = mutation({
  args: {
    priceBookId: v.id("priceBooks"),
    entries: v.array(
      v.object({
        productId: v.id("products"),
        listPrice: v.number(),
        discountedPrice: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const priceBook = await ctx.db.get(args.priceBookId);
    if (!priceBook) {
      throw new Error("Price book not found");
    }

    const now = Date.now();
    const results: { productId: Id<"products">; success: boolean; error?: string }[] = [];

    for (const entry of args.entries) {
      try {
        const product = await ctx.db.get(entry.productId);
        if (!product) {
          results.push({
            productId: entry.productId,
            success: false,
            error: "Product not found",
          });
          continue;
        }

        // Check for existing entry
        const existing = await ctx.db
          .query("priceBookEntries")
          .withIndex("by_price_book_product", (q) =>
            q.eq("priceBookId", args.priceBookId).eq("productId", entry.productId)
          )
          .first();

        if (existing) {
          // Update existing entry
          await ctx.db.patch(existing._id, {
            listPrice: entry.listPrice,
            discountedPrice: entry.discountedPrice,
            updatedAt: now,
          });
        } else {
          // Create new entry
          await ctx.db.insert("priceBookEntries", {
            priceBookId: args.priceBookId,
            productId: entry.productId,
            listPrice: entry.listPrice,
            discountedPrice: entry.discountedPrice,
            createdAt: now,
            updatedAt: now,
          });
        }

        results.push({ productId: entry.productId, success: true });
      } catch (error) {
        results.push({
          productId: entry.productId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});
