"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { useActivitySuggestions } from "@/hooks/useAI";
import { ActivitySuggestion } from "./ActivitySuggestion";

interface ConnectedActivitySuggestionProps {
  contactId: Id<"contacts">;
  contactName?: string;
  onAccept?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Connected ActivitySuggestion component that fetches AI-generated suggestions
 */
export function ConnectedActivitySuggestion({
  contactId,
  contactName,
  onAccept,
  onDismiss,
  onViewAll,
  className,
}: ConnectedActivitySuggestionProps) {
  const { suggestions, isLoading } = useActivitySuggestions(contactId);

  // Show skeleton or loading state if needed
  if (isLoading) {
    return (
      <ActivitySuggestion
        suggestions={[]}
        entityName={contactName}
        className={className}
      />
    );
  }

  return (
    <ActivitySuggestion
      suggestions={suggestions}
      entityName={contactName}
      onAccept={onAccept}
      onDismiss={onDismiss}
      onViewAll={onViewAll}
      className={className}
    />
  );
}
