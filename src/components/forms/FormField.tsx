"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "number"
  | "date"
  | "url"
  | "hidden";

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
}

interface FormFieldProps {
  field: FormFieldConfig;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  error?: string;
  disabled?: boolean;
  primaryColor?: string;
}

export function FormField({
  field,
  value,
  onChange,
  error,
  disabled,
  primaryColor = "#3b82f6",
}: FormFieldProps) {
  const inputId = `field-${field.id}`;

  if (field.type === "hidden") {
    return (
      <input
        type="hidden"
        name={field.name}
        value={value as string}
      />
    );
  }

  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={inputId}
            name={field.name}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            className={error ? "border-red-500" : ""}
            rows={4}
          />
        );

      case "select":
        return (
          <Select
            value={value as string}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={inputId}
              checked={value as boolean}
              onCheckedChange={(checked) => onChange(!!checked)}
              disabled={disabled}
              style={{
                borderColor: value ? primaryColor : undefined,
                backgroundColor: value ? primaryColor : undefined,
              }}
            />
            <Label
              htmlFor={inputId}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case "date":
        return (
          <Input
            id={inputId}
            type="date"
            name={field.name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        );

      case "number":
        return (
          <Input
            id={inputId}
            type="number"
            name={field.name}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        );

      case "email":
        return (
          <Input
            id={inputId}
            type="email"
            name={field.name}
            placeholder={field.placeholder || "email@example.com"}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        );

      case "phone":
        return (
          <Input
            id={inputId}
            type="tel"
            name={field.name}
            placeholder={field.placeholder || "+1 (555) 000-0000"}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        );

      case "url":
        return (
          <Input
            id={inputId}
            type="url"
            name={field.name}
            placeholder={field.placeholder || "https://example.com"}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            className={error ? "border-red-500" : ""}
          />
        );

      default: // text
        return (
          <Input
            id={inputId}
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.required}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  // Checkbox has its own label handling
  if (field.type === "checkbox") {
    return (
      <div className="space-y-1">
        {renderInput()}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default FormField;
