"use client";

import * as React from "react";
import { Plus, Search, Filter, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { FullPageSpinner } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { WorkflowCard, type WorkflowData } from "./WorkflowCard";
import { type TriggerType } from "./TriggerSelector";

interface WorkflowListProps {
  workflows: WorkflowData[] | undefined;
  isLoading?: boolean;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function WorkflowList({
  workflows,
  isLoading,
  onCreateNew,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  className,
}: WorkflowListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [triggerFilter, setTriggerFilter] = React.useState<TriggerType | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");

  // Filter workflows
  const filteredWorkflows = React.useMemo(() => {
    if (!workflows) return [];

    return workflows.filter((workflow) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = workflow.name.toLowerCase().includes(query);
        const matchesDescription = workflow.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Trigger filter
      if (triggerFilter !== "all" && workflow.triggerType !== triggerFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && !workflow.isActive) return false;
      if (statusFilter === "inactive" && workflow.isActive) return false;

      return true;
    });
  }, [workflows, searchQuery, triggerFilter, statusFilter]);

  // Group workflows by status
  const activeWorkflows = filteredWorkflows.filter((w) => w.isActive);
  const inactiveWorkflows = filteredWorkflows.filter((w) => !w.isActive);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <PageHeader
        title="Workflows"
        description="Automate your sales processes with custom workflows"
        actions={
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        }
        className="mb-6"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={triggerFilter}
          onValueChange={(value) => setTriggerFilter(value as TriggerType | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="new_contact">New Contact</SelectItem>
            <SelectItem value="deal_stage_change">Deal Stage Change</SelectItem>
            <SelectItem value="inbound_message">Inbound Message</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | "active" | "inactive")
          }
        >
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {!workflows || workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          description="Create your first workflow to automate your sales process"
          actionLabel="Create Workflow"
          onAction={onCreateNew}
        />
      ) : filteredWorkflows.length === 0 ? (
        <EmptyState
          variant="search"
          title="No matching workflows"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-8">
          {/* Active Workflows */}
          {activeWorkflows.length > 0 && (
            <WorkflowSection
              title="Active Workflows"
              count={activeWorkflows.length}
              workflows={activeWorkflows}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )}

          {/* Inactive Workflows */}
          {inactiveWorkflows.length > 0 && (
            <WorkflowSection
              title="Inactive Workflows"
              count={inactiveWorkflows.length}
              workflows={inactiveWorkflows}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Section component for grouping workflows
interface WorkflowSectionProps {
  title: string;
  count: number;
  workflows: WorkflowData[];
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function WorkflowSection({
  title,
  count,
  workflows,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
}: WorkflowSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow._id}
            workflow={workflow}
            onClick={() => onEdit(workflow._id)}
            onEdit={() => onEdit(workflow._id)}
            onToggleActive={() =>
              onToggleActive(workflow._id, !workflow.isActive)
            }
            onDuplicate={() => onDuplicate(workflow._id)}
            onDelete={() => onDelete(workflow._id)}
          />
        ))}
      </div>
    </div>
  );
}

// Loading state component if not imported
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
