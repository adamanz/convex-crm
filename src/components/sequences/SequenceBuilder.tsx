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
import { ArrowLeft, Save, Loader2, Play, Users } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  SequenceStep,
  StepConnector,
  AddStepButton,
  StepTypeSelector,
  SequenceStepOverlay,
  SEQUENCE_STEP_CONFIGS,
  type SequenceStepType,
  type SequenceStepData,
} from "./SequenceStep";

interface SequenceBuilderProps {
  initialData?: {
    name: string;
    description?: string;
    steps: SequenceStepData[];
    isActive: boolean;
  };
  onSave: (data: {
    name: string;
    description?: string;
    steps: SequenceStepData[];
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SequenceBuilder({
  initialData,
  onSave,
  onCancel,
  isLoading,
}: SequenceBuilderProps) {
  // Form state
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [description, setDescription] = React.useState(
    initialData?.description ?? ""
  );
  const [isActive, setIsActive] = React.useState(initialData?.isActive ?? false);
  const [steps, setSteps] = React.useState<SequenceStepData[]>(
    initialData?.steps ?? []
  );

  // UI state
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null);
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
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  // Add a new step
  const handleAddStep = (type: SequenceStepType) => {
    const newStep: SequenceStepData = {
      id: generateId(),
      type,
      delayDays: 0,
      delayHours: 0,
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

  // Update step
  const handleUpdateStep = (stepId: string, updates: Partial<SequenceStepData>) => {
    setSteps(
      steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  // Handle save
  const handleSave = async () => {
    await onSave({
      name,
      description: description || undefined,
      steps,
      isActive,
    });
  };

  // Calculate total sequence duration
  const totalDuration = steps.reduce((acc, step) => {
    return acc + (step.delayDays * 24) + step.delayHours;
  }, 0);

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    return parts.length > 0 ? parts.join(" ") : "Immediate";
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
              {initialData ? "Edit Sequence" : "Create Sequence"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Build your multi-touch outreach cadence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{steps.length} steps</span>
            <span className="mx-1">|</span>
            <span>{formatDuration(totalDuration)} total</span>
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
                Save Sequence
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Settings */}
        <div className="w-80 shrink-0 border-r overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                placeholder="e.g., New Lead Follow-up"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this sequence..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable to allow contact enrollment
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Sequence Summary */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3">Sequence Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Steps</span>
                <span className="font-medium">{steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Steps</span>
                <span className="font-medium">
                  {steps.filter((s) => s.type === "email").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SMS Steps</span>
                <span className="font-medium">
                  {steps.filter((s) => s.type === "sms").length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Steps */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="mx-auto max-w-md space-y-2">
            {/* Start Node */}
            <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Sequence Start
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Contact is enrolled in sequence
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
                    <SequenceStep
                      step={step}
                      stepNumber={index + 1}
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
                {activeStep && <SequenceStepOverlay step={activeStep} />}
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
        onUpdate={(updates) => {
          if (selectedStepId) {
            handleUpdateStep(selectedStepId, updates);
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
  step?: SequenceStepData;
  onUpdate: (updates: Partial<SequenceStepData>) => void;
}

function StepConfigDialog({
  open,
  onOpenChange,
  step,
  onUpdate,
}: StepConfigDialogProps) {
  const [localStep, setLocalStep] = React.useState<Partial<SequenceStepData>>({});

  React.useEffect(() => {
    if (step) {
      setLocalStep(step);
    }
  }, [step]);

  if (!step) return null;

  const config = SEQUENCE_STEP_CONFIGS[step.type];

  const handleSave = () => {
    onUpdate(localStep);
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
                config.color
              )}
            >
              <config.icon className="h-3.5 w-3.5" />
            </div>
            Configure {config.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Delay Settings */}
          <div className="space-y-2">
            <Label>Wait Before This Step</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  value={localStep.delayDays ?? 0}
                  onChange={(e) =>
                    setLocalStep({
                      ...localStep,
                      delayDays: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">Days</span>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={localStep.delayHours ?? 0}
                  onChange={(e) =>
                    setLocalStep({
                      ...localStep,
                      delayHours: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">Hours</span>
              </div>
            </div>
          </div>

          {/* Email-specific fields */}
          {step.type === "email" && (
            <>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder="Email subject..."
                  value={localStep.subject ?? ""}
                  onChange={(e) =>
                    setLocalStep({ ...localStep, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  placeholder="Write your email content..."
                  value={localStep.content ?? ""}
                  onChange={(e) =>
                    setLocalStep({ ...localStep, content: e.target.value })
                  }
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{firstName}}"}, {"{{lastName}}"}, {"{{company}}"} for personalization
                </p>
              </div>
            </>
          )}

          {/* SMS-specific fields */}
          {step.type === "sms" && (
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your SMS message..."
                value={localStep.content ?? ""}
                onChange={(e) =>
                  setLocalStep({ ...localStep, content: e.target.value })
                }
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {(localStep.content?.length ?? 0)} / 160 characters
              </p>
            </div>
          )}

          {/* Call-specific fields */}
          {step.type === "call" && (
            <div className="space-y-2">
              <Label>Call Notes</Label>
              <Textarea
                placeholder="Notes for the call..."
                value={localStep.content ?? ""}
                onChange={(e) =>
                  setLocalStep({ ...localStep, content: e.target.value })
                }
                rows={4}
              />
            </div>
          )}

          {/* Task-specific fields */}
          {step.type === "task" && (
            <div className="space-y-2">
              <Label>Task Description</Label>
              <Textarea
                placeholder="Describe the task..."
                value={localStep.taskDescription ?? ""}
                onChange={(e) =>
                  setLocalStep({ ...localStep, taskDescription: e.target.value })
                }
                rows={4}
              />
            </div>
          )}

          {/* Wait-specific - just the delay settings above */}
          {step.type === "wait" && (
            <p className="text-sm text-muted-foreground">
              This step will pause the sequence for the specified duration before
              proceeding to the next step.
            </p>
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
