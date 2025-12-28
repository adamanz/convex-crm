"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search, Bell, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandMenu, useCommandMenu } from "@/components/layout/command-menu";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  rightActions?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  showBackButton = false,
  onBackClick,
  onMenuClick,
  rightActions,
  className,
}: MobileHeaderProps) {
  const pathname = usePathname();
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandMenu();
  const [notificationCount] = useState(3); // Example notification count

  // Get page title based on pathname if not provided
  const getPageTitle = () => {
    if (title) return title;

    const pathMap: Record<string, string> = {
      "/": "Dashboard",
      "/contacts": "Contacts",
      "/companies": "Companies",
      "/deals": "Deals",
      "/conversations": "Messages",
      "/activities": "Activities",
      "/settings": "Settings",
    };

    for (const [path, name] of Object.entries(pathMap)) {
      if (pathname === path || (path !== "/" && pathname.startsWith(path))) {
        return name;
      }
    }
    return "CRM";
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/95",
          "lg:hidden",
          className
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              onClick={onBackClick}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                "text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800",
                "touch-manipulation transition-colors"
              )}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full",
                "text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800",
                "touch-manipulation transition-colors"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {rightActions || (
            <>
              {/* Search Button */}
              <button
                onClick={() => setCommandOpen(true)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  "text-zinc-600 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800",
                  "touch-manipulation transition-colors"
                )}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications Button */}
              <button
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full",
                  "text-zinc-600 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800",
                  "touch-manipulation transition-colors"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Command Menu */}
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}

// Subheader for detail pages with additional context
interface MobileSubheaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileSubheader({ children, className }: MobileSubheaderProps) {
  return (
    <div
      className={cn(
        "border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50",
        "lg:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export default MobileHeader;
