"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  MessageSquare,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Command,
  Zap,
  Target,
  Mail,
  Calendar,
  TrendingUp,
  Layers,
  Tag,
  Package,
  Map,
  ListFilter,
  Workflow,
  BarChart3,
  Trophy,
  ChevronDown,
  FileText,
  Phone,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShortcuts } from "@/components/shortcuts";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AppSidebarProps {
  user?: UserProfile;
  onSignOut?: () => void;
}

export function AppSidebar({ user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "CRM Objects": true,
    "Engagement": true,
    "Sales Tools": false,
    "Configuration": false,
  });
  const { openCommandPalette } = useShortcuts();

  // Persist sidebar collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Navigation sections with all objects
  const navSections: NavSection[] = [
    {
      title: "CRM Objects",
      defaultOpen: true,
      items: [
        { label: "Contacts", href: "/contacts", icon: Users },
        { label: "Companies", href: "/companies", icon: Building2 },
        { label: "Deals", href: "/deals", icon: Handshake },
        { label: "Activities", href: "/activities", icon: Activity },
        { label: "Pipelines", href: "/settings/pipelines", icon: Layers },
      ],
    },
    {
      title: "Engagement",
      defaultOpen: true,
      items: [
        { label: "Conversations", href: "/conversations", icon: MessageSquare },
        { label: "Email", href: "/settings/email", icon: Mail },
        { label: "Calendar", href: "/calendar", icon: Calendar },
        { label: "Calls", href: "/calls", icon: Phone },
      ],
    },
    {
      title: "Sales Tools",
      defaultOpen: false,
      items: [
        { label: "Momentum", href: "/momentum", icon: Sparkles },
        { label: "Forecasting", href: "/forecasting", icon: TrendingUp },
        { label: "Leaderboards", href: "/leaderboards", icon: Trophy },
        { label: "Goals", href: "/settings/goals", icon: Target },
        { label: "Smart Lists", href: "/settings/smart-lists", icon: ListFilter },
        { label: "Workflows", href: "/workflows", icon: Workflow },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Configuration",
      defaultOpen: false,
      items: [
        { label: "Products", href: "/settings/products", icon: Package },
        { label: "Tags", href: "/tags", icon: Tag },
        { label: "Territories", href: "/territories", icon: Map },
        { label: "Templates", href: "/templates", icon: FileText },
      ],
    },
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = isActiveRoute(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
          isActive
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-white dark:text-zinc-900"
            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        )} />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const SectionHeader = ({ title, isOpen }: { title: string; isOpen: boolean }) => (
    <button
      onClick={() => toggleSection(title)}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400",
        isCollapsed && "justify-center px-0"
      )}
    >
      {!isCollapsed && (
        <>
          <span>{title}</span>
          <ChevronDown className={cn(
            "ml-auto h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )} />
        </>
      )}
      {isCollapsed && (
        <div className="h-px w-4 bg-zinc-300 dark:bg-zinc-700" />
      )}
    </button>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-zinc-100 dark:border-zinc-800/50",
        isCollapsed ? "justify-center px-2" : "px-4"
      )}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-sm dark:from-white dark:to-zinc-100">
            <Zap className="h-4 w-4 text-white dark:text-zinc-900" />
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
              Convex CRM
            </span>
          )}
        </Link>
      </div>

      {/* Search Trigger */}
      <div className={cn("p-3", isCollapsed && "px-2")}>
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2",
            "text-[13px] text-zinc-400 transition-all",
            "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-500",
            "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Search...</span>
              <kbd className="flex items-center gap-0.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Dashboard Link */}
      <div className={cn("px-3", isCollapsed && "px-2")}>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
            pathname === "/"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LayoutDashboard className={cn(
            "h-4 w-4",
            pathname === "/"
              ? "text-white dark:text-zinc-900"
              : "text-zinc-400 dark:text-zinc-500"
          )} />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navSections.map((section) => {
          const isOpen = expandedSections[section.title] ?? section.defaultOpen;
          return (
            <div key={section.title} className="space-y-0.5">
              {!isCollapsed && (
                <SectionHeader title={section.title} isOpen={isOpen ?? true} />
              )}
              {isCollapsed && (
                <div className="my-2 h-px bg-zinc-100 dark:bg-zinc-800" />
              )}
              {(isOpen || isCollapsed) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className={cn(
        "border-t border-zinc-100 p-3 dark:border-zinc-800/50",
        isCollapsed && "px-2"
      )}>
        {!isCollapsed && (
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Quick Actions
          </div>
        )}
        <div className="space-y-1">
          <Link
            href="/contacts?new=true"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Add Contact" : undefined}
          >
            <Plus className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            {!isCollapsed && <span>Add Contact</span>}
          </Link>
          <Link
            href="/companies?new=true"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Add Company" : undefined}
          >
            <Plus className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            {!isCollapsed && <span>Add Company</span>}
          </Link>
          <Link
            href="/deals?new=true"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Add Deal" : undefined}
          >
            <Plus className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            {!isCollapsed && <span>Add Deal</span>}
          </Link>
          <Link
            href="/activities?new=true"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Add Activity" : undefined}
          >
            <Plus className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            {!isCollapsed && <span>Add Activity</span>}
          </Link>
        </div>
      </div>

      {/* Settings Link */}
      <div className={cn(
        "border-t border-zinc-100 p-3 dark:border-zinc-800/50",
        isCollapsed && "px-2"
      )}>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
            pathname.startsWith("/settings") && !pathname.includes("/settings/")
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* User Profile */}
      <div className={cn(
        "border-t border-zinc-100 p-3 dark:border-zinc-800/50",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2",
          isCollapsed && "justify-center p-0"
        )}>
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 truncate">
                <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className={cn(
        "hidden border-t border-zinc-100 p-2 lg:block dark:border-zinc-800/50",
        isCollapsed && "px-2"
      )}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg p-2 text-[12px] font-medium text-zinc-400 transition-all",
            "hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-white p-2 shadow-lg lg:hidden dark:bg-zinc-900"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-out lg:hidden dark:bg-zinc-900",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen border-r border-zinc-100 bg-white transition-all duration-200 lg:block dark:border-zinc-800/50 dark:bg-zinc-900",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export default AppSidebar;
