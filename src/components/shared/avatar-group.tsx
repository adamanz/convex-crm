"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarItem {
  src?: string;
  alt?: string;
  fallback?: string;
}

const sizeConfig = {
  sm: {
    avatar: "h-6 w-6 text-xs",
    overlap: "-ml-2",
    indicator: "h-6 min-w-6 px-1.5 text-xs",
  },
  md: {
    avatar: "h-8 w-8 text-sm",
    overlap: "-ml-2.5",
    indicator: "h-8 min-w-8 px-2 text-xs",
  },
  lg: {
    avatar: "h-10 w-10 text-base",
    overlap: "-ml-3",
    indicator: "h-10 min-w-10 px-2.5 text-sm",
  },
};

export interface AvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const config = sizeConfig[size];
  const visibleAvatars = avatars.slice(0, max);
  const overflowCount = avatars.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAvatars.map((avatar, index) => (
        <AvatarGroupItem
          key={index}
          avatar={avatar}
          index={index}
          config={config}
        />
      ))}
      {overflowCount > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 border-white bg-zinc-100 font-medium text-zinc-600 dark:border-zinc-950 dark:bg-zinc-800 dark:text-zinc-300",
            config.indicator,
            visibleAvatars.length > 0 && config.overlap
          )}
          title={`+${overflowCount} more`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

interface AvatarGroupItemProps {
  avatar: AvatarItem;
  index: number;
  config: (typeof sizeConfig)[keyof typeof sizeConfig];
}

function AvatarGroupItem({ avatar, index, config }: AvatarGroupItemProps) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-zinc-950",
        config.avatar,
        index > 0 && config.overlap
      )}
      title={avatar.alt}
    >
      {avatar.src && !hasError ? (
        <img
          src={avatar.src}
          alt={avatar.alt || "Avatar"}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {avatar.fallback || "?"}
        </div>
      )}
    </div>
  );
}
