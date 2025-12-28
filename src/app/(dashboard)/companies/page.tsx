"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ListPageLayout, ListEmptyState } from "@/components/shared/list-page-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Building2,
  Filter,
  MoreHorizontal,
  Globe,
  Users,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CompanyForm } from "@/components/companies/company-form";

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  // Handle quick add from URL parameter
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowForm(true);
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  // Fetch companies
  const companiesResult = useQuery(api.companies.list, {
    paginationOpts: { numItems: 50 },
    filter: selectedIndustry ? { industry: selectedIndustry } : undefined,
  });

  const industries = useQuery(api.companies.getIndustries);

  const searchResults = useQuery(
    api.companies.search,
    searchQuery.trim().length >= 2
      ? {
          searchTerm: searchQuery.trim(),
          industry: selectedIndustry || undefined,
          limit: 50,
        }
      : "skip"
  );

  const companies = useMemo(() => {
    if (searchQuery.trim().length >= 2 && searchResults) {
      return searchResults;
    }
    return companiesResult?.page ?? [];
  }, [searchQuery, searchResults, companiesResult]);

  const isLoading = companiesResult === undefined;

  return (
    <>
      <ListPageLayout
        title="Companies"
        description={`${companiesResult?.page?.length ?? 0} companies`}
        icon={<Building2 className="h-4 w-4 text-zinc-500" />}
        searchPlaceholder="Search companies..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        primaryAction={{
          label: "Add Company",
          onClick: () => setShowForm(true),
          icon: <Plus className="h-4 w-4 mr-1" />,
        }}
        customFilters={
          <Select value={selectedIndustry || "all"} onValueChange={(val) => setSelectedIndustry(val === "all" ? "" : val)}>
            <SelectTrigger className="h-8 w-[160px] text-[12px]">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-zinc-400" />
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {industries?.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        isLoading={isLoading}
        isEmpty={companies.length === 0}
        emptyState={
          <ListEmptyState
            icon={<Building2 className="h-7 w-7 text-zinc-400" />}
            title="No companies yet"
            description="Add your first company to start tracking your accounts."
            searchQuery={searchQuery}
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add your first company
              </Button>
            }
          />
        }
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {companies.map((company) => (
            <CompanyRow key={company._id} company={company} />
          ))}
        </div>
      </ListPageLayout>

      {/* Add Company Slideout */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-zinc-900">
            <div className="p-6">
              <CompanyForm
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface CompanyRowProps {
  company: {
    _id: string;
    name: string;
    logoUrl?: string;
    domain?: string;
    industry?: string;
    size?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    contactCount?: number;
    dealCount?: number;
    tags?: string[];
  };
}

function CompanyRow({ company }: CompanyRowProps) {
  const location = [company.address?.city, company.address?.state, company.address?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/companies/${company._id}`}
      className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="h-6 w-6 rounded" />
        ) : (
          <Building2 className="h-5 w-5 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
            {company.name}
          </span>
          {company.industry && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {company.industry}
            </Badge>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-3 text-[12px] text-zinc-500">
          {company.domain && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {company.domain}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
        </div>
      </div>

      <div className="hidden items-center gap-4 text-[12px] text-zinc-500 md:flex">
        {company.size && <span>{company.size}</span>}
        {(company.contactCount ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            {company.contactCount} contacts
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Add contact</DropdownMenuItem>
          <DropdownMenuItem>Create deal</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
