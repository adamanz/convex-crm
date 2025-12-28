// Types for Custom Fields system
// Note: When convex is running, you can import Id from "@convex/_generated/dataModel"

export type Id<T extends string> = string & { __tableName: T };

// ============================================================================
// Field Types
// ============================================================================

export const FIELD_TYPES = [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "url",
  "email",
  "phone",
  "currency",
  "textarea",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Single Select",
  multiselect: "Multi Select",
  checkbox: "Checkbox",
  url: "URL",
  email: "Email",
  phone: "Phone",
  currency: "Currency",
  textarea: "Long Text",
};

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text: "Type",
  number: "Hash",
  date: "Calendar",
  select: "ChevronDown",
  multiselect: "CheckSquare",
  checkbox: "ToggleLeft",
  url: "Link",
  email: "Mail",
  phone: "Phone",
  currency: "DollarSign",
  textarea: "AlignLeft",
};

// ============================================================================
// Entity Types
// ============================================================================

export const ENTITY_TYPES = ["contact", "company", "deal"] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  contact: "Contact",
  company: "Company",
  deal: "Deal",
};

// ============================================================================
// Option (for select/multiselect fields)
// ============================================================================

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
}

// Default colors for select options
export const OPTION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
] as const;

// ============================================================================
// Validation Rules
// ============================================================================

export interface FieldValidation {
  min?: number; // Min value for number, min length for text
  max?: number; // Max value for number, max length for text
  pattern?: string; // Regex pattern for text fields
  message?: string; // Custom error message
}

// ============================================================================
// Custom Field Definition
// ============================================================================

export interface CustomFieldDefinition {
  _id: Id<"customFieldDefinitions">;
  _creationTime: number;

  // Identity
  name: string; // Internal name (snake_case, unique per entity type)
  label: string; // Display label
  description?: string;

  // Entity association
  entityType: EntityType;

  // Field type
  fieldType: FieldType;

  // Configuration
  placeholder?: string;
  isRequired: boolean;
  defaultValue?: unknown;

  // For select/multiselect fields
  options?: FieldOption[];

  // Validation rules
  validation?: FieldValidation;

  // Display
  order: number;
  isActive: boolean;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Custom Field Value
// ============================================================================

export interface CustomFieldValue {
  _id: Id<"customFieldValues">;
  _creationTime: number;

  // Reference to definition
  definitionId: Id<"customFieldDefinitions">;

  // Entity reference (polymorphic)
  entityType: EntityType;
  entityId: string;

  // The actual value
  value: unknown;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Combined type for display
// ============================================================================

export interface CustomFieldWithValue {
  definition: CustomFieldDefinition;
  value: CustomFieldValue | null;
}

// ============================================================================
// Form Data types
// ============================================================================

export interface CustomFieldDefinitionFormData {
  name: string;
  label: string;
  entityType: EntityType;
  fieldType: FieldType;
  description?: string;
  placeholder?: string;
  isRequired?: boolean;
  options?: FieldOption[];
  defaultValue?: unknown;
  validation?: FieldValidation;
}

export interface CustomFieldValueFormData {
  definitionId: string;
  value: unknown;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Generate a valid field name from a label
 */
export function generateFieldName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 50);
}

/**
 * Get the default value for a field type
 */
export function getDefaultValueForType(fieldType: FieldType): unknown {
  switch (fieldType) {
    case "text":
    case "textarea":
    case "url":
    case "email":
    case "phone":
      return "";
    case "number":
    case "currency":
      return null;
    case "date":
      return null;
    case "select":
      return "";
    case "multiselect":
      return [];
    case "checkbox":
      return false;
    default:
      return null;
  }
}

/**
 * Validate a value against a field definition
 */
export function validateFieldValue(
  value: unknown,
  definition: CustomFieldDefinition
): { valid: boolean; error?: string } {
  // Check required
  if (definition.isRequired) {
    if (value === null || value === undefined || value === "") {
      return { valid: false, error: `${definition.label} is required` };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { valid: false, error: `${definition.label} is required` };
    }
  }

  // If empty and not required, it's valid
  if (value === null || value === undefined || value === "") {
    return { valid: true };
  }

  const validation = definition.validation;

  // Type-specific validation
  switch (definition.fieldType) {
    case "number":
    case "currency":
      if (typeof value !== "number") {
        return { valid: false, error: `${definition.label} must be a number` };
      }
      if (validation?.min !== undefined && value < validation.min) {
        return {
          valid: false,
          error:
            validation.message || `${definition.label} must be at least ${validation.min}`,
        };
      }
      if (validation?.max !== undefined && value > validation.max) {
        return {
          valid: false,
          error:
            validation.message || `${definition.label} must be at most ${validation.max}`,
        };
      }
      break;

    case "text":
    case "textarea":
    case "url":
    case "email":
    case "phone":
      if (typeof value !== "string") {
        return { valid: false, error: `${definition.label} must be text` };
      }
      if (validation?.min !== undefined && value.length < validation.min) {
        return {
          valid: false,
          error:
            validation.message ||
            `${definition.label} must be at least ${validation.min} characters`,
        };
      }
      if (validation?.max !== undefined && value.length > validation.max) {
        return {
          valid: false,
          error:
            validation.message ||
            `${definition.label} must be at most ${validation.max} characters`,
        };
      }
      if (validation?.pattern) {
        try {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            return {
              valid: false,
              error: validation.message || `${definition.label} format is invalid`,
            };
          }
        } catch {
          // Invalid regex pattern, skip validation
        }
      }
      // Additional email validation
      if (definition.fieldType === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: "Please enter a valid email address" };
        }
      }
      // Additional URL validation
      if (definition.fieldType === "url" && value) {
        try {
          new URL(value);
        } catch {
          return { valid: false, error: "Please enter a valid URL" };
        }
      }
      break;

    case "select":
      if (definition.options) {
        const validValues = definition.options.map((o) => o.value);
        if (!validValues.includes(value as string)) {
          return { valid: false, error: `Invalid selection for ${definition.label}` };
        }
      }
      break;

    case "multiselect":
      if (!Array.isArray(value)) {
        return { valid: false, error: `${definition.label} must be a list` };
      }
      if (definition.options) {
        const validValues = definition.options.map((o) => o.value);
        for (const v of value) {
          if (!validValues.includes(v)) {
            return { valid: false, error: `Invalid selection for ${definition.label}` };
          }
        }
      }
      break;

    case "checkbox":
      if (typeof value !== "boolean") {
        return { valid: false, error: `${definition.label} must be true or false` };
      }
      break;

    case "date":
      if (typeof value !== "number" && typeof value !== "string") {
        return { valid: false, error: `${definition.label} must be a valid date` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Format a field value for display
 */
export function formatFieldValue(
  value: unknown,
  definition: CustomFieldDefinition
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  switch (definition.fieldType) {
    case "checkbox":
      return value ? "Yes" : "No";

    case "date":
      if (typeof value === "number" || typeof value === "string") {
        const date = new Date(value);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return String(value);

    case "currency":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value);
      }
      return String(value);

    case "number":
      if (typeof value === "number") {
        return new Intl.NumberFormat("en-US").format(value);
      }
      return String(value);

    case "select":
      if (definition.options) {
        const option = definition.options.find((o) => o.value === value);
        return option?.label || String(value);
      }
      return String(value);

    case "multiselect":
      if (Array.isArray(value) && definition.options) {
        return value
          .map((v) => {
            const option = definition.options?.find((o) => o.value === v);
            return option?.label || v;
          })
          .join(", ");
      }
      return Array.isArray(value) ? value.join(", ") : String(value);

    case "url":
      return String(value);

    default:
      return String(value);
  }
}
