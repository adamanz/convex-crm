"use client";

import { Search, Command, Settings, ChevronDown, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandMenu } from "@/components/layout/command-menu";
import { useShortcuts } from "@/components/shortcuts";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  id?: Id<"users">;
}

interface DashboardHeaderProps {
  user?: UserProfile;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { isCommandPaletteOpen, openCommandPalette, closeCommandPalette, openGuide } = useShortcuts();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 lg:px-6">
        {/* Left spacer for mobile menu button */}
        <div className="w-8 lg:hidden" />

        {/* Search / Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex h-9 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm transition-all",
            "hover:border-zinc-300 hover:bg-zinc-100",
            "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
            "max-w-md"
          )}
        >
          <Search className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">
            Search or jump to...
          </span>
          <div className="ml-auto flex items-center gap-1">
            <kbd
              className={cn(
                "hidden items-center gap-0.5 rounded px-1.5 py-0.5 sm:inline-flex",
                "bg-zinc-100 text-[10px] font-medium text-zinc-500",
                "dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationBell userId={user?.id} />

          {/* Keyboard Shortcuts */}
          <button
            onClick={openGuide}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-200 md:inline">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-zinc-400 md:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Menu */}
      <CommandMenu open={isCommandPaletteOpen} onOpenChange={(open) => open ? openCommandPalette() : closeCommandPalette()} />
    </>
  );
}
