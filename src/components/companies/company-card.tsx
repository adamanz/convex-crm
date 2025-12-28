"use client";

import Link from "next/link";
import { Building2, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface CompanyCardProps {
  company: {
    _id: Id<"companies">;
    name: string;
    domain?: string;
    logoUrl?: string;
    industry?: string;
    size?: string;
    contactCount?: number;
    dealCount?: number;
    totalDealValue?: number;
  };
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCompanySize(size: string | undefined): string {
  if (!size) return "";
  const sizeMap: Record<string, string> = {
    "1-10": "1-10 employees",
    "11-50": "11-50 employees",
    "51-200": "51-200 employees",
    "201-500": "201-500 employees",
    "501-1000": "501-1K employees",
    "1001-5000": "1K-5K employees",
    "5001+": "5K+ employees",
  };
  return sizeMap[size] || size;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200",
        "hover:border-zinc-300 hover:shadow-md",
        "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        className
      )}
    >
      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:from-zinc-800/30" />

      <div className="relative flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">${getInitials(company.name)}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {getInitials(company.name)}
            </span>
          )}
        </div>

        {/* Company Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
            {company.name}
          </h3>
          {company.domain && (
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
              {company.domain}
            </p>
          )}
        </div>
      </div>

      {/* Industry Badge */}
      {company.industry && (
        <div className="relative mt-4">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {company.industry}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="relative mt-4 flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        {/* Employees */}
        {company.size && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Building2 className="h-4 w-4" />
            <span>{formatCompanySize(company.size)}</span>
          </div>
        )}

        {/* Contacts */}
        <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <Users className="h-4 w-4" />
          <span>
            {company.contactCount ?? 0}{" "}
            {company.contactCount === 1 ? "contact" : "contacts"}
          </span>
        </div>

        {/* Deals */}
        {(company.dealCount ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Briefcase className="h-4 w-4" />
            <span>
              {company.dealCount} {company.dealCount === 1 ? "deal" : "deals"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="mt-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="mt-4 flex gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
