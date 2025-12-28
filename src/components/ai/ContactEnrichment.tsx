"use client";

import { cn } from "@/lib/utils";
import {
  Sparkles,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnrichedData {
  company?: {
    name: string;
    industry?: string;
    size?: string;
    website?: string;
  };
  title?: string;
  location?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  bio?: string;
  skills?: string[];
}

interface ContactEnrichmentProps {
  data: EnrichedData;
  status: "enriched" | "pending" | "failed" | "stale";
  lastEnriched?: Date | number;
  confidence?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

function getStatusInfo(status: ContactEnrichmentProps["status"]): {
  icon: typeof CheckCircle2;
  label: string;
  color: string;
} {
  switch (status) {
    case "enriched":
      return {
        icon: CheckCircle2,
        label: "Enriched",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    case "pending":
      return {
        icon: Clock,
        label: "Pending",
        color: "text-amber-600 dark:text-amber-400",
      };
    case "failed":
      return {
        icon: AlertCircle,
        label: "Failed",
        color: "text-red-500 dark:text-red-400",
      };
    case "stale":
      return {
        icon: Clock,
        label: "Outdated",
        color: "text-zinc-500 dark:text-zinc-400",
      };
  }
}

export function ContactEnrichment({
  data,
  status,
  lastEnriched,
  confidence,
  onRefresh,
  isRefreshing,
  className,
}: ContactEnrichmentProps) {
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  const hasCompanyData = data.company?.name;
  const hasSocialData = data.linkedinUrl || data.twitterHandle;
  const hasLocationData = data.location;
  const hasSkills = data.skills && data.skills.length > 0;

  const isEmpty =
    !hasCompanyData && !hasSocialData && !hasLocationData && !data.title;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              AI Enrichment
            </span>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn("h-3 w-3", statusInfo.color)} />
              <span className={cn("text-xs", statusInfo.color)}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {confidence !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {confidence}%
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Data confidence score</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isEmpty && status !== "pending" ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Sparkles className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No enrichment data available
            </p>
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="mt-3"
              >
                <RefreshCw
                  className={cn("mr-1.5 h-3.5 w-3.5", isRefreshing && "animate-spin")}
                />
                Enrich Now
              </Button>
            )}
          </div>
        ) : status === "pending" ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <RefreshCw className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Enriching contact data...
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              This usually takes a few seconds
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Company Info */}
            {hasCompanyData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {data.company!.name}
                    </span>
                    {data.company!.industry && (
                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {data.company!.industry}
                      </span>
                    )}
                  </div>
                </div>
                {data.company!.size && (
                  <div className="ml-6 text-xs text-zinc-500 dark:text-zinc-400">
                    {data.company!.size} employees
                  </div>
                )}
                {data.company!.website && (
                  <a
                    href={data.company!.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-6 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Globe className="h-3 w-3" />
                    {data.company!.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Title */}
            {data.title && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {data.title}
                </span>
              </div>
            )}

            {/* Location */}
            {hasLocationData && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {data.location}
                </span>
              </div>
            )}

            {/* Social Links */}
            {hasSocialData && (
              <div className="flex items-center gap-3">
                {data.linkedinUrl && (
                  <a
                    href={data.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
                {data.twitterHandle && (
                  <a
                    href={`https://twitter.com/${data.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900"
                  >
                    <Twitter className="h-3.5 w-3.5" />@{data.twitterHandle}
                  </a>
                )}
              </div>
            )}

            {/* Bio */}
            {data.bio && (
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {data.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {hasSkills && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills!.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {skill}
                    </span>
                  ))}
                  {data.skills!.length > 6 && (
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400 dark:bg-zinc-800">
                      +{data.skills!.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Enriched */}
        {lastEnriched && status === "enriched" && (
          <div className="mt-4 border-t border-zinc-100 pt-3 text-[10px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            Last enriched{" "}
            {new Date(lastEnriched).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
