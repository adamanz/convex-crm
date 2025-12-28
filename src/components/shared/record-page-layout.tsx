"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RecordPageLayoutProps {
  // Header
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  avatarFallback?: string;
  avatarColor?: string;
  icon?: ReactNode;
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "outline" | "destructive" }>;

  // Actions
  quickActions?: ReactNode;
  menuActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: "default" | "destructive";
    separator?: boolean;
  }>;

  // Tabs
  tabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
  }>;
  defaultTab?: string;

  // Content (if no tabs)
  children?: ReactNode;

  // Back navigation
  backHref?: string;
  backLabel?: string;

  // Loading state
  isLoading?: boolean;
}

export function RecordPageLayout({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  avatarColor = "from-violet-500 to-purple-600",
  icon,
  badges = [],
  quickActions,
  menuActions = [],
  tabs,
  defaultTab,
  children,
  backHref,
  backLabel,
  isLoading = false,
}: RecordPageLayoutProps) {
  const router = useRouter();

  if (isLoading) {
    return <RecordPageSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Avatar/Icon */}
          {(avatarUrl || avatarFallback) && (
            <Avatar className="h-11 w-11">
              <AvatarImage src={avatarUrl} alt={title} />
              <AvatarFallback className={cn("bg-gradient-to-br text-white", avatarColor)}>
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          )}
          {icon && !avatarFallback && (
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br",
              avatarColor
            )}>
              {icon}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-900 truncate dark:text-zinc-50">
                {title}
              </h1>
              {badges.slice(0, 3).map((badge, i) => (
                <Badge
                  key={i}
                  variant={badge.variant || "secondary"}
                  className="text-[10px] px-1.5"
                >
                  {badge.label}
                </Badge>
              ))}
              {badges.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5">
                  +{badges.length - 3}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-zinc-500 truncate dark:text-zinc-400">{subtitle}</p>
            )}
          </div>

          {/* Quick Actions */}
          {quickActions && (
            <div className="flex items-center gap-2">{quickActions}</div>
          )}

          {/* Menu Actions */}
          {menuActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {menuActions.map((action, i) => (
                  <div key={i}>
                    {action.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={cn(
                        action.variant === "destructive" && "text-red-600 focus:text-red-600"
                      )}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Content Area */}
      {tabs && tabs.length > 0 ? (
        <Tabs defaultValue={defaultTab || tabs[0].id} className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-zinc-100 bg-white px-6 dark:border-zinc-800/50 dark:bg-zinc-900">
            <TabsList className="h-11 w-full justify-start gap-6 bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative h-11 rounded-none border-b-2 border-transparent px-0 pb-3 pt-3",
                    "text-[13px] font-medium text-zinc-500 transition-colors",
                    "hover:text-zinc-900 dark:hover:text-zinc-100",
                    "data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900",
                    "dark:data-[state=active]:border-white dark:data-[state=active]:text-white"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div className="flex-1 overflow-auto">{children}</div>
      )}
    </div>
  );
}

function RecordPageSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header Skeleton */}
      <header className="shrink-0 border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </header>

      {/* Tabs Skeleton */}
      <div className="shrink-0 border-b border-zinc-100 bg-white px-6 dark:border-zinc-800/50 dark:bg-zinc-900">
        <div className="flex h-11 items-center gap-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable content card for record pages
interface RecordCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function RecordCard({ title, children, className, headerAction }: RecordCardProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-100 bg-white dark:border-zinc-800/50 dark:bg-zinc-900", className)}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800/50">
        <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        {headerAction}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Field display component
interface RecordFieldProps {
  label: string;
  value?: string | ReactNode;
  icon?: ReactNode;
  href?: string;
}

export function RecordField({ label, value, icon, href }: RecordFieldProps) {
  if (!value) return null;

  const content = (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

// Empty state component for tabs
interface EmptyTabStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyTabState({ icon, title, description, action }: EmptyTabStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="mt-1 text-[13px] text-zinc-500 text-center max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
