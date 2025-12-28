"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Users, Building2, DollarSign, ChevronRight, Loader2 } from "lucide-react";

export type SearchResult = {
  id: string;
  name: string;
  type: "contact" | "company" | "deal";
  subtitle?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, string | number | undefined>;
};

interface SearchResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SearchResult[];
  isLoading?: boolean;
  title?: string;
}

export function SearchResultsModal({
  open,
  onOpenChange,
  results,
  isLoading = false,
  title = "Search Results",
}: SearchResultsModalProps) {
  const router = useRouter();

  const handleNavigate = (result: SearchResult) => {
    const paths: Record<string, string> = {
      contact: `/contacts/${result.id}`,
      company: `/companies/${result.id}`,
      deal: `/deals/${result.id}`,
    };

    const path = paths[result.type];
    if (path) {
      onOpenChange(false);
      router.push(path);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <Users className="h-5 w-5" />;
      case "company":
        return <Building2 className="h-5 w-5" />;
      case "deal":
        return <DollarSign className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contact":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "company":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "deal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isLoading ? "Loading results..." : `Found ${results.length} result${results.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p>No results found</p>
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleNavigate(result)}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900 truncate dark:text-zinc-100">
                      {result.name}
                    </span>
                    <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 capitalize ${getTypeColor(result.type)}`}>
                      {result.type}
                    </Badge>
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-zinc-500 truncate dark:text-zinc-400">
                      {result.subtitle}
                    </p>
                  )}
                  {result.metadata && (
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 space-y-0.5">
                      {Object.entries(result.metadata)
                        .filter(([, value]) => value !== undefined)
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="capitalize">{key}:</span> {value}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              </button>
            ))
          )}
        </div>

        {results.length > 0 && (
          <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
