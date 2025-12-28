"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Controlled value */
  value?: string;
  /** Controlled onChange handler (fires on every keystroke) */
  onChange?: (value: string) => void;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Debounced search callback (fires after debounceMs delay) */
  onSearch?: (query: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Keyboard shortcut hint to display */
  shortcutHint?: string;
  /** Additional class name */
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  defaultValue = "",
  onSearch,
  debounceMs = 300,
  placeholder = "Search...",
  isLoading = false,
  shortcutHint,
  className,
  disabled,
  ...props
}: SearchInputProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentValue = isControlled ? controlledValue : internalValue;

  // Cleanup debounce timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Update controlled or internal state
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }

    // Debounced onSearch callback
    if (onSearch) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    if (isControlled) {
      onChange?.("");
    } else {
      setInternalValue("");
    }

    // Immediately trigger onSearch with empty string
    if (onSearch) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      onSearch("");
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && currentValue) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search icon */}
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
          disabled && "opacity-50"
        )}
        aria-hidden="true"
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent py-1 text-base shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          // Padding adjustments for icons
          "pl-9",
          shortcutHint && !currentValue && !isLoading ? "pr-12" : "pr-9"
        )}
        {...props}
      />

      {/* Right side: Loading spinner, clear button, or shortcut hint */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isLoading ? (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-label="Loading"
          />
        ) : currentValue ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-sm transition-colors",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              disabled && "pointer-events-none opacity-50"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : shortcutHint ? (
          <kbd
            className={cn(
              "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 text-[10px] font-medium text-muted-foreground",
              "dark:border-zinc-700 dark:bg-zinc-800"
            )}
            aria-label={`Keyboard shortcut: ${shortcutHint}`}
          >
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    </div>
  );
}
