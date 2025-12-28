"use client";

import * as React from "react";
import { X, Keyboard, Navigation, Zap, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShortcuts, formatShortcutKeys } from "./ShortcutProvider";

interface ShortcutGuideProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * ShortcutGuide displays a modal with all available keyboard shortcuts.
 * Can be controlled externally or use the ShortcutProvider context.
 */
export function ShortcutGuide({ open, onOpenChange }: ShortcutGuideProps) {
  const { shortcuts, isGuideOpen, closeGuide } = useShortcuts();

  const isOpen = open ?? isGuideOpen;
  const handleClose = onOpenChange ? () => onOpenChange(false) : closeGuide;

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, typeof shortcuts> = {
      navigation: [],
      action: [],
      modal: [],
      general: [],
    };

    for (const shortcut of shortcuts) {
      if (groups[shortcut.category]) {
        groups[shortcut.category].push(shortcut);
      }
    }

    return groups;
  }, [shortcuts]);

  const categoryConfig = {
    navigation: {
      title: "Navigation",
      icon: Navigation,
      description: "Move around the app",
    },
    action: {
      title: "Actions",
      icon: Zap,
      description: "Create and modify",
    },
    modal: {
      title: "Modals & Dialogs",
      icon: LayoutGrid,
      description: "Open and close overlays",
    },
    general: {
      title: "General",
      icon: Keyboard,
      description: "Common operations",
    },
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-guide-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl mx-4",
          "bg-white dark:bg-zinc-900",
          "rounded-xl shadow-2xl",
          "border border-zinc-200 dark:border-zinc-800",
          "overflow-hidden",
          "animate-in fade-in slide-in-from-bottom-4 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Keyboard className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h2
                id="shortcut-guide-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Navigate faster with keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg",
              "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "transition-colors"
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-6 sm:grid-cols-2">
            {(
              Object.entries(categoryConfig) as [
                keyof typeof categoryConfig,
                (typeof categoryConfig)[keyof typeof categoryConfig]
              ][]
            ).map(([category, config]) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts || categoryShortcuts.length === 0) {
                return null;
              }

              const Icon = config.icon;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {config.title}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">
              ?
            </kbd>{" "}
            to toggle this guide
          </p>
        </div>
      </div>
    </div>
  );
}

interface ShortcutRowProps {
  shortcut: {
    id: string;
    keys: string[];
    description: string;
    isSequence?: boolean;
  };
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  const formattedKeys = formatShortcutKeys(shortcut.keys, shortcut.isSequence);

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-zinc-600 dark:text-zinc-300">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {formattedKeys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd
              className={cn(
                "inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded",
                "bg-zinc-100 dark:bg-zinc-800",
                "border border-zinc-200 dark:border-zinc-700",
                "text-[11px] font-mono font-medium",
                "text-zinc-600 dark:text-zinc-300"
              )}
            >
              {key}
            </kbd>
            {shortcut.isSequence && index < formattedKeys.length - 1 && (
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] px-1">
                then
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to programmatically control the shortcut guide
 */
export function useShortcutGuide() {
  const { isGuideOpen, openGuide, closeGuide, toggleGuide } = useShortcuts();

  return {
    isOpen: isGuideOpen,
    open: openGuide,
    close: closeGuide,
    toggle: toggleGuide,
  };
}
