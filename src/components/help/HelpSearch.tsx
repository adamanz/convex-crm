"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface HelpSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (slug: string) => void;
  placeholder?: string;
  className?: string;
  showDropdown?: boolean;
}

export function HelpSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search help articles...",
  className,
  showDropdown = true,
}: HelpSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Search articles
  const searchResults = useQuery(
    api.help.searchArticles,
    debouncedValue.trim().length >= 2
      ? { searchTerm: debouncedValue, limit: 5 }
      : "skip"
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (showDropdown && newValue.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    onSelect(slug);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
    if (e.key === "Enter" && value.trim()) {
      setIsOpen(false);
      onChange(value);
    }
  };

  const isLoading = debouncedValue !== value && value.trim().length >= 2;
  const showResults = showDropdown && isOpen && searchResults && searchResults.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (showDropdown && value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-lg">
          <ul className="py-1">
            {searchResults.map((article) => (
              <li key={article._id}>
                <button
                  onClick={() => handleSelect(article.slug)}
                  className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-muted"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {article.title}
                    </p>
                    {article.category && (
                      <p className="truncate text-xs text-muted-foreground">
                        {article.category.name}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results */}
      {showDropdown &&
        isOpen &&
        debouncedValue.trim().length >= 2 &&
        searchResults &&
        searchResults.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover p-4 text-center shadow-lg">
            <p className="text-sm text-muted-foreground">
              No articles found for &quot;{debouncedValue}&quot;
            </p>
          </div>
        )}
    </div>
  );
}
