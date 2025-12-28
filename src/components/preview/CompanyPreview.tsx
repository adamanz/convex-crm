"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Phone,
  MapPin,
  Users,
  Briefcase,
  DollarSign,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { PreviewPanel, PreviewSection, PreviewRow, PreviewActions } from "./PreviewPanel";

export interface CompanyPreviewData {
  _id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  description?: string;
  phone?: string;
  website?: string;
  tags: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactCount?: number;
  dealCount?: number;
  totalDealValue?: number;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface CompanyPreviewProps {
  company: CompanyPreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CompanyPreview({
  company,
  open,
  onOpenChange,
}: CompanyPreviewProps) {
  if (!company) return null;

  const addressParts = [
    company.address?.city,
    company.address?.state,
    company.address?.country,
  ].filter(Boolean);
  const locationString = addressParts.join(", ");

  return (
    <PreviewPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Company Preview"
    >
      <div className="flex flex-col h-full">
        {/* Company Header */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-2 ring-background shadow-md">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  {getInitials(company.name)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-xl font-semibold truncate">{company.name}</h2>
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {company.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {company.industry && (
                <Badge variant="secondary" className="mt-2">
                  {company.industry}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
              {company.description}
            </p>
          )}

          {/* Tags */}
          {company.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {company.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{company.contactCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{company.dealCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">
              {company.totalDealValue
                ? formatCurrency(company.totalDealValue)
                : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Pipeline</p>
          </div>
        </div>

        <Separator />

        {/* Company Details */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          <PreviewSection title="Company Information">
            <div className="space-y-2">
              {company.size && (
                <PreviewRow
                  label="Company Size"
                  value={formatCompanySize(company.size)}
                  icon={<Users className="h-4 w-4" />}
                />
              )}
              {company.annualRevenue && (
                <PreviewRow
                  label="Annual Revenue"
                  value={formatCurrency(company.annualRevenue)}
                  icon={<DollarSign className="h-4 w-4" />}
                />
              )}
              {company.phone && (
                <PreviewRow
                  label="Phone"
                  value={company.phone}
                  icon={<Phone className="h-4 w-4" />}
                  href={`tel:${company.phone}`}
                />
              )}
              {locationString && (
                <PreviewRow
                  label="Location"
                  value={locationString}
                  icon={<MapPin className="h-4 w-4" />}
                />
              )}
              {company.website && (
                <PreviewRow
                  label="Website"
                  value={
                    <span className="flex items-center gap-1">
                      {company.website}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  }
                  icon={<Globe className="h-4 w-4" />}
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                />
              )}
            </div>
          </PreviewSection>

          {/* Owner */}
          {company.owner && (
            <PreviewSection title="Account Owner">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {getInitials(
                    [company.owner.firstName, company.owner.lastName]
                      .filter(Boolean)
                      .join(" ")
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {[company.owner.firstName, company.owner.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="text-sm text-muted-foreground">Owner</p>
                </div>
              </div>
            </PreviewSection>
          )}

          {/* Quick Links */}
          <PreviewSection title="Quick Links">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/companies/${company._id}?tab=contacts`}>
                  <Users className="h-4 w-4" />
                  View Contacts
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/companies/${company._id}?tab=deals`}>
                  <Briefcase className="h-4 w-4" />
                  View Deals
                </Link>
              </Button>
            </div>
          </PreviewSection>
        </div>

        {/* Footer Actions */}
        <PreviewActions>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/companies/${company._id}`}>
              View Full Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </PreviewActions>
      </div>
    </PreviewPanel>
  );
}

export default CompanyPreview;
