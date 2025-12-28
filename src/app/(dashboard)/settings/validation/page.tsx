"use client";

import { useState } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  AlertTriangle,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import {
  ValidationRuleList,
  ValidationRuleForm,
  ViolationList,
} from "@/components/validation";

type ViewMode = "list" | "create" | "edit" | "violations";

export default function ValidationSettingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRuleId, setSelectedRuleId] = useState<Id<"validationRules"> | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<"contact" | "company" | "deal">("contact");

  const handleCreateRule = () => {
    setSelectedRuleId(null);
    setViewMode("create");
  };

  const handleEditRule = (ruleId: Id<"validationRules">) => {
    setSelectedRuleId(ruleId);
    setViewMode("edit");
  };

  const handleViewViolations = (ruleId: Id<"validationRules">) => {
    setSelectedRuleId(ruleId);
    setViewMode("violations");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedRuleId(null);
  };

  const handleSave = () => {
    setViewMode("list");
    setSelectedRuleId(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        {viewMode !== "list" && (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {viewMode === "list" && "Data Validation"}
            {viewMode === "create" && "Create Validation Rule"}
            {viewMode === "edit" && "Edit Validation Rule"}
            {viewMode === "violations" && "Validation Violations"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {viewMode === "list" && "Define validation rules to ensure data quality across your CRM."}
            {viewMode === "create" && "Create a new rule to validate entity data."}
            {viewMode === "edit" && "Update the validation rule configuration."}
            {viewMode === "violations" && "View entities that fail validation rules."}
          </p>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "list" && (
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Validation Rules
            </TabsTrigger>
            <TabsTrigger value="violations" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <ValidationRuleList
              onCreateRule={handleCreateRule}
              onEditRule={handleEditRule}
              onViewViolations={handleViewViolations}
            />
          </TabsContent>

          <TabsContent value="violations" className="mt-6">
            <ViolationList />
          </TabsContent>
        </Tabs>
      )}

      {viewMode === "create" && (
        <ValidationRuleForm onSave={handleSave} onCancel={handleBack} />
      )}

      {viewMode === "edit" && selectedRuleId && (
        <ValidationRuleForm
          ruleId={selectedRuleId}
          onSave={handleSave}
          onCancel={handleBack}
        />
      )}

      {viewMode === "violations" && selectedRuleId && (
        <ViolationList ruleId={selectedRuleId} onClose={handleBack} />
      )}

      {/* Quick Tips */}
      {viewMode === "list" && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <ShieldCheck className="h-5 w-5" />
              Data Quality Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-900/60">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100">
                  Required Fields
                </h4>
                <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                  Ensure critical fields like email and name are always filled in.
                </p>
              </div>
              <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-900/60">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100">
                  Format Validation
                </h4>
                <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                  Validate email addresses, phone numbers, and URLs are properly formatted.
                </p>
              </div>
              <div className="rounded-lg bg-white/60 p-4 dark:bg-zinc-900/60">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100">
                  Unique Values
                </h4>
                <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                  Prevent duplicate emails or company domains in your database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
