"use client";

import * as React from "react";
import { Plus, Search, Filter, SlidersHorizontal, MoreHorizontal, Play, Pause, Copy, Trash2, Users, TrendingUp } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SEQUENCE_STEP_CONFIGS } from "./SequenceStep";

export interface SequenceData {
  _id: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    type: "email" | "sms" | "call" | "wait" | "task";
    delayDays: number;
    delayHours: number;
  }>;
  isActive: boolean;
  enrollmentCount: number;
  completionRate?: number;
  createdAt: number;
  updatedAt: number;
  activeEnrollments?: number;
  totalEnrollments?: number;
  completedEnrollments?: number;
}

interface SequenceListProps {
  sequences: SequenceData[] | undefined;
  isLoading?: boolean;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onViewEnrollments: (id: string) => void;
  className?: string;
}

export function SequenceList({
  sequences,
  isLoading,
  onCreateNew,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  onViewEnrollments,
  className,
}: SequenceListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");

  // Filter sequences
  const filteredSequences = React.useMemo(() => {
    if (!sequences) return [];

    return sequences.filter((sequence) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = sequence.name.toLowerCase().includes(query);
        const matchesDescription = sequence.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Status filter
      if (statusFilter === "active" && !sequence.isActive) return false;
      if (statusFilter === "inactive" && sequence.isActive) return false;

      return true;
    });
  }, [sequences, searchQuery, statusFilter]);

  // Group sequences by status
  const activeSequences = filteredSequences.filter((s) => s.isActive);
  const inactiveSequences = filteredSequences.filter((s) => !s.isActive);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <PageHeader
        title="Sequences"
        description="Create multi-touch outreach cadences for your sales process"
        actions={
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Sequence
          </Button>
        }
        className="mb-6"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sequences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
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
      {!sequences || sequences.length === 0 ? (
        <EmptyState
          title="No sequences yet"
          description="Create your first sequence to automate your outreach"
          actionLabel="Create Sequence"
          onAction={onCreateNew}
        />
      ) : filteredSequences.length === 0 ? (
        <EmptyState
          variant="search"
          title="No matching sequences"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-8">
          {/* Active Sequences */}
          {activeSequences.length > 0 && (
            <SequenceSection
              title="Active Sequences"
              count={activeSequences.length}
              sequences={activeSequences}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onViewEnrollments={onViewEnrollments}
            />
          )}

          {/* Inactive Sequences */}
          {inactiveSequences.length > 0 && (
            <SequenceSection
              title="Inactive Sequences"
              count={inactiveSequences.length}
              sequences={inactiveSequences}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onViewEnrollments={onViewEnrollments}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Section component for grouping sequences
interface SequenceSectionProps {
  title: string;
  count: number;
  sequences: SequenceData[];
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onViewEnrollments: (id: string) => void;
}

function SequenceSection({
  title,
  count,
  sequences,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  onViewEnrollments,
}: SequenceSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sequences.map((sequence) => (
          <SequenceCard
            key={sequence._id}
            sequence={sequence}
            onEdit={() => onEdit(sequence._id)}
            onToggleActive={() => onToggleActive(sequence._id, !sequence.isActive)}
            onDuplicate={() => onDuplicate(sequence._id)}
            onDelete={() => onDelete(sequence._id)}
            onViewEnrollments={() => onViewEnrollments(sequence._id)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual sequence card
interface SequenceCardProps {
  sequence: SequenceData;
  onEdit: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onViewEnrollments: () => void;
}

function SequenceCard({
  sequence,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  onViewEnrollments,
}: SequenceCardProps) {
  // Calculate step type counts
  const stepTypeCounts = sequence.steps.reduce(
    (acc, step) => {
      acc[step.type] = (acc[step.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate total duration
  const totalHours = sequence.steps.reduce((acc, step) => {
    return acc + (step.delayDays * 24) + step.delayHours;
  }, 0);

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md"
      onClick={onEdit}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{sequence.name}</CardTitle>
            {sequence.description && (
              <CardDescription className="line-clamp-1">
                {sequence.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={sequence.isActive}
              onCheckedChange={(e) => {
                e.stopPropagation?.();
                onToggleActive();
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  Edit Sequence
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewEnrollments(); }}>
                  <Users className="mr-2 h-4 w-4" />
                  View Enrollments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step type indicators */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(stepTypeCounts).map(([type, count]) => {
            const config = SEQUENCE_STEP_CONFIGS[type as keyof typeof SEQUENCE_STEP_CONFIGS];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Badge key={type} variant="secondary" className="gap-1 text-xs">
                <Icon className="h-3 w-3" />
                {count}
              </Badge>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{sequence.steps.length}</div>
            <div className="text-xs text-muted-foreground">Steps</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {sequence.activeEnrollments ?? sequence.enrollmentCount}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatDuration(totalHours)}</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </div>

        {/* Completion rate if available */}
        {sequence.completionRate !== undefined && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${sequence.completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium">{sequence.completionRate.toFixed(0)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
