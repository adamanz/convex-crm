"use client";

import { LeaderboardDashboard } from "@/components/leaderboards";

export default function LeaderboardsPage() {
  // In a real app, you'd get the current user ID from auth context
  // For now, we'll pass undefined and let the component handle it
  return <LeaderboardDashboard />;
}
