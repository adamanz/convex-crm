"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { FormFieldConfig, FormFieldType } from "./FormField";

interface FormFieldEditorProps {
  field: FormFieldConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (field: FormFieldConfig) => void;
}

const fieldTypes: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "hidden", label: "Hidden" },
];

export function FormFieldEditor({
  field,
  open,
  onClose,
  onSave,
}: FormFieldEditorProps) {
  const isNew = !field;

  const [name, setName] = useState(field?.name || "");
  const [label, setLabel] = useState(field?.label || "");
  const [type, setType] = useState<FormFieldType>(field?.type || "text");
  const [required, setRequired] = useState(field?.required || false);
  const [placeholder, setPlaceholder] = useState(field?.placeholder || "");
  const [defaultValue, setDefaultValue] = useState(field?.defaultValue || "");
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [newOption, setNewOption] = useState("");
  const [minLength, setMinLength] = useState<string>(
    field?.validation?.minLength?.toString() || ""
  );
  const [maxLength, setMaxLength] = useState<string>(
    field?.validation?.maxLength?.toString() || ""
  );
  const [pattern, setPattern] = useState(field?.validation?.pattern || "");
  const [validationMessage, setValidationMessage] = useState(
    field?.validation?.message || ""
  );

  const handleSave = () => {
    const fieldData: FormFieldConfig = {
      id: field?.id || `field_${Date.now()}`,
      name: name || label.toLowerCase().replace(/\s+/g, "_"),
      label,
      type,
      required,
      placeholder: placeholder || undefined,
      defaultValue: defaultValue || undefined,
      options: type === "select" ? options : undefined,
      validation:
        minLength || maxLength || pattern
          ? {
              minLength: minLength ? parseInt(minLength) : undefined,
              maxLength: maxLength ? parseInt(maxLength) : undefined,
              pattern: pattern || undefined,
              message: validationMessage || undefined,
            }
          : undefined,
    };

    onSave(fieldData);
    onClose();
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Add Field" : "Edit Field"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Field Type */}
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FormFieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Field label"
            />
          </div>

          {/* Name (optional, auto-generated from label) */}
          <div className="space-y-2">
            <Label>
              Field Name{" "}
              <span className="text-zinc-500 text-xs">(optional)</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label.toLowerCase().replace(/\s+/g, "_") || "field_name"}
            />
          </div>

          {/* Required */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(!!checked)}
            />
            <Label htmlFor="required" className="cursor-pointer">
              Required field
            </Label>
          </div>

          {/* Placeholder (not for checkbox) */}
          {type !== "checkbox" && type !== "hidden" && (
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Default Value */}
          {type !== "checkbox" && (
            <div className="space-y-2">
              <Label>Default Value</Label>
              <Input
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Enter default value"
              />
            </div>
          )}

          {/* Options for Select */}
          {type === "select" && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={option} readOnly className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Validation (for text fields) */}
          {(type === "text" || type === "textarea") && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-sm font-medium">Validation Rules</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Min Length</Label>
                  <Input
                    type="number"
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Length</Label>
                  <Input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Regex Pattern</Label>
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="^[a-zA-Z]+$"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Error Message</Label>
                <Input
                  value={validationMessage}
                  onChange={(e) => setValidationMessage(e.target.value)}
                  placeholder="Please enter a valid value"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {isNew ? "Add Field" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FormFieldEditor;
