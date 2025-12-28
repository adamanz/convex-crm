"use client";

import * as React from "react";
import { Mail, Paperclip, Star, StarOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

export interface EmailPreviewData {
  id: string;
  from: {
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  subject: string;
  preview: string;
  sentAt: number;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  labels?: string[];
}

export interface EmailPreviewProps {
  /** Email data to display */
  email: EmailPreviewData;
  /** Whether this email is selected */
  isSelected?: boolean;
  /** Callback when the email is clicked */
  onClick?: () => void;
  /** Callback when star is toggled */
  onToggleStar?: (id: string) => void;
  /** Additional class name */
  className?: string;
}

export function EmailPreview({
  email,
  isSelected = false,
  onClick,
  onToggleStar,
  className,
}: EmailPreviewProps) {
  const initials = getInitials(
    email.from.name?.split(" ")[0],
    email.from.name?.split(" ")[1]
  );

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar?.(email.id);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer border-l-2",
        isSelected
          ? "border-l-primary bg-accent/50"
          : "border-l-transparent hover:bg-muted/50",
        !email.isRead && "bg-accent/30",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-9 w-9 shrink-0">
            {email.from.avatarUrl && (
              <AvatarImage src={email.from.avatarUrl} alt={email.from.name} />
            )}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className={cn(
                  "text-sm truncate",
                  !email.isRead && "font-semibold"
                )}
              >
                {email.from.name || email.from.email}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(email.sentAt)}
              </span>
            </div>

            {/* Subject */}
            <p
              className={cn(
                "text-sm truncate",
                !email.isRead ? "font-medium" : "text-muted-foreground"
              )}
            >
              {email.subject}
            </p>

            {/* Preview */}
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {email.preview}
            </p>

            {/* Footer Row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                {email.labels?.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {label}
                  </Badge>
                ))}
                {email.hasAttachments && (
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              <button
                type="button"
                onClick={handleStarClick}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                {email.isStarred ? (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground hover:text-amber-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailPreviewSkeleton() {
  return (
    <Card className="border-l-2 border-l-transparent">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailPreview;
