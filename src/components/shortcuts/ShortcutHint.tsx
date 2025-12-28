"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatShortcutKeys } from "./ShortcutProvider";

interface ShortcutHintProps {
  keys: string[];
  isSequence?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "ghost";
}

/**
 * ShortcutHint displays keyboard shortcut keys inline.
 *
 * @example
 * <ShortcutHint keys={["meta", "k"]} /> // Shows "Cmd+K" or "Ctrl+K"
 * <ShortcutHint keys={["g", "c"]} isSequence /> // Shows "G then C"
 */
export function ShortcutHint({
  keys,
  isSequence = false,
  className,
  size = "sm",
  variant = "default",
}: ShortcutHintProps) {
  const formattedKeys = formatShortcutKeys(keys, isSequence);

  const sizeClasses = {
    sm: "text-[10px] px-1 py-0.5",
    md: "text-xs px-1.5 py-0.5",
    lg: "text-sm px-2 py-1",
  };

  const variantClasses = {
    default: cn(
      "bg-zinc-100 dark:bg-zinc-800",
      "border border-zinc-200 dark:border-zinc-700",
      "text-zinc-500 dark:text-zinc-400"
    ),
    subtle: cn(
      "bg-zinc-50 dark:bg-zinc-900",
      "text-zinc-400 dark:text-zinc-500"
    ),
    ghost: cn("text-zinc-400 dark:text-zinc-500"),
  };

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {formattedKeys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd
            className={cn(
              "inline-flex items-center justify-center rounded font-mono font-medium",
              sizeClasses[size],
              variantClasses[variant]
            )}
          >
            {key}
          </kbd>
          {isSequence && index < formattedKeys.length - 1 && (
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
              then
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

interface ShortcutLabelProps {
  label: string;
  keys: string[];
  isSequence?: boolean;
  className?: string;
}

/**
 * ShortcutLabel displays a label with an associated keyboard shortcut.
 * Useful for menu items, tooltips, etc.
 *
 * @example
 * <ShortcutLabel label="Open Command Palette" keys={["meta", "k"]} />
 */
export function ShortcutLabel({
  label,
  keys,
  isSequence = false,
  className,
}: ShortcutLabelProps) {
  return (
    <span className={cn("inline-flex items-center justify-between gap-4", className)}>
      <span>{label}</span>
      <ShortcutHint keys={keys} isSequence={isSequence} />
    </span>
  );
}

interface ShortcutTooltipContentProps {
  title: string;
  keys: string[];
  isSequence?: boolean;
  description?: string;
}

/**
 * ShortcutTooltipContent provides formatted content for tooltips.
 *
 * @example
 * <Tooltip>
 *   <TooltipTrigger>Button</TooltipTrigger>
 *   <TooltipContent>
 *     <ShortcutTooltipContent
 *       title="Search"
 *       keys={["meta", "k"]}
 *       description="Search across all items"
 *     />
 *   </TooltipContent>
 * </Tooltip>
 */
export function ShortcutTooltipContent({
  title,
  keys,
  isSequence = false,
  description,
}: ShortcutTooltipContentProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        <ShortcutHint keys={keys} isSequence={isSequence} size="sm" />
      </div>
      {description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
      )}
    </div>
  );
}
