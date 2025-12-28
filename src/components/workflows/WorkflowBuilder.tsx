"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TriggerSelector, type TriggerType } from "./TriggerSelector";
import {
  StepNode,
  StepConnector,
  AddStepButton,
  StepTypeSelector,
  StepNodeOverlay,
  STEP_CONFIGS,
  type StepType,
  type WorkflowStep,
} from "./StepNode";

interface WorkflowBuilderProps {
  initialData?: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig?: Record<string, unknown>;
    steps: WorkflowStep[];
  };
  onSave: (data: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    triggerConfig?: Record<string, unknown>;
    steps: WorkflowStep[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkflowBuilder({
  initialData,
  onSave,
  onCancel,
  isLoading,
}: WorkflowBuilderProps) {
  // Form state
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [description, setDescription] = React.useState(
    initialData?.description ?? ""
  );
  const [triggerType, setTriggerType] = React.useState<TriggerType>(
    initialData?.triggerType ?? "manual"
  );
  const [triggerConfig, setTriggerConfig] = React.useState<
    Record<string, unknown>
  >(initialData?.triggerConfig ?? {});
  const [steps, setSteps] = React.useState<WorkflowStep[]>(
    initialData?.steps ?? []
  );

  // UI state
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(
    null
  );
  const [showStepSelector, setShowStepSelector] = React.useState(false);
  const [showStepConfig, setShowStepConfig] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const activeStep = steps.find((s) => s.id === activeId);

  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order property
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }

    setActiveId(null);
  };

  // Add a new step
  const handleAddStep = (type: StepType) => {
    const newStep: WorkflowStep = {
      id: generateId(),
      type,
      config: {},
      order: steps.length,
    };
    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    setShowStepConfig(true);
    setShowStepSelector(false);
  };

  // Delete a step
  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  // Update step config
  const handleUpdateStepConfig = (
    stepId: string,
    config: Record<string, unknown>
  ) => {
    setSteps(
      steps.map((s) => (s.id === stepId ? { ...s, config } : s))
    );
  };

  // Handle save
  const handleSave = async () => {
    await onSave({
      name,
      description: description || undefined,
      triggerType,
      triggerConfig,
      steps,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {initialData ? "Edit Workflow" : "Create Workflow"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your automation workflow
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!name || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Workflow
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Settings */}
        <div className="w-80 shrink-0 border-r overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter workflow name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workflow does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="pt-4 border-t">
            <TriggerSelector
              value={triggerType}
              onChange={setTriggerType}
            />
          </div>

          {/* Trigger Config */}
          {triggerType === "deal_stage_change" && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Trigger Configuration</h3>
              <div className="space-y-2">
                <Label>Target Stage</Label>
                <Select
                  value={(triggerConfig.stageId as string) ?? ""}
                  onValueChange={(value) =>
                    setTriggerConfig({ ...triggerConfig, stageId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {triggerType === "scheduled" && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Schedule Configuration</h3>
              <div className="space-y-2">
                <Label>Run Every</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={(triggerConfig.interval as number) ?? 1}
                    onChange={(e) =>
                      setTriggerConfig({
                        ...triggerConfig,
                        interval: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-20"
                  />
                  <Select
                    value={(triggerConfig.unit as string) ?? "days"}
                    onValueChange={(value) =>
                      setTriggerConfig({ ...triggerConfig, unit: value })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Steps */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="mx-auto max-w-md space-y-2">
            {/* Trigger Node */}
            <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center">
              <div className="text-sm font-medium text-primary">
                Workflow Trigger
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {triggerType === "manual" && "Manually triggered"}
                {triggerType === "new_contact" && "When a new contact is created"}
                {triggerType === "deal_stage_change" && "When a deal stage changes"}
                {triggerType === "inbound_message" && "When a message is received"}
                {triggerType === "scheduled" && "On a set schedule"}
              </div>
            </div>

            {steps.length > 0 && <StepConnector />}

            {/* Steps */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <StepNode
                      step={step}
                      isSelected={selectedStepId === step.id}
                      onSelect={() => setSelectedStepId(step.id)}
                      onDelete={() => handleDeleteStep(step.id)}
                      onConfigure={() => {
                        setSelectedStepId(step.id);
                        setShowStepConfig(true);
                      }}
                    />
                    {index < steps.length - 1 && <StepConnector />}
                  </React.Fragment>
                ))}
              </SortableContext>

              <DragOverlay>
                {activeStep && <StepNodeOverlay step={activeStep} />}
              </DragOverlay>
            </DndContext>

            {steps.length > 0 && <StepConnector />}

            {/* Add Step */}
            {showStepSelector ? (
              <StepTypeSelector
                onSelect={handleAddStep}
                onClose={() => setShowStepSelector(false)}
              />
            ) : (
              <AddStepButton onClick={() => setShowStepSelector(true)} />
            )}
          </div>
        </div>
      </div>

      {/* Step Configuration Dialog */}
      <StepConfigDialog
        open={showStepConfig}
        onOpenChange={setShowStepConfig}
        step={selectedStep}
        onUpdate={(config) => {
          if (selectedStepId) {
            handleUpdateStepConfig(selectedStepId, config);
          }
        }}
      />
    </div>
  );
}

// Step Configuration Dialog
interface StepConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step?: WorkflowStep;
  onUpdate: (config: Record<string, unknown>) => void;
}

function StepConfigDialog({
  open,
  onOpenChange,
  step,
  onUpdate,
}: StepConfigDialogProps) {
  const [config, setConfig] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    if (step) {
      setConfig(step.config);
    }
  }, [step]);

  if (!step) return null;

  const stepConfig = STEP_CONFIGS[step.type];

  const handleSave = () => {
    onUpdate(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-white",
                stepConfig.color
              )}
            >
              <stepConfig.icon className="h-3.5 w-3.5" />
            </div>
            Configure {stepConfig.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step.type === "send_message" && (
            <>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter your message..."
                  value={(config.message as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, message: e.target.value })
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{contact.firstName}"} for personalization
                </p>
              </div>
            </>
          )}

          {step.type === "send_email" && (
            <>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject..."
                  value={(config.subject as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  placeholder="Email body..."
                  value={(config.body as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, body: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </>
          )}

          {step.type === "create_task" && (
            <>
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  placeholder="Task title..."
                  value={(config.title as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Task description..."
                  value={(config.description as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Due in</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={(config.dueInDays as number) ?? 1}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        dueInDays: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-20"
                  />
                  <span className="flex items-center text-sm text-muted-foreground">
                    days
                  </span>
                </div>
              </div>
            </>
          )}

          {step.type === "wait" && (
            <>
              <div className="space-y-2">
                <Label>Wait Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={(config.duration as number) ?? 1}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        duration: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-24"
                  />
                  <Select
                    value={(config.unit as string) ?? "days"}
                    onValueChange={(value) =>
                      setConfig({ ...config, unit: value })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {step.type === "condition" && (
            <>
              <div className="space-y-2">
                <Label>Field</Label>
                <Select
                  value={(config.field as string) ?? ""}
                  onValueChange={(value) =>
                    setConfig({ ...config, field: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact.email">Contact Email</SelectItem>
                    <SelectItem value="contact.phone">Contact Phone</SelectItem>
                    <SelectItem value="deal.amount">Deal Amount</SelectItem>
                    <SelectItem value="deal.stage">Deal Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={(config.operator as string) ?? "equals"}
                  onValueChange={(value) =>
                    setConfig({ ...config, operator: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  placeholder="Value to compare..."
                  value={(config.value as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, value: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {step.type === "ai_action" && (
            <>
              <div className="space-y-2">
                <Label>AI Prompt</Label>
                <Textarea
                  placeholder="Describe what the AI should do..."
                  value={(config.prompt as string) ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, prompt: e.target.value })
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  The AI will have access to the contact and deal context
                </p>
              </div>
              <div className="space-y-2">
                <Label>Response Action</Label>
                <Select
                  value={(config.responseAction as string) ?? "send_message"}
                  onValueChange={(value) =>
                    setConfig({ ...config, responseAction: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_message">Send as Message</SelectItem>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="update_contact">Update Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
