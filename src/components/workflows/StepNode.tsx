"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MessageSquare,
  Mail,
  CheckSquare,
  Clock,
  GitBranch,
  Sparkles,
  Trash2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type StepType =
  | "send_message"
  | "send_email"
  | "create_task"
  | "wait"
  | "condition"
  | "ai_action";

interface StepConfig {
  type: StepType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const STEP_CONFIGS: Record<StepType, StepConfig> = {
  send_message: {
    type: "send_message",
    label: "Send Message",
    description: "Send an SMS or iMessage",
    icon: MessageSquare,
    color: "bg-blue-500",
  },
  send_email: {
    type: "send_email",
    label: "Send Email",
    description: "Send an email",
    icon: Mail,
    color: "bg-purple-500",
  },
  create_task: {
    type: "create_task",
    label: "Create Task",
    description: "Create a follow-up task",
    icon: CheckSquare,
    color: "bg-green-500",
  },
  wait: {
    type: "wait",
    label: "Wait",
    description: "Pause for a duration",
    icon: Clock,
    color: "bg-amber-500",
  },
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch based on conditions",
    icon: GitBranch,
    color: "bg-orange-500",
  },
  ai_action: {
    type: "ai_action",
    label: "AI Action",
    description: "AI-powered response",
    icon: Sparkles,
    color: "bg-indigo-500",
  },
};

export interface WorkflowStep {
  id: string;
  type: StepType;
  config: Record<string, unknown>;
  order: number;
}

interface StepNodeProps {
  step: WorkflowStep;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
}

export function StepNode({
  step,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  onConfigure,
}: StepNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: step.id,
    data: {
      type: "step",
      step,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = STEP_CONFIGS[step.type];
  const Icon = config.icon;
  const isCurrentlyDragging = isDragging || isSortableDragging;

  // Get step summary based on config
  const getStepSummary = () => {
    switch (step.type) {
      case "send_message":
        return step.config.message
          ? `"${String(step.config.message).slice(0, 30)}..."`
          : "Configure message";
      case "send_email":
        return step.config.subject
          ? String(step.config.subject)
          : "Configure email";
      case "create_task":
        return step.config.title
          ? String(step.config.title)
          : "Configure task";
      case "wait":
        if (step.config.duration && step.config.unit) {
          return `${step.config.duration} ${step.config.unit}`;
        }
        return "Configure wait time";
      case "condition":
        return step.config.field
          ? `If ${step.config.field} ${step.config.operator} ${step.config.value}`
          : "Configure condition";
      case "ai_action":
        return step.config.prompt
          ? `"${String(step.config.prompt).slice(0, 30)}..."`
          : "Configure AI action";
      default:
        return "Configure step";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card transition-all duration-200",
        "hover:shadow-md",
        isCurrentlyDragging && "opacity-50 shadow-lg scale-105 z-50",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing",
            "p-1 rounded hover:bg-muted transition-colors",
            "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Step Icon */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white",
            config.color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Step Content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {config.label}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {getStepSummary()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure?.();
            }}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step connector line
interface StepConnectorProps {
  className?: string;
}

export function StepConnector({ className }: StepConnectorProps) {
  return (
    <div className={cn("flex justify-center py-1", className)}>
      <div className="w-px h-6 bg-border" />
    </div>
  );
}

// Add step button
interface AddStepButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddStepButton({ onClick, className }: AddStepButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border-2 border-dashed border-muted-foreground/25 p-4",
        "flex items-center justify-center gap-2",
        "text-sm text-muted-foreground",
        "hover:border-primary/50 hover:bg-accent/50 hover:text-foreground",
        "transition-all duration-200",
        className
      )}
    >
      <span className="text-lg">+</span>
      <span>Add Step</span>
    </button>
  );
}

// Step type selector (for adding new steps)
interface StepTypeSelectorProps {
  onSelect: (type: StepType) => void;
  onClose: () => void;
}

export function StepTypeSelector({ onSelect, onClose }: StepTypeSelectorProps) {
  return (
    <div className="rounded-lg border bg-card p-2 shadow-lg">
      <div className="grid grid-cols-2 gap-1">
        {Object.values(STEP_CONFIGS).map((config) => {
          const Icon = config.icon;
          return (
            <button
              key={config.type}
              type="button"
              onClick={() => {
                onSelect(config.type);
                onClose();
              }}
              className={cn(
                "flex items-center gap-2 rounded-md p-2 text-left",
                "hover:bg-accent transition-colors"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded text-white",
                  config.color
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{config.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dragging overlay
export function StepNodeOverlay({ step }: { step: WorkflowStep }) {
  const config = STEP_CONFIGS[step.type];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl rotate-2 scale-105 opacity-90">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white",
            config.color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm font-medium">{config.label}</div>
      </div>
    </div>
  );
}

export { STEP_CONFIGS };
