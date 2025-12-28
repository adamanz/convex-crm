"use client";

import * as React from "react";
import { Mail, Phone, Building2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import type { ContactWithCompany } from "@/types/contacts";

interface ContactCardProps {
  contact: ContactWithCompany;
  onClick?: () => void;
  className?: string;
}

export function ContactCard({ contact, onClick, className }: ContactCardProps) {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = getInitials(contact.firstName, contact.lastName);

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            {contact.avatarUrl && (
              <AvatarImage src={contact.avatarUrl} alt={fullName} />
            )}
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            {/* Name and Title */}
            <div className="mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {fullName}
              </h3>
              {(contact.title || contact.company) && (
                <p className="text-sm text-muted-foreground truncate">
                  {contact.title}
                  {contact.title && contact.company && " at "}
                  {contact.company?.name}
                </p>
              )}
            </div>

            {/* Contact Details */}
            <div className="space-y-1.5">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary" />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-primary" />
                  <span>{contact.phone}</span>
                </a>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="truncate">{contact.company.name}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {contact.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
                {contact.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{contact.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Last Activity */}
            {contact.lastActivityAt && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last activity {formatRelativeTime(contact.lastActivityAt)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactCard;
