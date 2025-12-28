"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Key,
  Hash,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface KeyPhrasesPanelProps {
  keyPhrases: string[] | null;
  onPhraseClick?: (phrase: string) => void;
  maxVisible?: number;
  className?: string;
}

// =============================================================================
// Helper: Categorize phrases
// =============================================================================

type PhraseCategory = "person" | "organization" | "product" | "date" | "money" | "other";

function categorizePhrase(phrase: string): PhraseCategory {
  // Simple heuristics - in production, use NER
  const lowered = phrase.toLowerCase();

  // Money patterns
  if (/\$[\d,]+|[\d,]+\s*(dollars?|usd|euros?|pounds?)/i.test(phrase)) {
    return "money";
  }

  // Date patterns
  if (
    /\d{1,2}\/\d{1,2}|\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday/i.test(
      phrase
    )
  ) {
    return "date";
  }

  // Organization indicators
  if (
    /(inc|corp|llc|ltd|company|organization|team|department)\b/i.test(phrase)
  ) {
    return "organization";
  }

  // Product indicators
  if (
    /(product|platform|software|app|service|feature|tool|system)\b/i.test(phrase)
  ) {
    return "product";
  }

  // Capitalized words often indicate names
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(phrase)) {
    return "person";
  }

  return "other";
}

const categoryConfig: Record<PhraseCategory, { color: string; icon: React.ReactNode }> = {
  person: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: null,
  },
  organization: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: null,
  },
  product: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: null,
  },
  date: {
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    icon: null,
  },
  money: {
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    icon: null,
  },
  other: {
    color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
    icon: null,
  },
};

// =============================================================================
// Phrase Badge Component
// =============================================================================

interface PhraseBadgeProps {
  phrase: string;
  onClick?: () => void;
}

function PhraseBadge({ phrase, onClick }: PhraseBadgeProps) {
  const category = categorizePhrase(phrase);
  const config = categoryConfig[category];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              config.color,
              onClick && "hover:ring-2 hover:ring-primary/30"
            )}
            onClick={onClick}
          >
            <Hash className="h-3 w-3 mr-1 opacity-50" />
            {phrase}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Click to search in transcription
            {category !== "other" && (
              <span className="block text-muted-foreground mt-0.5">
                Category: {category}
              </span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function KeyPhrasesPanel({
  keyPhrases,
  onPhraseClick,
  maxVisible = 10,
  className,
}: KeyPhrasesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // No phrases
  if (!keyPhrases || keyPhrases.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Key className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No key phrases extracted
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedPhrases = isExpanded
    ? keyPhrases
    : keyPhrases.slice(0, maxVisible);
  const hasMore = keyPhrases.length > maxVisible;

  // Group phrases by category for display
  const groupedPhrases = displayedPhrases.reduce(
    (acc, phrase) => {
      const category = categorizePhrase(phrase);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(phrase);
      return acc;
    },
    {} as Record<PhraseCategory, string[]>
  );

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Key Phrases
          </span>
          <Badge variant="outline" className="font-normal">
            {keyPhrases.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* All phrases in a flowing layout */}
        <div className="flex flex-wrap gap-2">
          {displayedPhrases.map((phrase, index) => (
            <PhraseBadge
              key={index}
              phrase={phrase}
              onClick={() => onPhraseClick?.(phrase)}
            />
          ))}
        </div>

        {/* Expand/collapse button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show {keyPhrases.length - maxVisible} More
              </>
            )}
          </Button>
        )}

        {/* Category legend */}
        {keyPhrases.length > 3 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Categories:</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(groupedPhrases) as PhraseCategory[]).map(
                (category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className={cn("text-xs", categoryConfig[category].color)}
                  >
                    {category}: {groupedPhrases[category].length}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KeyPhrasesPanel;
