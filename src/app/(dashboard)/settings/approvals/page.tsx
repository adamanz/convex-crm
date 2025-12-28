"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ApprovalRuleList } from "@/components/approvals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Clock, CheckCircle2 } from "lucide-react";

export default function ApprovalsSettingsPage() {
  const dealRules = useQuery(api.approvals.listRules, { entityType: "deal", activeOnly: false });
  const quoteRules = useQuery(api.approvals.listRules, { entityType: "quote", activeOnly: false });
  const pendingRequests = useQuery(api.approvals.listRequests, { status: "pending" });

  const activeDealRules = dealRules?.filter((r) => r.isActive).length ?? 0;
  const activeQuoteRules = quoteRules?.filter((r) => r.isActive).length ?? 0;
  const pendingCount = pendingRequests?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Approval Workflows
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure approval rules for quotes and deals that meet specific conditions.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDealRules}</p>
                <p className="text-sm text-muted-foreground">Active Deal Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeQuoteRules}</p>
                <p className="text-sm text-muted-foreground">Active Quote Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Management */}
      <Tabs defaultValue="deal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deal" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Deal Rules
            {activeDealRules > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeDealRules}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quote" className="gap-2">
            <FileText className="h-4 w-4" />
            Quote Rules
            {activeQuoteRules > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeQuoteRules}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deal">
          <ApprovalRuleList entityType="deal" />
        </TabsContent>

        <TabsContent value="quote">
          <ApprovalRuleList entityType="quote" />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Approval Workflows Work</CardTitle>
          <CardDescription>
            Learn how to set up and use approval workflows effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                  1
                </div>
                <h4 className="font-medium">Create Rules</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Define conditions that trigger approval requirements, such as deal
                amounts exceeding a threshold.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                  2
                </div>
                <h4 className="font-medium">Assign Approvers</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose who can approve requests. Use &quot;Any&quot; for quick
                approvals, &quot;All&quot; for consensus, or &quot;Sequential&quot; for
                hierarchical review.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                  3
                </div>
                <h4 className="font-medium">Review &amp; Approve</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Approvers receive notifications and can approve or reject requests
                directly from the entity page or notification panel.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 mt-4">
            <h4 className="font-medium mb-2">Approval Types Explained</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Any One Approver:</strong> The request is approved as soon
                  as any single approver grants approval.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>All Approvers:</strong> Every designated approver must grant
                  approval. The request is rejected if any one rejects.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Sequential:</strong> Approvers must approve in order. The
                  next approver is only notified after the previous one approves.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
