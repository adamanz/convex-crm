"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  User,
  Clock,
  Loader2,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

interface TranscriptionViewProps {
  transcription: string | null;
  segments?: TranscriptionSegment[];
  currentTime?: number;
  onSeekToTime?: (time: number) => void;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function highlightSearchTerm(text: string, term: string): React.ReactNode {
  if (!term || term.length < 2) return text;

  const parts = text.split(new RegExp(`(${term})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// =============================================================================
// Speaker Color Helper
// =============================================================================

const speakerColors: Record<string, string> = {};
const colorPalette = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
];

function getSpeakerColor(speaker: string): string {
  if (!speakerColors[speaker]) {
    const index = Object.keys(speakerColors).length % colorPalette.length;
    speakerColors[speaker] = colorPalette[index];
  }
  return speakerColors[speaker];
}

// =============================================================================
// Segment Item Component
// =============================================================================

interface SegmentItemProps {
  segment: TranscriptionSegment;
  isActive: boolean;
  searchTerm: string;
  onSeek: () => void;
}

function SegmentItem({ segment, isActive, searchTerm, onSeek }: SegmentItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isActive]);

  return (
    <div
      ref={ref}
      className={cn(
        "group flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-muted/50",
        isActive && "bg-primary/5 border border-primary/20"
      )}
      onClick={onSeek}
    >
      {/* Timestamp */}
      <button
        className={cn(
          "flex items-center gap-1 text-xs shrink-0",
          "text-muted-foreground group-hover:text-primary transition-colors",
          isActive && "text-primary"
        )}
      >
        <Clock className="h-3 w-3" />
        {formatTime(segment.start)}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Speaker badge */}
        {segment.speaker && (
          <Badge
            variant="secondary"
            className={cn("mb-1.5 text-xs", getSpeakerColor(segment.speaker))}
          >
            <User className="h-3 w-3 mr-1" />
            {segment.speaker}
          </Badge>
        )}

        {/* Text */}
        <p
          className={cn(
            "text-sm leading-relaxed",
            isActive && "font-medium"
          )}
        >
          {highlightSearchTerm(segment.text, searchTerm)}
        </p>

        {/* Confidence */}
        {segment.confidence !== undefined && segment.confidence < 0.8 && (
          <span className="text-xs text-muted-foreground mt-1 inline-block">
            ({Math.round(segment.confidence * 100)}% confidence)
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TranscriptionView({
  transcription,
  segments,
  currentTime = 0,
  onSeekToTime,
  status,
  error,
  className,
}: TranscriptionViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Find search results in segments
  useEffect(() => {
    if (!segments || searchTerm.length < 2) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    const results: number[] = [];
    segments.forEach((segment, index) => {
      if (segment.text.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(0);
  }, [searchTerm, segments]);

  // Navigate search results
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);

    if (segments && onSeekToTime) {
      onSeekToTime(segments[searchResults[nextIndex]].start);
    }
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex =
      (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);

    if (segments && onSeekToTime) {
      onSeekToTime(segments[searchResults[prevIndex]].start);
    }
  };

  // Copy full transcription
  const copyTranscription = async () => {
    const textToCopy = segments
      ? segments
          .map((s) => (s.speaker ? `${s.speaker}: ${s.text}` : s.text))
          .join("\n\n")
      : transcription || "";

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find active segment based on current time
  const activeSegmentIndex = segments?.findIndex(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  // Loading state
  if (status === "pending" || status === "processing") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-lg bg-muted/30",
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          {status === "pending"
            ? "Transcription pending..."
            : "Transcribing audio..."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This may take a few minutes
        </p>
      </div>
    );
  }

  // Error state
  if (status === "failed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 rounded-lg bg-destructive/5 border border-destructive/20",
          className
        )}
      >
        <p className="text-sm text-destructive font-medium">
          Transcription failed
        </p>
        {error && (
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        )}
      </div>
    );
  }

  // No transcription
  if (!transcription && (!segments || segments.length === 0)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 rounded-lg bg-muted/30 text-muted-foreground",
          className
        )}
      >
        No transcription available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with search and copy */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcription..."
            className="pl-9 pr-24"
          />
          {searchResults.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {currentResultIndex + 1}/{searchResults.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={goToPrevResult}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={goToNextResult}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyTranscription}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Transcription content */}
      <ScrollArea className="flex-1 mt-3">
        {segments && segments.length > 0 ? (
          <div className="space-y-1 pr-4">
            {segments.map((segment, index) => (
              <SegmentItem
                key={index}
                segment={segment}
                isActive={activeSegmentIndex === index}
                searchTerm={searchTerm}
                onSeek={() => onSeekToTime?.(segment.start)}
              />
            ))}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed pr-4">
            {highlightSearchTerm(transcription || "", searchTerm)}
          </div>
        )}
      </ScrollArea>

      {/* Speaker legend */}
      {segments && segments.some((s) => s.speaker) && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t">
          <span className="text-xs text-muted-foreground">Speakers:</span>
          {Array.from(new Set(segments.map((s) => s.speaker).filter(Boolean))).map(
            (speaker) => (
              <Badge
                key={speaker}
                variant="secondary"
                className={cn("text-xs", getSpeakerColor(speaker!))}
              >
                {speaker}
              </Badge>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default TranscriptionView;
