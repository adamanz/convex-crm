"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Search,
  Building2,
  User,
  HandshakeIcon,
  Clock,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SearchResultItem,
  type SearchResult,
  type ContactSearchResult,
  type CompanySearchResult,
  type DealSearchResult,
} from "./SearchResult";

// ============================================================================
// Types
// ============================================================================

interface RecentSearch {
  id: string;
  query: string;
  type?: "contact" | "company" | "deal";
  resultId?: string;
  resultLabel?: string;
  timestamp: number;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Local Storage Helper
// ============================================================================

const RECENT_SEARCHES_KEY = "crm-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(search: Omit<RecentSearch, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches();
    const newSearch: RecentSearch = {
      ...search,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
    };

    // Remove duplicates and add new search at the beginning
    const filtered = recent.filter(
      (s) =>
        !(s.query === search.query && s.resultId === search.resultId)
    );
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Custom Hooks
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// GlobalSearch Component
// ============================================================================

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([]);

  // Debounce search to avoid too many queries
  const debouncedSearch = useDebounce(search, 200);

  // Search queries - only run when there's a search term
  const contactResults = useQuery(
    api.contacts.search,
    debouncedSearch.length >= 2
      ? { searchTerm: debouncedSearch, limit: 5 }
      : "skip"
  );

  const companyResults = useQuery(
    api.companies.search,
    debouncedSearch.length >= 2
      ? { searchTerm: debouncedSearch, limit: 5 }
      : "skip"
  );

  const dealResults = useQuery(
    api.deals.search,
    debouncedSearch.length >= 2
      ? { searchTerm: debouncedSearch, limit: 5 }
      : "skip"
  );

  const isSearching = debouncedSearch.length >= 2 && (
    contactResults === undefined ||
    companyResults === undefined ||
    dealResults === undefined
  );

  const hasResults = (
    (contactResults && contactResults.length > 0) ||
    (companyResults && companyResults.length > 0) ||
    (dealResults && dealResults.length > 0)
  );

  // Transform results to SearchResult format
  const contacts: ContactSearchResult[] = React.useMemo(() =>
    (contactResults || []).map((c) => ({
      type: "contact" as const,
      id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      avatarUrl: c.avatarUrl,
      title: c.title,
      company: c.company ? { name: c.company.name } : null,
    })),
    [contactResults]
  );

  const companies: CompanySearchResult[] = React.useMemo(() =>
    (companyResults || []).map((c) => ({
      type: "company" as const,
      id: c._id,
      name: c.name,
      domain: c.domain,
      logoUrl: c.logoUrl,
      industry: c.industry,
      contactCount: c.contactCount,
    })),
    [companyResults]
  );

  const deals: DealSearchResult[] = React.useMemo(() =>
    (dealResults || []).map((d) => ({
      type: "deal" as const,
      id: d._id,
      name: d.name,
      amount: d.amount,
      currency: d.currency,
      status: d.status,
      stageName: d.stageName,
      stageColor: d.stageColor,
      company: d.company ? { name: d.company.name } : null,
    })),
    [dealResults]
  );

  // Load recent searches on mount
  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [open]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = React.useCallback(
    (result: SearchResult) => {
      // Save to recent searches
      addRecentSearch({
        query: search,
        type: result.type,
        resultId: result.id,
        resultLabel:
          result.type === "contact"
            ? [result.firstName, result.lastName].filter(Boolean).join(" ")
            : result.name,
      });

      // Navigate and close
      const paths: Record<string, string> = {
        contact: `/contacts/${result.id}`,
        company: `/companies/${result.id}`,
        deal: `/deals/${result.id}`,
      };
      onOpenChange(false);
      router.push(paths[result.type]);
    },
    [router, onOpenChange, search]
  );

  const handleRecentSelect = React.useCallback(
    (recent: RecentSearch) => {
      if (recent.resultId && recent.type) {
        const paths: Record<string, string> = {
          contact: `/contacts/${recent.resultId}`,
          company: `/companies/${recent.resultId}`,
          deal: `/deals/${recent.resultId}`,
        };
        onOpenChange(false);
        router.push(paths[recent.type]);
      } else {
        setSearch(recent.query);
      }
    },
    [router, onOpenChange]
  );

  const handleClearRecent = React.useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Search"
      className={cn(
        "fixed inset-0 z-50",
        "flex items-start justify-center pt-[15vh]"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Search Panel */}
      <div
        className={cn(
          "relative w-full max-w-[680px] mx-4",
          "bg-white dark:bg-neutral-900",
          "rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800",
          "overflow-hidden",
          "animate-in fade-in slide-in-from-top-4 duration-200"
        )}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-neutral-400 shrink-0 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-neutral-400 shrink-0" />
          )}
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search contacts, companies, and deals..."
            className={cn(
              "flex-1 h-14 bg-transparent",
              "text-base text-neutral-900 dark:text-neutral-100",
              "placeholder:text-neutral-400",
              "outline-none border-none",
              "focus:ring-0"
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          )}
          <kbd
            className={cn(
              "hidden sm:inline-flex items-center gap-1",
              "px-2 py-1 rounded",
              "bg-neutral-100 dark:bg-neutral-800",
              "text-xs font-medium text-neutral-500 dark:text-neutral-400",
              "border border-neutral-200 dark:border-neutral-700"
            )}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <Command.List
          className={cn(
            "max-h-[450px] overflow-y-auto overflow-x-hidden",
            "py-2"
          )}
        >
          {/* Empty state when no search */}
          {!search && recentSearches.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <span className="text-sm">
                  Start typing to search across contacts, companies, and deals
                </span>
              </div>
            </div>
          )}

          {/* Recent searches */}
          {!search && recentSearches.length > 0 && (
            <Command.Group className="px-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Recent Searches
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map((recent) => (
                <Command.Item
                  key={recent.id}
                  value={`recent-${recent.id}`}
                  onSelect={() => handleRecentSelect(recent)}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg cursor-pointer",
                    "text-neutral-700 dark:text-neutral-200",
                    "transition-colors duration-100",
                    "data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-neutral-800",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    "outline-none"
                  )}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <Clock className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {recent.resultLabel ? (
                      <>
                        <span className="font-medium text-sm">
                          {recent.resultLabel}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {recent.type}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm">{recent.query}</span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* No results */}
          {search.length >= 2 && !isSearching && !hasResults && (
            <Command.Empty className="py-12 text-center text-sm text-neutral-500">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <span>No results found for &quot;{search}&quot;</span>
                <span className="text-xs text-muted-foreground">
                  Try a different search term
                </span>
              </div>
            </Command.Empty>
          )}

          {/* Contact results */}
          {contacts.length > 0 && (
            <Command.Group className="px-2 mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Contacts
              </div>
              {contacts.map((contact) => (
                <Command.Item
                  key={contact.id}
                  value={`contact-${contact.id}-${contact.firstName}-${contact.lastName}`}
                  onSelect={() => handleSelect(contact)}
                  className={cn(
                    "mx-1 rounded-lg",
                    "data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-neutral-800"
                  )}
                >
                  <SearchResultItem
                    result={contact}
                    showType={false}
                    className="hover:bg-transparent"
                  />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Company results */}
          {companies.length > 0 && (
            <Command.Group className="px-2 mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Companies
              </div>
              {companies.map((company) => (
                <Command.Item
                  key={company.id}
                  value={`company-${company.id}-${company.name}`}
                  onSelect={() => handleSelect(company)}
                  className={cn(
                    "mx-1 rounded-lg",
                    "data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-neutral-800"
                  )}
                >
                  <SearchResultItem
                    result={company}
                    showType={false}
                    className="hover:bg-transparent"
                  />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Deal results */}
          {deals.length > 0 && (
            <Command.Group className="px-2 mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                <HandshakeIcon className="h-3.5 w-3.5" />
                Deals
              </div>
              {deals.map((deal) => (
                <Command.Item
                  key={deal.id}
                  value={`deal-${deal.id}-${deal.name}`}
                  onSelect={() => handleSelect(deal)}
                  className={cn(
                    "mx-1 rounded-lg",
                    "data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-neutral-800"
                  )}
                >
                  <SearchResultItem
                    result={deal}
                    showType={false}
                    className="hover:bg-transparent"
                  />
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer */}
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            "px-4 py-3",
            "border-t border-neutral-200 dark:border-neutral-800",
            "bg-neutral-50 dark:bg-neutral-900/50",
            "text-xs text-neutral-400"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">
                ↓
              </kbd>
              <span className="ml-1">to navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">
                ↵
              </kbd>
              <span className="ml-1">to select</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">
                K
              </kbd>
            </span>
            <span>to toggle</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

// ============================================================================
// Hook for managing global search state and keyboard shortcuts
// ============================================================================

export function useGlobalSearch() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Open on Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}

// ============================================================================
// Provider component for easy integration
// ============================================================================

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useGlobalSearch();

  return (
    <>
      {children}
      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}

export default GlobalSearch;
