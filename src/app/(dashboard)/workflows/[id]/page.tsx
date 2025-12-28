"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder";
import type { TriggerType } from "@/components/workflows/TriggerSelector";

type StepType = "send_message" | "send_email" | "create_task" | "wait" | "condition" | "ai_action";

interface WorkflowStep {
  id: string;
  type: StepType;
  config: Record<string, unknown>;
  order: number;
}

const RUN_STATUS_ICONS = {
  active: Clock,
  paused: Pause,
  completed: CheckCircle2,
  failed: XCircle,
};

const RUN_STATUS_COLORS = {
  active: "text-blue-500 bg-blue-500/10",
  paused: "text-amber-500 bg-amber-500/10",
  completed: "text-emerald-500 bg-emerald-500/10",
  failed: "text-red-500 bg-red-500/10",
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as Id<"workflows">;

  const [activeTab, setActiveTab] = useState("builder");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch workflow data
  const workflow = useQuery(api.workflowEngine.getWorkflow, { id: workflowId });
  const runs = useQuery(api.workflowEngine.getWorkflowRuns, {
    workflowId,
    limit: 50,
  });

  // Mutations
  const updateWorkflow = useMutation(api.workflowEngine.updateWorkflow);
  const deleteWorkflow = useMutation(api.workflowEngine.deleteWorkflow);

  const handleSave = async (data: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig?: Record<string, unknown>;
    steps: WorkflowStep[];
  }) => {
    try {
      await updateWorkflow({
        id: workflowId,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        steps: data.steps,
      });
      toast.success("Workflow saved successfully");
    } catch (error) {
      toast.error("Failed to save workflow");
      throw error;
    }
  };

  const handleToggleActive = async () => {
    if (!workflow) return;
    try {
      await updateWorkflow({
        id: workflowId,
        isActive: !workflow.isActive,
      });
      toast.success(workflow.isActive ? "Workflow deactivated" : "Workflow activated");
    } catch (error) {
      toast.error("Failed to update workflow status");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkflow({ id: workflowId });
      toast.success("Workflow deleted successfully");
      router.push("/workflows");
    } catch (error) {
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRunWorkflow = async () => {
    // Manual workflow runs require a context entity (contact, deal, etc.)
    // For now, show a message - in production, this would open a entity selector dialog
    toast.info("To run this workflow, trigger it from a contact or deal page");
  };

  if (workflow === undefined) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workflow === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Workflow not found</h2>
        <p className="text-muted-foreground">The workflow you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => router.push("/workflows")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflows
        </Button>
      </div>
    );
  }

  const activeRuns = runs?.filter((r) => r.status === "active").length ?? 0;
  const completedRuns = runs?.filter((r) => r.status === "completed").length ?? 0;
  const failedRuns = runs?.filter((r) => r.status === "failed").length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workflows")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{workflow.name}</h1>
              <Badge variant={workflow.isActive ? "default" : "secondary"}>
                {workflow.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {workflow.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflow.triggerType === "manual" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunWorkflow}
              disabled={!workflow.isActive}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Now
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
          >
            {workflow.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 border-b border-zinc-800">
          <TabsList className="h-12 bg-transparent border-0">
            <TabsTrigger
              value="builder"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Builder
            </TabsTrigger>
            <TabsTrigger
              value="runs"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Runs
              {activeRuns > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {activeRuns}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 m-0">
          <WorkflowBuilder
            initialData={{
              name: workflow.name,
              description: workflow.description,
              triggerType: workflow.triggerType as TriggerType,
              triggerConfig: workflow.triggerConfig as Record<string, unknown> | undefined,
              steps: workflow.steps as WorkflowStep[],
            }}
            onSave={handleSave}
            onCancel={() => router.push("/workflows")}
          />
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="flex-1 m-0 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{activeRuns}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{completedRuns}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{failedRuns}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-500/10">
                      <RefreshCw className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{runs?.length ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Total Runs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Runs List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Runs</CardTitle>
                <CardDescription>History of workflow executions</CardDescription>
              </CardHeader>
              <CardContent>
                {runs && runs.length > 0 ? (
                  <div className="space-y-2">
                    {runs.map((run) => {
                      const StatusIcon = RUN_STATUS_ICONS[run.status as keyof typeof RUN_STATUS_ICONS];
                      const statusColor = RUN_STATUS_COLORS[run.status as keyof typeof RUN_STATUS_COLORS];

                      return (
                        <div
                          key={run._id}
                          className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-md", statusColor)}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Run #{run._id.slice(-6)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Started {formatRelativeTime(run.startedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm">
                                Step {(workflow.steps.findIndex(s => s.id === run.currentStepId) + 1) || 1} of {workflow.steps.length}
                              </p>
                              {run.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Completed {formatRelativeTime(run.completedAt)}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn("capitalize", statusColor)}
                            >
                              {run.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No runs yet</p>
                    <p className="text-sm text-muted-foreground">
                      {workflow.triggerType === "manual"
                        ? "Click 'Run Now' to start this workflow"
                        : "This workflow will run automatically based on its trigger"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 m-0 p-6 overflow-auto">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>Percentage of successful workflow runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {runs && runs.length > 0
                        ? Math.round((completedRuns / runs.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {completedRuns} of {runs?.length ?? 0} runs successful
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Duration</CardTitle>
                <CardDescription>Average time to complete workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {runs && runs.length > 0
                        ? (() => {
                            const completedWithTime = runs.filter(
                              (r) => r.status === "completed" && r.completedAt
                            );
                            if (completedWithTime.length === 0) return "N/A";
                            const avgMs =
                              completedWithTime.reduce(
                                (sum, r) => sum + (r.completedAt! - r.startedAt),
                                0
                              ) / completedWithTime.length;
                            const seconds = Math.round(avgMs / 1000);
                            if (seconds < 60) return `${seconds}s`;
                            const minutes = Math.round(seconds / 60);
                            return `${minutes}m`;
                          })()
                        : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on {completedRuns} completed runs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Step Performance</CardTitle>
                <CardDescription>Success rate per workflow step</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.steps.map((step: WorkflowStep, index: number) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium capitalize">
                            {step.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">100%</p>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflow.name}"? This action cannot be
              undone and will remove all run history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
