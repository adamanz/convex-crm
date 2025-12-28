"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagBadgeProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Get contrasting text color (black or white) based on background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generate a consistent color from a string (for tags without assigned colors)
 */
function stringToColor(str: string): string {
  const colors = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#ef4444", // red
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#6366f1", // indigo
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

const removeButtonSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function TagBadge({
  name,
  color,
  size = "md",
  removable = false,
  onRemove,
  onClick,
  className,
}: TagBadgeProps) {
  const bgColor = color || stringToColor(name);
  const textColor = getContrastColor(bgColor);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const isClickable = !!onClick;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium transition-colors",
        sizeClasses[size],
        isClickable && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {name}
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className={cn(
            "rounded-sm transition-opacity hover:opacity-70",
            removeButtonSizes[size]
          )}
          style={{ color: textColor }}
          aria-label={`Remove ${name} tag`}
        >
          <X className="h-full w-full" />
        </button>
      )}
    </span>
  );
}

/**
 * Renders a list of tag badges with optional removal
 */
export interface TagListProps {
  tags: Array<{ name: string; color?: string }>;
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: (tagName: string) => void;
  onTagClick?: (tagName: string) => void;
  maxDisplay?: number;
  className?: string;
}

export function TagList({
  tags,
  size = "md",
  removable = false,
  onRemove,
  onTagClick,
  maxDisplay,
  className,
}: TagListProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const hiddenCount = maxDisplay ? Math.max(0, tags.length - maxDisplay) : 0;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map((tag) => (
        <TagBadge
          key={tag.name}
          name={tag.name}
          color={tag.color}
          size={size}
          removable={removable}
          onRemove={onRemove ? () => onRemove(tag.name) : undefined}
          onClick={onTagClick ? () => onTagClick(tag.name) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span
          className={cn(
            "inline-flex items-center rounded-md bg-muted text-muted-foreground font-medium",
            sizeClasses[size]
          )}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

export default TagBadge;
