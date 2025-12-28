"use client";

import { useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GripVertical,
  Trash2,
  Edit2,
  Plus,
  Type,
  Mail,
  Phone,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  Hash,
  Calendar,
  Link2,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormFieldConfig, FormFieldType } from "./FormField";
import { FormFieldEditor } from "./FormFieldEditor";

interface SortableFieldItemProps {
  field: FormFieldConfig;
  onEdit: (field: FormFieldConfig) => void;
  onDelete: (id: string) => void;
}

function SortableFieldItem({ field, onEdit, onDelete }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFieldIcon = (type: FormFieldType) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      case "textarea": return <AlignLeft className="h-4 w-4" />;
      case "select": return <ListOrdered className="h-4 w-4" />;
      case "checkbox": return <CheckSquare className="h-4 w-4" />;
      case "number": return <Hash className="h-4 w-4" />;
      case "date": return <Calendar className="h-4 w-4" />;
      case "url": return <Link2 className="h-4 w-4" />;
      case "hidden": return <EyeOff className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-lg",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-zinc-500">{getFieldIcon(field.type)}</span>
        <div>
          <p className="font-medium text-sm">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </p>
          <p className="text-xs text-zinc-500 capitalize">{field.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(field)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface FormBuilderProps {
  fields: FormFieldConfig[];
  onChange: (fields: FormFieldConfig[]) => void;
}

const fieldTemplates: { type: FormFieldType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { type: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { type: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> },
  { type: "textarea", label: "Text Area", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "select", label: "Dropdown", icon: <ListOrdered className="h-4 w-4" /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { type: "url", label: "URL", icon: <Link2 className="h-4 w-4" /> },
  { type: "hidden", label: "Hidden", icon: <EyeOff className="h-4 w-4" /> },
];

export function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewField, setIsNewField] = useState(false);
  const [newFieldType, setNewFieldType] = useState<FormFieldType>("text");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);

        onChange(arrayMove(fields, oldIndex, newIndex));
      }
    },
    [fields, onChange]
  );

  const handleAddField = (type: FormFieldType) => {
    setNewFieldType(type);
    setIsNewField(true);
    setEditingField({
      id: `field_${Date.now()}`,
      name: "",
      label: "",
      type,
      required: false,
    });
    setIsEditorOpen(true);
  };

  const handleEditField = (field: FormFieldConfig) => {
    setIsNewField(false);
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleDeleteField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const handleSaveField = (field: FormFieldConfig) => {
    if (isNewField) {
      onChange([...fields, field]);
    } else {
      onChange(fields.map((f) => (f.id === field.id ? field : f)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Field List */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Form Fields</h3>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="mb-2">No fields added yet</p>
            <p className="text-sm">Add fields from the palette below</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    onEdit={handleEditField}
                    onDelete={handleDeleteField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      {/* Field Palette */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Add Field</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {fieldTemplates.map((template) => (
            <Button
              key={template.type}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={() => handleAddField(template.type)}
            >
              {template.icon}
              <span className="text-xs">{template.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Field Editor Dialog */}
      <FormFieldEditor
        field={editingField}
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
      />
    </div>
  );
}

export default FormBuilder;
