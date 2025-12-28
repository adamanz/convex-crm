"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductList, PriceBookList } from "@/components/products";
import { Package, Book } from "lucide-react";

export default function ProductsSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Products & Price Books
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your product catalog and pricing structures
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="price-books" className="gap-2">
            <Book className="h-4 w-4" />
            Price Books
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductList />
        </TabsContent>

        <TabsContent value="price-books" className="space-y-4">
          <PriceBookList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
