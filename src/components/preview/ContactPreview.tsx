"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  ExternalLink,
  Linkedin,
  Twitter,
  Clock,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { PreviewPanel, PreviewSection, PreviewRow, PreviewActions } from "./PreviewPanel";

export interface ContactPreviewData {
  _id: string;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  title?: string;
  tags: string[];
  linkedinUrl?: string;
  twitterHandle?: string;
  lastActivityAt?: number;
  source?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  company?: {
    _id: string;
    name: string;
    logoUrl?: string;
  } | null;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface ContactPreviewProps {
  contact: ContactPreviewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactPreview({
  contact,
  open,
  onOpenChange,
}: ContactPreviewProps) {
  if (!contact) return null;

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = getInitials(contact.firstName, contact.lastName);

  const addressParts = [
    contact.address?.city,
    contact.address?.state,
    contact.address?.country,
  ].filter(Boolean);
  const locationString = addressParts.join(", ");

  return (
    <PreviewPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Contact Preview"
    >
      <div className="flex flex-col h-full">
        {/* Contact Header */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
              {contact.avatarUrl && (
                <AvatarImage src={contact.avatarUrl} alt={fullName} />
              )}
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-xl font-semibold truncate">{fullName}</h2>
              {contact.title && (
                <p className="text-sm text-muted-foreground">{contact.title}</p>
              )}
              {contact.company && (
                <Link
                  href={`/companies/${contact.company._id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {contact.company.name}
                </Link>
              )}
            </div>
          </div>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Contact Actions */}
        <div className="grid grid-cols-3 gap-2 px-6 py-4">
          {contact.email && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Email</span>
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`tel:${contact.phone}`}>
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Call</span>
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Message</span>
          </Button>
        </div>

        <Separator />

        {/* Contact Details */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          <PreviewSection title="Contact Information">
            <div className="space-y-2">
              {contact.email && (
                <PreviewRow
                  label="Email"
                  value={contact.email}
                  icon={<Mail className="h-4 w-4" />}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.phone && (
                <PreviewRow
                  label="Phone"
                  value={contact.phone}
                  icon={<Phone className="h-4 w-4" />}
                  href={`tel:${contact.phone}`}
                />
              )}
              {locationString && (
                <PreviewRow
                  label="Location"
                  value={locationString}
                  icon={<MapPin className="h-4 w-4" />}
                />
              )}
            </div>
          </PreviewSection>

          {/* Social Links */}
          {(contact.linkedinUrl || contact.twitterHandle) && (
            <PreviewSection title="Social">
              <div className="flex gap-2">
                {contact.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 text-[#0077B5]" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {contact.twitterHandle && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://twitter.com/${contact.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                      @{contact.twitterHandle}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </PreviewSection>
          )}

          {/* Company Link */}
          {contact.company && (
            <PreviewSection title="Company">
              <Link
                href={`/companies/${contact.company._id}`}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {contact.company.logoUrl ? (
                    <img
                      src={contact.company.logoUrl}
                      alt={contact.company.name}
                      className="h-6 w-6 rounded"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{contact.company.name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </PreviewSection>
          )}

          {/* Metadata */}
          <PreviewSection title="Details">
            <div className="space-y-2 text-sm">
              {contact.source && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium">{contact.source}</span>
                </div>
              )}
              {contact.owner && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">
                    {[contact.owner.firstName, contact.owner.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
              )}
              {contact.lastActivityAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(contact.lastActivityAt)}
                  </span>
                </div>
              )}
            </div>
          </PreviewSection>
        </div>

        {/* Footer Actions */}
        <PreviewActions>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/contacts/${contact._id}`}>
              View Full Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </PreviewActions>
      </div>
    </PreviewPanel>
  );
}

export default ContactPreview;
