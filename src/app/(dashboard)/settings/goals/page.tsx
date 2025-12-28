"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalList, GoalDashboard } from "@/components/goals";
import { Target, BarChart3 } from "lucide-react";

export default function GoalsSettingsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Goals & Quotas
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Set targets and track progress for your sales team
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Manage Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GoalDashboard />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <GoalList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
