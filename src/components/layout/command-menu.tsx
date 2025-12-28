"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Building2,
  Users,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Loader2,
  Activity,
  Settings,
  TrendingUp,
  Target,
  Mail,
  Calendar,
  Layers,
  Trophy,
  Tag,
  Package,
  Workflow,
  ListFilter,
  FileText,
  DollarSign,
  ArrowRight,
  Hash,
} from "lucide-react";
import { cn, getInitials, formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Debounce hook for search
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

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState("");

  // Debounce search to avoid too many queries
  const debouncedSearch = useDebounce(search, 150);

  // Search queries
  const contactResults = useQuery(
    api.contacts.search,
    debouncedSearch.length >= 2 ? { searchTerm: debouncedSearch, limit: 4 } : "skip"
  );

  const companyResults = useQuery(
    api.companies.search,
    debouncedSearch.length >= 2 ? { searchTerm: debouncedSearch, limit: 4 } : "skip"
  );

  const dealResults = useQuery(
    api.deals.search,
    debouncedSearch.length >= 2 ? { searchTerm: debouncedSearch, limit: 4 } : "skip"
  );

  const isSearching =
    debouncedSearch.length >= 2 &&
    (contactResults === undefined || companyResults === undefined || dealResults === undefined);

  const hasSearchResults =
    debouncedSearch.length >= 2 &&
    ((contactResults && contactResults.length > 0) ||
      (companyResults && companyResults.length > 0) ||
      (dealResults && dealResults.length > 0));

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  // Navigation items - organized by category
  const pages = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/", shortcut: "G H" },
    { id: "contacts", label: "Contacts", icon: Users, href: "/contacts", shortcut: "G C" },
    { id: "companies", label: "Companies", icon: Building2, href: "/companies", shortcut: "G O" },
    { id: "deals", label: "Deals", icon: Handshake, href: "/deals", shortcut: "G D" },
    { id: "activities", label: "Activities", icon: Activity, href: "/activities", shortcut: "G A" },
    { id: "conversations", label: "Conversations", icon: MessageSquare, href: "/conversations", shortcut: "G M" },
    { id: "forecasting", label: "Forecasting", icon: TrendingUp, href: "/forecasting" },
    { id: "leaderboards", label: "Leaderboards", icon: Trophy, href: "/leaderboards" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar" },
  ];

  const quickActions = [
    { id: "new-contact", label: "Create Contact", icon: Users, href: "/contacts?new=true", shortcut: "N C" },
    { id: "new-company", label: "Create Company", icon: Building2, href: "/companies?new=true", shortcut: "N O" },
    { id: "new-deal", label: "Create Deal", icon: Handshake, href: "/deals?new=true", shortcut: "N D" },
    { id: "new-activity", label: "Log Activity", icon: Activity, href: "/activities?new=true" },
  ];

  const settings = [
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
    { id: "pipelines", label: "Pipelines", icon: Layers, href: "/settings/pipelines" },
    { id: "goals", label: "Goals", icon: Target, href: "/settings/goals" },
    { id: "email", label: "Email Settings", icon: Mail, href: "/settings/email" },
    { id: "products", label: "Products", icon: Package, href: "/settings/products" },
    { id: "smart-lists", label: "Smart Lists", icon: ListFilter, href: "/settings/smart-lists" },
    { id: "workflows", label: "Workflows", icon: Workflow, href: "/workflows" },
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Menu"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Panel */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-[560px] -translate-x-1/2">
        <div className="mx-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search or type a command..."
              className="h-12 flex-1 bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            <kbd className="hidden rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 sm:inline dark:bg-zinc-800">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-zinc-500">
              No results found
            </Command.Empty>

            {/* Search Results - Contacts */}
            {debouncedSearch.length >= 2 && contactResults && contactResults.length > 0 && (
              <Command.Group>
                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  <Users className="h-3 w-3" />
                  Contacts
                </div>
                {contactResults.map((contact) => (
                  <Command.Item
                    key={contact._id}
                    value={`contact-${contact._id}-${contact.firstName}-${contact.lastName}`}
                    onSelect={() => runCommand(() => router.push(`/contacts/${contact._id}`))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-700 outline-none data-[selected=true]:bg-zinc-100 dark:text-zinc-200 dark:data-[selected=true]:bg-zinc-800"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback className="bg-blue-500 text-[10px] text-white">
                        {getInitials(contact.firstName, contact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <span className="font-medium">
                        {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                      </span>
                      {contact.company?.name && (
                        <span className="ml-2 text-zinc-400">at {contact.company.name}</span>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Companies */}
            {debouncedSearch.length >= 2 && companyResults && companyResults.length > 0 && (
              <Command.Group>
                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  <Building2 className="h-3 w-3" />
                  Companies
                </div>
                {companyResults.map((company) => (
                  <Command.Item
                    key={company._id}
                    value={`company-${company._id}-${company.name}`}
                    onSelect={() => runCommand(() => router.push(`/companies/${company._id}`))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-700 outline-none data-[selected=true]:bg-zinc-100 dark:text-zinc-200 dark:data-[selected=true]:bg-zinc-800"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="" className="h-5 w-5 rounded" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-medium">{company.name}</span>
                      {company.industry && <span className="ml-2 text-zinc-400">{company.industry}</span>}
                    </div>
                    <ArrowRight className="h-3 w-3 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Deals */}
            {debouncedSearch.length >= 2 && dealResults && dealResults.length > 0 && (
              <Command.Group>
                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  <Handshake className="h-3 w-3" />
                  Deals
                </div>
                {dealResults.map((deal) => (
                  <Command.Item
                    key={deal._id}
                    value={`deal-${deal._id}-${deal.name}`}
                    onSelect={() => runCommand(() => router.push(`/deals/${deal._id}`))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-700 outline-none data-[selected=true]:bg-zinc-100 dark:text-zinc-200 dark:data-[selected=true]:bg-zinc-800"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg",
                        deal.status === "won"
                          ? "bg-green-500"
                          : deal.status === "lost"
                          ? "bg-red-500"
                          : "bg-violet-500"
                      )}
                    >
                      <DollarSign className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-medium">{deal.name}</span>
                      {deal.company?.name && <span className="ml-2 text-zinc-400">{deal.company.name}</span>}
                    </div>
                    {deal.amount && (
                      <span className="text-sm font-medium text-emerald-600">
                        {formatCurrency(deal.amount, deal.currency)}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Default Navigation (when not searching) */}
            {debouncedSearch.length < 2 && (
              <>
                {/* Quick Actions */}
                <Command.Group>
                  <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Quick Actions
                  </div>
                  {quickActions.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    />
                  ))}
                </Command.Group>

                {/* Pages */}
                <Command.Group>
                  <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Pages
                  </div>
                  {pages.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    />
                  ))}
                </Command.Group>

                {/* Settings */}
                <Command.Group>
                  <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Settings
                  </div>
                  {settings.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    />
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-800">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-zinc-100 px-1 py-0.5 font-mono dark:bg-zinc-800">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Type to search
            </span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

interface CommandItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    shortcut?: string;
  };
  onSelect: () => void;
}

function CommandItem({ item, onSelect }: CommandItemProps) {
  const Icon = item.icon;

  return (
    <Command.Item
      value={item.label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-700 outline-none data-[selected=true]:bg-zinc-100 dark:text-zinc-200 dark:data-[selected=true]:bg-zinc-800"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-3.5 w-3.5 text-zinc-500" />
      </div>
      <span className="flex-1 font-medium">{item.label}</span>
      {item.shortcut && (
        <div className="flex items-center gap-1">
          {item.shortcut.split(" ").map((key, index) => (
            <kbd
              key={index}
              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:bg-zinc-800"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
    </Command.Item>
  );
}

// Hook for managing command menu state
export function useCommandMenu() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
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

// Provider component
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandMenu();

  return (
    <>
      {children}
      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
