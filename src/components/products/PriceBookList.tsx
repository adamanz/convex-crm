"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Book,
  Star,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceBookForm } from "./PriceBookForm";
import { cn } from "@/lib/utils";

interface PriceBookListProps {
  className?: string;
}

export function PriceBookList({ className }: PriceBookListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [editingPriceBook, setEditingPriceBook] = React.useState<Id<"priceBooks"> | null>(null);
  const [expandedPriceBook, setExpandedPriceBook] = React.useState<Id<"priceBooks"> | null>(null);

  const priceBooks = useQuery(api.products.listPriceBooks, {});
  const deletePriceBook = useMutation(api.products.deletePriceBook);

  const handleDelete = async (id: Id<"priceBooks">, isDefault: boolean) => {
    if (isDefault) {
      alert("Cannot delete the default price book. Set another price book as default first.");
      return;
    }
    if (confirm("Are you sure you want to delete this price book? All pricing entries will be removed.")) {
      try {
        await deletePriceBook({ id });
      } catch (error) {
        console.error("Failed to delete price book:", error);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Price Books
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage pricing tiers for different customer segments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Price Book
        </Button>
      </div>

      {/* Price Books List */}
      <div className="space-y-3">
        {priceBooks === undefined ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
            </Card>
          ))
        ) : priceBooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
              <h3 className="mt-4 font-medium text-zinc-900 dark:text-zinc-50">
                No price books yet
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create your first price book to set custom pricing
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Price Book
              </Button>
            </CardContent>
          </Card>
        ) : (
          priceBooks.map((priceBook) => (
            <PriceBookCard
              key={priceBook._id}
              priceBook={priceBook}
              isExpanded={expandedPriceBook === priceBook._id}
              onToggle={() =>
                setExpandedPriceBook(
                  expandedPriceBook === priceBook._id ? null : priceBook._id
                )
              }
              onEdit={() => setEditingPriceBook(priceBook._id)}
              onDelete={() => handleDelete(priceBook._id, priceBook.isDefault)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Price Book</DialogTitle>
          </DialogHeader>
          <PriceBookForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPriceBook} onOpenChange={() => setEditingPriceBook(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Price Book</DialogTitle>
          </DialogHeader>
          {editingPriceBook && (
            <PriceBookForm
              priceBookId={editingPriceBook}
              onSuccess={() => setEditingPriceBook(null)}
              onCancel={() => setEditingPriceBook(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PriceBookCardProps {
  priceBook: {
    _id: Id<"priceBooks">;
    name: string;
    description?: string;
    isDefault: boolean;
    isActive: boolean;
    currency: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PriceBookCard({
  priceBook,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: PriceBookCardProps) {
  const entries = useQuery(
    api.products.getPriceBookEntries,
    isExpanded ? { priceBookId: priceBook._id } : "skip"
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  priceBook.isDefault
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                {priceBook.isDefault ? (
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Book className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{priceBook.name}</CardTitle>
                  {priceBook.isDefault && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    >
                      Default
                    </Badge>
                  )}
                  <Badge
                    variant={priceBook.isActive ? "default" : "secondary"}
                    className={cn(
                      priceBook.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {priceBook.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {priceBook.description && (
                  <CardDescription className="mt-0.5">
                    {priceBook.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400"
                    onClick={onDelete}
                    disabled={priceBook.isDefault}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {entries === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Package className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500">
                  No products in this price book
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 px-3 text-xs font-medium text-zinc-500 uppercase">
                  <div className="col-span-2">Product</div>
                  <div className="text-right">List Price</div>
                  <div className="text-right">Discounted</div>
                </div>
                {entries.map((entry) => (
                  <div
                    key={entry._id}
                    className="grid grid-cols-4 gap-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-zinc-400" />
                      <span className="font-medium">
                        {entry.product?.name || "Unknown Product"}
                      </span>
                    </div>
                    <div className="text-right">
                      {formatCurrency(entry.listPrice, priceBook.currency)}
                    </div>
                    <div className="text-right">
                      {entry.discountedPrice ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(entry.discountedPrice, priceBook.currency)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default PriceBookList;
