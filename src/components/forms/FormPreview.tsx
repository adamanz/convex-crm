"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormFieldConfig } from "./FormField";
import { Monitor, Smartphone, Tablet, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormPreviewProps {
  fields: FormFieldConfig[];
  formName?: string;
  formDescription?: string;
  submitButtonText?: string;
  successMessage?: string;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

type PreviewDevice = "desktop" | "tablet" | "mobile";

export function FormPreview({
  fields,
  formName = "Form Preview",
  formDescription,
  submitButtonText = "Submit",
  successMessage = "Thank you for your submission!",
  primaryColor = "#3b82f6",
  backgroundColor = "#ffffff",
  fontFamily = "inherit",
}: FormPreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deviceWidths: Record<PreviewDevice, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when field is changed
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.id];

      // Required field validation
      if (field.required) {
        if (field.type === "checkbox" && !value) {
          newErrors[field.id] = "This field is required";
        } else if (field.type !== "checkbox" && (!value || String(value).trim() === "")) {
          newErrors[field.id] = "This field is required";
        }
      }

      // Type-specific validation
      if (value && typeof value === "string" && value.trim() !== "") {
        if (field.type === "email") {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            newErrors[field.id] = "Please enter a valid email address";
          }
        }

        if (field.type === "url") {
          try {
            new URL(value);
          } catch {
            newErrors[field.id] = "Please enter a valid URL";
          }
        }

        if (field.type === "phone") {
          const phonePattern = /^[\d\s\-+()]+$/;
          if (!phonePattern.test(value)) {
            newErrors[field.id] = "Please enter a valid phone number";
          }
        }

        // Custom validation
        if (field.validation) {
          if (field.validation.minLength && value.length < field.validation.minLength) {
            newErrors[field.id] = field.validation.message || `Minimum ${field.validation.minLength} characters required`;
          }
          if (field.validation.maxLength && value.length > field.validation.maxLength) {
            newErrors[field.id] = field.validation.message || `Maximum ${field.validation.maxLength} characters allowed`;
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              newErrors[field.id] = field.validation.message || "Invalid format";
            }
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={device === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
          <Button
            variant={device === "tablet" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="h-4 w-4 mr-1" />
            Tablet
          </Button>
          <Button
            variant={device === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Preview Container */}
      <div className="border rounded-lg bg-zinc-100 p-4 overflow-auto">
        <div
          className={cn(
            "mx-auto transition-all duration-300",
            device !== "desktop" && "shadow-lg"
          )}
          style={{
            maxWidth: deviceWidths[device],
            fontFamily: fontFamily,
          }}
        >
          <Card
            className="p-6"
            style={{
              backgroundColor: backgroundColor,
            }}
          >
            {isSubmitted ? (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: primaryColor }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Success!</h3>
                <p className="text-zinc-600">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Header */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{formName}</h2>
                  {formDescription && (
                    <p className="text-zinc-600 text-sm">{formDescription}</p>
                  )}
                </div>

                {/* Form Fields */}
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    <p>No fields added yet</p>
                    <p className="text-sm">Add fields from the builder to preview them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field) => (
                      <FormField
                        key={field.id}
                        field={field}
                        value={formData[field.id] ?? (field.type === "checkbox" ? false : field.defaultValue || "")}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        error={errors[field.id]}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                )}

                {/* Submit Button */}
                {fields.length > 0 && (
                  <Button
                    type="submit"
                    className="w-full"
                    style={{
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    }}
                  >
                    {submitButtonText}
                  </Button>
                )}
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* Preview Info */}
      <p className="text-xs text-zinc-500 text-center">
        This is a preview. Form submissions here won&apos;t be saved.
      </p>
    </div>
  );
}

export default FormPreview;
