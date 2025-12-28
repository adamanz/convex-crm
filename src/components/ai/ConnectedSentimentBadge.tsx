"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SentimentBadge, SentimentIndicator } from "./SentimentBadge";

interface ConnectedSentimentBadgeProps {
  activityId: Id<"activities">;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Connected SentimentBadge component that fetches sentiment from activity
 */
export function ConnectedSentimentBadge({
  activityId,
  showDetails = false,
  size = "md",
  className,
}: ConnectedSentimentBadgeProps) {
  const activity = useQuery(api.activities.get, { id: activityId });

  if (!activity) {
    return null;
  }

  // Parse sentiment from activity
  const sentiment =
    (activity.sentiment as "positive" | "neutral" | "negative" | "mixed") ??
    "neutral";

  return (
    <SentimentBadge
      sentiment={sentiment}
      showDetails={showDetails}
      size={size}
      className={className}
    />
  );
}

interface ConnectedSentimentIndicatorProps {
  activityId: Id<"activities">;
  className?: string;
}

/**
 * Connected SentimentIndicator component (compact version)
 */
export function ConnectedSentimentIndicator({
  activityId,
  className,
}: ConnectedSentimentIndicatorProps) {
  const activity = useQuery(api.activities.get, { id: activityId });

  if (!activity) {
    return null;
  }

  const sentiment =
    (activity.sentiment as "positive" | "neutral" | "negative" | "mixed") ??
    "neutral";

  return <SentimentIndicator sentiment={sentiment} className={className} />;
}
