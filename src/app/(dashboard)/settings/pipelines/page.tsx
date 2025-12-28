"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability?: number;
}

interface LocalPipeline {
  _id: Id<"pipelines">;
  name: string;
  description?: string;
  stages: Stage[];
  isDefault: boolean;
  isNew?: boolean;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6b7280", // Gray
];

interface SortableStageProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onDelete: (stageId: string) => void;
  isEditing: boolean;
  editingStage: Stage | null;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditChange: (field: keyof Stage, value: string | number) => void;
}

function SortableStage({
  stage,
  onEdit,
  onDelete,
  isEditing,
  editingStage,
  onSaveEdit,
  onCancelEdit,
  onEditChange,
}: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing && editingStage?.id === stage.id) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
      >
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Input
              value={editingStage.name}
              onChange={(e) => onEditChange("name", e.target.value)}
              placeholder="Stage name"
              className="flex-1"
            />
            <Input
              type="number"
              value={editingStage.probability ?? ""}
              onChange={(e) =>
                onEditChange("probability", parseInt(e.target.value) || 0)
              }
              placeholder="Probability %"
              className="w-28"
              min={0}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-zinc-500">Color:</Label>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onEditChange("color", color)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform hover:scale-110",
                    editingStage.color === color &&
                      "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-50"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onSaveEdit}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onCancelEdit}>
            <X className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-shadow dark:border-zinc-700 dark:bg-zinc-800",
        isDragging && "shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: stage.color }}
      />
      <div className="flex-1">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {stage.name}
        </span>
        {stage.probability !== undefined && (
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
            {stage.probability}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(stage)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(stage.id)}
          className="h-8 w-8 text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function PipelinesSettingsPage() {
  // Convex queries and mutations
  const pipelinesData = useQuery(api.pipelines.list, {});
  const createPipeline = useMutation(api.pipelines.create);
  const updatePipeline = useMutation(api.pipelines.update);
  const deletePipeline = useMutation(api.pipelines.delete_);

  // Local state for editing
  const [localPipelines, setLocalPipelines] = useState<LocalPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<Id<"pipelines"> | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync remote data to local state when it changes
  useEffect(() => {
    if (pipelinesData && !hasUnsavedChanges) {
      const mapped: LocalPipeline[] = pipelinesData.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        stages: p.stages,
        isDefault: p.isDefault,
      }));
      setLocalPipelines(mapped);

      // Set initial selection if not set
      if (!selectedPipelineId && mapped.length > 0) {
        setSelectedPipelineId(mapped[0]._id);
      }
    }
  }, [pipelinesData, hasUnsavedChanges, selectedPipelineId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedPipeline = localPipelines.find((p) => p._id === selectedPipelineId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && selectedPipeline) {
      const oldIndex = selectedPipeline.stages.findIndex(
        (s) => s.id === active.id
      );
      const newIndex = selectedPipeline.stages.findIndex(
        (s) => s.id === over.id
      );

      const newStages = arrayMove(selectedPipeline.stages, oldIndex, newIndex).map(
        (stage, index) => ({ ...stage, order: index })
      );

      setLocalPipelines((prev) =>
        prev.map((p) =>
          p._id === selectedPipelineId ? { ...p, stages: newStages } : p
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleAddStage = () => {
    if (!selectedPipeline) return;

    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      name: "New Stage",
      color: PRESET_COLORS[selectedPipeline.stages.length % PRESET_COLORS.length],
      order: selectedPipeline.stages.length,
      probability: 50,
    };

    setLocalPipelines((prev) =>
      prev.map((p) =>
        p._id === selectedPipelineId
          ? { ...p, stages: [...p.stages, newStage] }
          : p
      )
    );
    setHasUnsavedChanges(true);
    setEditingStage(newStage);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage({ ...stage });
  };

  const handleSaveEdit = () => {
    if (!editingStage || !selectedPipeline) return;

    setLocalPipelines((prev) =>
      prev.map((p) =>
        p._id === selectedPipelineId
          ? {
              ...p,
              stages: p.stages.map((s) =>
                s.id === editingStage.id ? editingStage : s
              ),
            }
          : p
      )
    );
    setHasUnsavedChanges(true);
    setEditingStage(null);
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
  };

  const handleEditChange = (field: keyof Stage, value: string | number) => {
    if (!editingStage) return;
    setEditingStage({ ...editingStage, [field]: value });
  };

  const handleDeleteStage = (stageId: string) => {
    if (!selectedPipeline) return;
    if (selectedPipeline.stages.length <= 2) {
      toast.error("Pipeline must have at least 2 stages");
      return;
    }

    setLocalPipelines((prev) =>
      prev.map((p) =>
        p._id === selectedPipelineId
          ? {
              ...p,
              stages: p.stages
                .filter((s) => s.id !== stageId)
                .map((s, i) => ({ ...s, order: i })),
            }
          : p
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;

    try {
      const now = Date.now();
      const newPipelineId = await createPipeline({
        name: newPipelineName,
        stages: [
          { id: `s-${now}-1`, name: "Lead", color: "#6366f1", order: 0, probability: 10 },
          { id: `s-${now}-2`, name: "Qualified", color: "#8b5cf6", order: 1, probability: 50 },
          { id: `s-${now}-3`, name: "Won", color: "#22c55e", order: 2, probability: 100 },
        ],
        isDefault: false,
      });

      setSelectedPipelineId(newPipelineId);
      setNewPipelineName("");
      setIsCreatingPipeline(false);
      toast.success("Pipeline created successfully");
    } catch (error) {
      toast.error("Failed to create pipeline");
      console.error(error);
    }
  };

  const handleDeletePipeline = async (pipelineId: Id<"pipelines">) => {
    const pipeline = localPipelines.find((p) => p._id === pipelineId);
    if (pipeline?.isDefault) {
      toast.error("Cannot delete the default pipeline");
      return;
    }
    if (localPipelines.length <= 1) {
      toast.error("Must have at least one pipeline");
      return;
    }

    try {
      await deletePipeline({ id: pipelineId });
      if (selectedPipelineId === pipelineId) {
        setSelectedPipelineId(localPipelines.find((p) => p._id !== pipelineId)?._id || null);
      }
      toast.success("Pipeline deleted successfully");
    } catch (error) {
      toast.error("Failed to delete pipeline. It may have active deals.");
      console.error(error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save all modified pipelines
      for (const pipeline of localPipelines) {
        // Skip newly created pipelines that haven't been saved yet
        if (pipeline.isNew) continue;

        await updatePipeline({
          id: pipeline._id,
          name: pipeline.name,
          description: pipeline.description,
          stages: pipeline.stages,
          isDefault: pipeline.isDefault,
        });
      }

      setHasUnsavedChanges(false);
      toast.success("Pipeline settings saved successfully");
    } catch (error) {
      toast.error("Failed to save pipeline settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Pipeline Settings
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Configure your sales pipelines and customize stages
        </p>
      </div>

      {/* Pipeline List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Pipelines</CardTitle>
            <CardDescription>
              Select a pipeline to configure its stages
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreatingPipeline(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Pipeline
          </Button>
        </CardHeader>
        <CardContent>
          {isCreatingPipeline && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <Input
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="Pipeline name"
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePipeline();
                  if (e.key === "Escape") setIsCreatingPipeline(false);
                }}
              />
              <Button size="sm" onClick={handleCreatePipeline}>
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreatingPipeline(false);
                  setNewPipelineName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {pipelinesData === undefined ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {localPipelines.map((pipeline) => (
                <button
                  key={pipeline._id}
                  onClick={() => setSelectedPipelineId(pipeline._id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    selectedPipelineId === pipeline._id
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  )}
                >
                  {pipeline.name}
                  {pipeline.isDefault && (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Pipeline Stages */}
      {selectedPipeline && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{selectedPipeline.name} Stages</CardTitle>
              <CardDescription>
                Drag to reorder stages. Click to edit name, color, and
                probability.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddStage} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
              {!selectedPipeline.isDefault && (
                <Button
                  onClick={() => handleDeletePipeline(selectedPipeline._id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Pipeline
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedPipeline.stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedPipeline.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <SortableStage
                        key={stage.id}
                        stage={stage}
                        onEdit={handleEditStage}
                        onDelete={handleDeleteStage}
                        isEditing={editingStage?.id === stage.id}
                        editingStage={editingStage}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onEditChange={handleEditChange}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {hasUnsavedChanges && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
