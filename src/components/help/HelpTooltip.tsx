"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface HelpTooltipProps {
  content: string;
  articleSlug?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  articleSlug,
  side = "top",
  align = "center",
  className,
  iconClassName,
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5",
              "text-muted-foreground hover:text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "transition-colors",
              className
            )}
            aria-label="Help"
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          <p className="text-sm">{content}</p>
          {articleSlug && (
            <Link
              href={`/help/${articleSlug}`}
              className="mt-2 block text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              Learn more
            </Link>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Contextual help for specific features
interface ContextualHelpProps {
  feature:
    | "deals-pipeline"
    | "contacts-import"
    | "email-templates"
    | "workflows"
    | "custom-fields"
    | "territories"
    | "calendar-sync"
    | "ai-enrichment"
    | "quotes"
    | "integrations";
  className?: string;
}

const featureHelp: Record<
  ContextualHelpProps["feature"],
  { content: string; articleSlug?: string }
> = {
  "deals-pipeline": {
    content:
      "Drag and drop deals between stages to update their status. Click on a deal to view details and activities.",
    articleSlug: "managing-deals",
  },
  "contacts-import": {
    content:
      "Import contacts from a CSV file. Make sure your file has headers matching the required fields.",
    articleSlug: "importing-contacts",
  },
  "email-templates": {
    content:
      "Create reusable email templates with variables like {{firstName}} that get replaced when sending.",
    articleSlug: "email-templates",
  },
  workflows: {
    content:
      "Automate repetitive tasks by creating workflows that trigger based on events like new contacts or deal stage changes.",
    articleSlug: "automation-workflows",
  },
  "custom-fields": {
    content:
      "Add custom fields to contacts, companies, and deals to track information specific to your business.",
    articleSlug: "custom-fields",
  },
  territories: {
    content:
      "Organize your sales team by geographic or industry territories to ensure proper lead routing.",
    articleSlug: "sales-territories",
  },
  "calendar-sync": {
    content:
      "Connect your Google or Outlook calendar to sync meetings and schedule activities directly from the CRM.",
    articleSlug: "calendar-integration",
  },
  "ai-enrichment": {
    content:
      "Automatically enrich contact and company data using AI-powered data providers to get more insights.",
    articleSlug: "ai-enrichment",
  },
  quotes: {
    content:
      "Create and send professional quotes to your prospects. Track quote status and get notified when they're viewed.",
    articleSlug: "creating-quotes",
  },
  integrations: {
    content:
      "Connect third-party services like Salesforce, Sendblue, and more to sync data automatically.",
    articleSlug: "integrations",
  },
};

export function ContextualHelp({ feature, className }: ContextualHelpProps) {
  const help = featureHelp[feature];

  return (
    <HelpTooltip
      content={help.content}
      articleSlug={help.articleSlug}
      className={className}
    />
  );
}
