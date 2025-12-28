"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

// Shortcut definition type
export interface Shortcut {
  id: string;
  keys: string[]; // e.g., ["meta", "k"] or ["g", "c"]
  description: string;
  category: "navigation" | "action" | "modal" | "general";
  action: () => void;
  // Whether this is a sequence (g then c) vs combo (cmd+k)
  isSequence?: boolean;
  // Context where this shortcut is active
  context?: "global" | "contacts" | "deals" | "activities";
}

interface ShortcutContextValue {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  isGuideOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  toggleGuide: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  isCommandPaletteOpen: boolean;
  currentContext: string;
}

const ShortcutContext = React.createContext<ShortcutContextValue | undefined>(
  undefined
);

export function useShortcuts() {
  const context = React.useContext(ShortcutContext);
  if (!context) {
    // Return a safe default during SSR or before provider mounts
    return {
      shortcuts: [],
      registerShortcut: () => {},
      unregisterShortcut: () => {},
      isGuideOpen: false,
      openGuide: () => {},
      closeGuide: () => {},
      toggleGuide: () => {},
      openCommandPalette: () => {},
      closeCommandPalette: () => {},
      isCommandPaletteOpen: false,
      currentContext: "global",
    };
  }
  return context;
}

// Hook to register a shortcut
export function useRegisterShortcut(shortcut: Omit<Shortcut, "action"> & { action: () => void }) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  React.useEffect(() => {
    registerShortcut(shortcut);
    return () => unregisterShortcut(shortcut.id);
  }, [shortcut.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

interface ShortcutProviderProps {
  children: React.ReactNode;
}

export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [shortcuts, setShortcuts] = React.useState<Shortcut[]>([]);
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Track sequence keys (for "g then c" style shortcuts)
  const sequenceBufferRef = React.useRef<string[]>([]);
  const sequenceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Determine current context from pathname
  const currentContext = React.useMemo(() => {
    if (pathname?.startsWith("/contacts")) return "contacts";
    if (pathname?.startsWith("/deals")) return "deals";
    if (pathname?.startsWith("/activities")) return "activities";
    return "global";
  }, [pathname]);

  // Register default shortcuts
  const defaultShortcuts: Shortcut[] = React.useMemo(
    () => [
      {
        id: "command-palette",
        keys: ["meta", "k"],
        description: "Open command palette",
        category: "modal",
        action: () => setIsCommandPaletteOpen(true),
      },
      {
        id: "new-item",
        keys: ["meta", "n"],
        description: "Create new item (context-aware)",
        category: "action",
        action: () => {
          // Context-aware new item creation
          if (currentContext === "contacts") {
            router.push("/contacts?new=true");
          } else if (currentContext === "deals") {
            router.push("/deals?new=true");
          } else {
            // Default to contacts
            router.push("/contacts?new=true");
          }
        },
      },
      {
        id: "go-contacts",
        keys: ["g", "c"],
        description: "Go to contacts",
        category: "navigation",
        isSequence: true,
        action: () => router.push("/contacts"),
      },
      {
        id: "go-deals",
        keys: ["g", "d"],
        description: "Go to deals",
        category: "navigation",
        isSequence: true,
        action: () => router.push("/deals"),
      },
      {
        id: "go-activities",
        keys: ["g", "a"],
        description: "Go to activities",
        category: "navigation",
        isSequence: true,
        action: () => router.push("/activities"),
      },
      {
        id: "focus-search",
        keys: ["/"],
        description: "Focus search",
        category: "general",
        action: () => setIsCommandPaletteOpen(true),
      },
      {
        id: "close-modal",
        keys: ["Escape"],
        description: "Close modals",
        category: "modal",
        action: () => {
          setIsGuideOpen(false);
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: "shortcut-guide",
        keys: ["?"],
        description: "Show keyboard shortcuts",
        category: "modal",
        action: () => setIsGuideOpen(true),
      },
    ],
    [currentContext, router]
  );

  // Merge default shortcuts with registered ones
  const allShortcuts = React.useMemo(() => {
    const registeredIds = new Set(shortcuts.map((s) => s.id));
    const defaults = defaultShortcuts.filter((s) => !registeredIds.has(s.id));
    return [...defaults, ...shortcuts];
  }, [shortcuts, defaultShortcuts]);

  const registerShortcut = React.useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const exists = prev.find((s) => s.id === shortcut.id);
      if (exists) {
        return prev.map((s) => (s.id === shortcut.id ? shortcut : s));
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = React.useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const openGuide = React.useCallback(() => setIsGuideOpen(true), []);
  const closeGuide = React.useCallback(() => setIsGuideOpen(false), []);
  const toggleGuide = React.useCallback(
    () => setIsGuideOpen((prev) => !prev),
    []
  );
  const openCommandPalette = React.useCallback(
    () => setIsCommandPaletteOpen(true),
    []
  );
  const closeCommandPalette = React.useCallback(
    () => setIsCommandPaletteOpen(false),
    []
  );

  // Check if element is an input
  const isInputElement = React.useCallback((target: EventTarget | null) => {
    if (!target) return false;
    const element = target as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      element.isContentEditable
    );
  }, []);

  // Handle keyboard events
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input (except for escape and some modal shortcuts)
      const isInput = isInputElement(event.target);

      // Always allow escape
      if (event.key === "Escape") {
        const escapeShortcut = allShortcuts.find(
          (s) => s.keys[0] === "Escape"
        );
        if (escapeShortcut) {
          escapeShortcut.action();
          return;
        }
      }

      // Skip other shortcuts if in input
      if (isInput) return;

      // Check for combo shortcuts (meta+k, meta+n, etc.)
      for (const shortcut of allShortcuts) {
        if (shortcut.isSequence) continue;

        const keys = shortcut.keys;

        // Handle single key shortcuts
        if (keys.length === 1) {
          if (event.key === keys[0] && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }

        // Handle combo shortcuts (meta+key)
        if (keys.length === 2 && keys[0] === "meta") {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === keys[1].toLowerCase()
          ) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }

      // Handle sequence shortcuts (g then c)
      const key = event.key.toLowerCase();

      // Add to sequence buffer
      sequenceBufferRef.current.push(key);

      // Clear any existing timeout
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }

      // Set timeout to clear buffer
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceBufferRef.current = [];
      }, 1000);

      // Check for sequence matches
      for (const shortcut of allShortcuts) {
        if (!shortcut.isSequence) continue;

        const keys = shortcut.keys;
        const buffer = sequenceBufferRef.current;

        // Check if buffer ends with the shortcut keys
        if (buffer.length >= keys.length) {
          const bufferEnd = buffer.slice(-keys.length);
          if (keys.every((k, i) => k.toLowerCase() === bufferEnd[i])) {
            event.preventDefault();
            sequenceBufferRef.current = [];
            if (sequenceTimeoutRef.current) {
              clearTimeout(sequenceTimeoutRef.current);
            }
            shortcut.action();
            return;
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allShortcuts, isInputElement]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  const value = React.useMemo(
    () => ({
      shortcuts: allShortcuts,
      registerShortcut,
      unregisterShortcut,
      isGuideOpen,
      openGuide,
      closeGuide,
      toggleGuide,
      openCommandPalette,
      closeCommandPalette,
      isCommandPaletteOpen,
      currentContext,
    }),
    [
      allShortcuts,
      registerShortcut,
      unregisterShortcut,
      isGuideOpen,
      openGuide,
      closeGuide,
      toggleGuide,
      openCommandPalette,
      closeCommandPalette,
      isCommandPaletteOpen,
      currentContext,
    ]
  );

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

// Utility function to format shortcut keys for display
export function formatShortcutKeys(keys: string[], isSequence?: boolean): string[] {
  const formatKey = (key: string): string => {
    switch (key.toLowerCase()) {
      case "meta":
        return typeof navigator !== "undefined" && navigator.platform?.includes("Mac")
          ? "Cmd"
          : "Ctrl";
      case "escape":
        return "Esc";
      case "/":
        return "/";
      default:
        return key.toUpperCase();
    }
  };

  if (isSequence) {
    return keys.map(formatKey);
  }

  return [keys.map(formatKey).join("+")];
}
