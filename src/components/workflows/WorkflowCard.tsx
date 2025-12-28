"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Play,
  Pause,
  Pencil,
  Trash2,
  Copy,
  Clock,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TriggerBadge, type TriggerType } from "./TriggerSelector";
import { STEP_CONFIGS, type StepType } from "./StepNode";
import type { Id } from "../../../convex/_generated/dataModel";

export interface WorkflowData {
  _id: Id<"workflows">;
  name: string;
  description?: string;
  triggerType: TriggerType;
  steps: Array<{
    id: string;
    type: StepType;
    config: Record<string, unknown>;
    order: number;
  }>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface WorkflowCardProps {
  workflow: WorkflowData;
  onClick?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function WorkflowCard({
  workflow,
  onClick,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  className,
}: WorkflowCardProps) {
  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:shadow-md cursor-pointer",
        !workflow.isActive && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left Content */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">
                  {workflow.name}
                </h3>
                {workflow.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {workflow.description}
                  </p>
                )}
              </div>
            </div>

            {/* Trigger and Status */}
            <div className="flex flex-wrap items-center gap-2">
              <TriggerBadge type={workflow.triggerType} />
              <Badge variant={workflow.isActive ? "success" : "secondary"}>
                {workflow.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Steps Preview */}
            <div className="flex items-center gap-1">
              {workflow.steps.slice(0, 5).map((step, index) => {
                const config = STEP_CONFIGS[step.type];
                const Icon = config.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded text-white",
                        config.color
                      )}
                      title={config.label}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    {index < workflow.steps.slice(0, 5).length - 1 && (
                      <div className="w-2 h-px bg-border" />
                    )}
                  </React.Fragment>
                );
              })}
              {workflow.steps.length > 5 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{workflow.steps.length - 5} more
                </span>
              )}
              {workflow.steps.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No steps configured
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated {formatRelativeTime(workflow.updatedAt)}</span>
              </div>
              <span className="text-muted-foreground/50">|</span>
              <span>{workflow.steps.length} steps</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive?.();
              }}
              title={workflow.isActive ? "Pause workflow" : "Activate workflow"}
            >
              {workflow.isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate?.();
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact card for inline display
interface WorkflowCardCompactProps {
  workflow: WorkflowData;
  onClick?: () => void;
  className?: string;
}

export function WorkflowCardCompact({
  workflow,
  onClick,
  className,
}: WorkflowCardCompactProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 cursor-pointer",
        "hover:bg-accent/50 transition-colors",
        !workflow.isActive && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{workflow.name}</div>
        <div className="text-xs text-muted-foreground">
          {workflow.steps.length} steps
        </div>
      </div>
      <Badge variant={workflow.isActive ? "success" : "secondary"} className="shrink-0">
        {workflow.isActive ? "Active" : "Inactive"}
      </Badge>
    </div>
  );
}
