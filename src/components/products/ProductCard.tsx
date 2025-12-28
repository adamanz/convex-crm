"use client";

import * as React from "react";
import { Package, Tag, DollarSign, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    unitPrice: number;
    currency: string;
    taxable: boolean;
    taxRate?: number;
    isActive: boolean;
  };
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onClick,
  selected,
  className,
}: ProductCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-blue-500 dark:ring-blue-400",
        !product.isActive && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Package className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <CardTitle className="text-base">{product.name}</CardTitle>
              {product.sku && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  SKU: {product.sku}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant={product.isActive ? "default" : "secondary"}
            className={cn(
              product.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {product.description && (
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          {/* Price */}
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatCurrency(product.unitPrice, product.currency)}
            </span>
          </div>

          {/* Category */}
          {product.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-zinc-400" />
              <Badge variant="secondary" className="font-normal">
                {product.category}
              </Badge>
            </div>
          )}

          {/* Tax */}
          {product.taxable && (
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Percent className="h-4 w-4" />
              <span>
                {product.taxRate ? `${product.taxRate}% tax` : "Taxable"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;
