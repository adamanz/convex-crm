"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  ListTodo,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface CallSummaryProps {
  summary: string | null;
  topics?: string[];
  actionItems?: string[];
  analysisStatus?: "pending" | "processing" | "completed" | "failed";
  analysisError?: string;
  onRequestAnalysis?: () => void;
  className?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export function CallSummary({
  summary,
  topics,
  actionItems,
  analysisStatus,
  analysisError,
  onRequestAnalysis,
  className,
}: CallSummaryProps) {
  // Loading state
  if (analysisStatus === "processing") {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            Analyzing call recording...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generating summary, topics, and action items
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (analysisStatus === "failed") {
    return (
      <Card className={cn("border-destructive/20", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-sm text-destructive font-medium">
            Analysis failed
          </p>
          {analysisError && (
            <p className="text-xs text-muted-foreground mt-1">{analysisError}</p>
          )}
          {onRequestAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestAnalysis}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Pending state - no analysis yet
  if (analysisStatus === "pending" || (!summary && !topics?.length && !actionItems?.length)) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-8 w-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No analysis available yet
          </p>
          {onRequestAnalysis && (
            <Button
              variant="default"
              size="sm"
              onClick={onRequestAnalysis}
              className="mt-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Summary
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Call Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Topics */}
      {topics && topics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              Topics Discussed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {actionItems && actionItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4 text-primary" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionItems.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Regenerate button */}
      {onRequestAnalysis && analysisStatus === "completed" && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestAnalysis}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Analysis
          </Button>
        </div>
      )}
    </div>
  );
}

export default CallSummary;
