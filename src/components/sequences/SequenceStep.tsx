"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckSquare,
  Trash2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SequenceStepType = "email" | "sms" | "call" | "wait" | "task";

interface StepConfig {
  type: SequenceStepType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const SEQUENCE_STEP_CONFIGS: Record<SequenceStepType, StepConfig> = {
  email: {
    type: "email",
    label: "Send Email",
    description: "Send an email to the contact",
    icon: Mail,
    color: "bg-purple-500",
  },
  sms: {
    type: "sms",
    label: "Send SMS",
    description: "Send a text message",
    icon: MessageSquare,
    color: "bg-blue-500",
  },
  call: {
    type: "call",
    label: "Make Call",
    description: "Create a call task",
    icon: Phone,
    color: "bg-green-500",
  },
  wait: {
    type: "wait",
    label: "Wait",
    description: "Pause before next step",
    icon: Clock,
    color: "bg-amber-500",
  },
  task: {
    type: "task",
    label: "Create Task",
    description: "Create a follow-up task",
    icon: CheckSquare,
    color: "bg-indigo-500",
  },
};

export interface SequenceStepData {
  id: string;
  type: SequenceStepType;
  delayDays: number;
  delayHours: number;
  templateId?: string;
  subject?: string;
  content?: string;
  taskDescription?: string;
}

interface SequenceStepProps {
  step: SequenceStepData;
  stepNumber: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
}

export function SequenceStep({
  step,
  stepNumber,
  isSelected,
  onSelect,
  onDelete,
  onConfigure,
}: SequenceStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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

  const config = SEQUENCE_STEP_CONFIGS[step.type];
  const Icon = config.icon;

  // Get step summary
  const getStepSummary = () => {
    if (step.delayDays > 0 || step.delayHours > 0) {
      const parts = [];
      if (step.delayDays > 0) {
        parts.push(`${step.delayDays}d`);
      }
      if (step.delayHours > 0) {
        parts.push(`${step.delayHours}h`);
      }
      return `Wait ${parts.join(" ")} then ${config.label.toLowerCase()}`;
    }

    switch (step.type) {
      case "email":
        return step.subject || "Configure email";
      case "sms":
        return step.content ? `"${step.content.slice(0, 30)}..."` : "Configure message";
      case "call":
        return step.content || "Schedule call";
      case "wait":
        return "Configure wait time";
      case "task":
        return step.taskDescription || "Configure task";
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
        isDragging && "opacity-50 shadow-lg scale-105 z-50",
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

        {/* Step Number */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {stepNumber}
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
export function StepConnector({ className }: { className?: string }) {
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

// Step type selector
interface StepTypeSelectorProps {
  onSelect: (type: SequenceStepType) => void;
  onClose: () => void;
}

export function StepTypeSelector({ onSelect, onClose }: StepTypeSelectorProps) {
  return (
    <div className="rounded-lg border bg-card p-2 shadow-lg">
      <div className="grid grid-cols-2 gap-1">
        {Object.values(SEQUENCE_STEP_CONFIGS).map((config) => {
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

// Overlay for dragging
export function SequenceStepOverlay({ step }: { step: SequenceStepData }) {
  const config = SEQUENCE_STEP_CONFIGS[step.type];
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
