"use client";

import { cn } from "@/lib/utils";
import {
  Star,
  Flame,
  Zap,
  Crown,
  Medal,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  ArrowUpCircle,
  BarChart2,
  Users,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Badge {
  badgeType: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  earnedAt?: number;
}

interface BadgeDisplayProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  showName?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  Flame,
  Zap,
  Crown,
  Medal,
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  ArrowUpCircle,
  BarChart2,
  Users,
  HelpCircle,
};

export function BadgeDisplay({
  badge,
  size = "md",
  showTooltip = true,
  showName = false,
  className,
}: BadgeDisplayProps) {
  const Icon = iconMap[badge.icon] || HelpCircle;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const BadgeIcon = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );

  if (!showTooltip) {
    return (
      <div className="flex items-center gap-2">
        {BadgeIcon}
        {showName && (
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {badge.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {BadgeIcon}
            {showName && (
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {badge.name}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{badge.name}</p>
            {badge.description && (
              <p className="text-xs text-zinc-400 mt-1">{badge.description}</p>
            )}
            {badge.earnedAt && (
              <p className="text-xs text-zinc-500 mt-2">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Display multiple badges in a row
 */
interface BadgeListProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BadgeList({
  badges,
  maxDisplay = 5,
  size = "md",
  className,
}: BadgeListProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {displayBadges.map((badge, index) => (
        <BadgeDisplay key={index} badge={badge} size={size} showTooltip />
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-medium dark:bg-zinc-800 dark:text-zinc-400",
                size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-12 w-12 text-sm" : "h-8 w-8 text-xs"
              )}>
                +{remainingCount}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {badges.slice(maxDisplay).map((badge, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BadgeDisplay badge={badge} size="sm" showTooltip={false} />
                    <span className="text-sm">{badge.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Full badge showcase for profile pages
 */
interface BadgeShowcaseProps {
  badges: Badge[];
  className?: string;
}

export function BadgeShowcase({ badges, className }: BadgeShowcaseProps) {
  if (badges.length === 0) {
    return (
      <div className={cn("text-center py-8 text-zinc-400", className)}>
        <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No badges earned yet</p>
        <p className="text-xs mt-1">Keep up the great work to earn badges!</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", className)}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
        >
          <BadgeDisplay badge={badge} size="lg" showTooltip={false} />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {badge.name}
            </p>
            {badge.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {badge.description}
              </p>
            )}
            {badge.earnedAt && (
              <p className="text-xs text-zinc-400 mt-2">
                {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
