"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Plus,
  Workflow,
  Play,
  Pause,
  Trash2,
  Copy,
  MoreHorizontal,
  Loader2,
  Power,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowRight,
  MessageSquare,
  Mail,
  ListTodo,
  GitBranch,
  Brain,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type TriggerType = "manual" | "deal_stage_change" | "new_contact" | "inbound_message" | "scheduled";
type StepType = "send_message" | "send_email" | "create_task" | "wait" | "condition" | "ai_action";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: "Manual",
  deal_stage_change: "Deal Stage Change",
  new_contact: "New Contact",
  inbound_message: "Inbound Message",
  scheduled: "Scheduled",
};

const STEP_ICONS: Record<StepType, any> = {
  send_message: MessageSquare,
  send_email: Mail,
  create_task: ListTodo,
  wait: Clock,
  condition: GitBranch,
  ai_action: Brain,
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [filterTrigger, setFilterTrigger] = useState<TriggerType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"active" | "inactive" | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<Id<"workflows"> | null>(null);

  // Fetch workflows with stats
  const workflowsData = useQuery(api.workflowEngine.listWorkflows, {
    triggerType: filterTrigger !== "all" ? filterTrigger : undefined,
    isActive: filterStatus !== "all" ? filterStatus === "active" : undefined,
  });

  // Mutations
  const updateWorkflow = useMutation(api.workflowEngine.updateWorkflow);
  const deleteWorkflow = useMutation(api.workflowEngine.deleteWorkflow);
  const createWorkflow = useMutation(api.workflowEngine.createWorkflow);

  const workflows = useMemo(() => {
    if (!workflowsData) return [];
    return workflowsData;
  }, [workflowsData]);

  const handleToggleActive = async (id: Id<"workflows">, currentStatus: boolean) => {
    try {
      await updateWorkflow({
        id,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Workflow deactivated" : "Workflow activated");
    } catch (error) {
      toast.error("Failed to update workflow");
    }
  };

  const handleDuplicate = async (workflow: any) => {
    try {
      await createWorkflow({
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        triggerType: workflow.triggerType,
        triggerConfig: workflow.triggerConfig,
        steps: workflow.steps,
        isActive: false,
      });
      toast.success("Workflow duplicated");
    } catch (error) {
      toast.error("Failed to duplicate workflow");
    }
  };

  const handleDelete = async () => {
    if (!deleteWorkflowId) return;

    try {
      await deleteWorkflow({ id: deleteWorkflowId });
      toast.success("Workflow deleted");
      setDeleteWorkflowId(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete workflow");
    }
  };

  const isLoading = workflowsData === undefined;
  const hasActiveFilters = filterTrigger !== "all" || filterStatus !== "all";

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Workflows
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automate your sales processes with intelligent workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterTrigger} onValueChange={(value) => setFilterTrigger(value as any)}>
          <SelectTrigger className="w-[180px]">
            <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Triggers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-400" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setFilterTrigger("all");
              setFilterStatus("all");
            }}
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {workflows.length} {workflows.length === 1 ? "workflow" : "workflows"}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workflows"
          value={workflows.length.toString()}
          icon={Workflow}
          description={`${workflows.filter((w) => w.isActive).length} active`}
        />
        <StatCard
          title="Active Runs"
          value={workflows.reduce((sum, w) => sum + w.activeRuns, 0).toString()}
          icon={Play}
          description="Currently executing"
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Completed Runs"
          value={workflows.reduce((sum, w) => sum + w.completedRuns, 0).toString()}
          icon={CheckCircle2}
          description="Successfully finished"
          iconColor="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Failed Runs"
          value={workflows.reduce((sum, w) => sum + w.failedRuns, 0).toString()}
          icon={XCircle}
          description="Need attention"
          iconColor="text-red-600 dark:text-red-400"
          bgColor="bg-red-100 dark:bg-red-900/30"
        />
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
            <Workflow className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No workflows yet
          </h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Create your first workflow to automate your sales processes
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow._id}
              workflow={workflow}
              onToggleActive={handleToggleActive}
              onDuplicate={handleDuplicate}
              onDelete={(id) => setDeleteWorkflowId(id)}
            />
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={createWorkflow}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone. Active
              runs must be cancelled first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWorkflowId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  iconColor?: string;
  bgColor?: string;
}

function StatCard({ title, value, icon: Icon, description, iconColor, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
          </div>
          <div className={cn("rounded-full p-2", bgColor || "bg-zinc-100 dark:bg-zinc-800")}>
            <Icon className={cn("h-5 w-5", iconColor || "text-zinc-600 dark:text-zinc-400")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Card Component
interface WorkflowCardProps {
  workflow: any;
  onToggleActive: (id: Id<"workflows">, currentStatus: boolean) => void;
  onDuplicate: (workflow: any) => void;
  onDelete: (id: Id<"workflows">) => void;
}

function WorkflowCard({ workflow, onToggleActive, onDuplicate, onDelete }: WorkflowCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        !workflow.isActive && "opacity-60"
      )}
      onClick={() => router.push(`/workflows/${workflow._id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{workflow.name}</CardTitle>
              <Badge
                variant={workflow.isActive ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  workflow.isActive &&
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}
              >
                {workflow.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2 text-xs">
              {workflow.description || "No description"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(workflow._id, workflow.isActive);
                }}
              >
                <Power className="mr-2 h-4 w-4" />
                {workflow.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(workflow);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workflow._id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Trigger */}
        <div className="flex items-center gap-2 text-xs">
          <Zap className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-600 dark:text-zinc-400">
            Trigger: {TRIGGER_LABELS[workflow.triggerType as TriggerType]}
          </span>
        </div>

        {/* Steps Preview */}
        <div className="flex items-center gap-1.5">
          {workflow.steps.slice(0, 4).map((step: any, index: number) => {
            const Icon = STEP_ICONS[step.type as StepType];
            return (
              <div key={step.id} className="flex items-center gap-1">
                <div className="rounded-md bg-zinc-100 p-1.5 dark:bg-zinc-800">
                  <Icon className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                </div>
                {index < Math.min(3, workflow.steps.length - 1) && (
                  <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />
                )}
              </div>
            );
          })}
          {workflow.steps.length > 4 && (
            <Badge variant="outline" className="ml-1 text-xs">
              +{workflow.steps.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {workflow.activeRuns}
            </div>
            <div className="text-[10px] text-zinc-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {workflow.completedRuns}
            </div>
            <div className="text-[10px] text-zinc-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-red-600 dark:text-red-400">
              {workflow.failedRuns}
            </div>
            <div className="text-[10px] text-zinc-500">Failed</div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-[10px] text-zinc-400 pt-1">
          Updated {formatRelativeTime(workflow.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

// Create Workflow Dialog Component
interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => Promise<any>;
}

function CreateWorkflowDialog({ open, onOpenChange, onCreate }: CreateWorkflowDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("manual");
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        steps: [],
        isActive,
      });
      toast.success("Workflow created successfully");
      onOpenChange(false);
      // Reset form
      setName("");
      setDescription("");
      setTriggerType("manual");
      setIsActive(false);
    } catch (error) {
      toast.error("Failed to create workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Create a new workflow to automate your sales processes. You can add steps after
            creation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              placeholder="e.g., Welcome New Contacts"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this workflow does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Type</Label>
            <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
              <SelectTrigger id="trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="active" className="text-sm font-medium">
                Activate immediately
              </Label>
              <p className="text-xs text-muted-foreground">
                Start running this workflow as soon as it's created
              </p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
