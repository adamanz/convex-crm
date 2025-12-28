"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCallback, useMemo } from "react";

type EntityType = "contact" | "company" | "deal";
type Role = "admin" | "manager" | "member";
type PermissionLevel = "read" | "write" | "hidden";

/**
 * Hook for accessing field permissions in components
 * Provides utilities for checking field access and filtering data
 */
export function useFieldPermissions(
  role: Role,
  entityType: EntityType
) {
  // Get fields for the current role
  const fieldsData = useQuery(api.permissions.getFieldsForRole, {
    role,
    entityType,
  });

  // Get form fields with visibility and editability info
  const formFields = useQuery(api.permissions.getFormFields, {
    role,
    entityType,
  });

  // Get the permission matrix for display purposes
  const permissionMatrix = useQuery(api.permissions.getPermissionMatrix, {
    entityType,
  });

  // Mutations
  const setPermission = useMutation(api.permissions.setPermission);
  const setPermissionsBulk = useMutation(api.permissions.setPermissions);
  const resetPermissions = useMutation(api.permissions.resetPermissions);

  // Check if a specific field is visible
  const isFieldVisible = useCallback(
    (fieldName: string): boolean => {
      if (!fieldsData) return true; // Default to visible while loading
      return fieldsData.visibleFields.includes(fieldName);
    },
    [fieldsData]
  );

  // Check if a specific field is editable
  const isFieldEditable = useCallback(
    (fieldName: string): boolean => {
      if (!fieldsData) return role !== "member"; // Default based on role
      return fieldsData.editableFields.includes(fieldName);
    },
    [fieldsData, role]
  );

  // Check if a specific field is hidden
  const isFieldHidden = useCallback(
    (fieldName: string): boolean => {
      if (!fieldsData) return false;
      return fieldsData.hiddenFields.includes(fieldName);
    },
    [fieldsData]
  );

  // Get permission level for a field
  const getFieldPermission = useCallback(
    (fieldName: string): PermissionLevel => {
      if (!fieldsData) {
        // Default permissions based on role
        return role === "member" ? "read" : "write";
      }

      if (fieldsData.hiddenFields.includes(fieldName)) {
        return "hidden";
      }
      if (fieldsData.editableFields.includes(fieldName)) {
        return "write";
      }
      if (fieldsData.visibleFields.includes(fieldName)) {
        return "read";
      }
      return "hidden";
    },
    [fieldsData, role]
  );

  // Apply field mask to an entity - removes hidden fields
  const applyFieldMask = useCallback(
    <T extends Record<string, unknown>>(entity: T): Partial<T> => {
      if (!fieldsData || !entity) return entity;

      const maskedEntity: Partial<T> = {};
      for (const [key, value] of Object.entries(entity)) {
        if (!fieldsData.hiddenFields.includes(key)) {
          (maskedEntity as Record<string, unknown>)[key] = value;
        }
      }
      return maskedEntity;
    },
    [fieldsData]
  );

  // Filter form fields to only include visible ones
  const visibleFormFields = useMemo(() => {
    if (!formFields) return [];
    return formFields.filter((field) => field.visible);
  }, [formFields]);

  // Get read-only fields for form rendering
  const readOnlyFields = useMemo(() => {
    if (!formFields) return new Set<string>();
    return new Set(
      formFields
        .filter((field) => field.visible && !field.editable)
        .map((field) => field.field)
    );
  }, [formFields]);

  // Filter table columns based on permissions
  const filterColumns = useCallback(
    <T extends { accessorKey?: string; id?: string }>(columns: T[]): T[] => {
      if (!fieldsData) return columns;

      return columns.filter((column) => {
        const fieldName = column.accessorKey || column.id;
        if (!fieldName) return true; // Keep columns without field reference

        // Always show system columns (select, actions, etc.)
        if (fieldName === "select" || fieldName === "actions") return true;

        return !fieldsData.hiddenFields.includes(fieldName);
      });
    },
    [fieldsData]
  );

  // Update a single permission
  const updatePermission = useCallback(
    async (
      field: string,
      targetRole: Role,
      permission: PermissionLevel
    ) => {
      return setPermission({
        entityType,
        field,
        role: targetRole,
        permission,
      });
    },
    [entityType, setPermission]
  );

  // Bulk update permissions
  const updatePermissions = useCallback(
    async (
      permissions: Array<{
        field: string;
        role: Role;
        permission: PermissionLevel;
      }>
    ) => {
      return setPermissionsBulk({
        permissions: permissions.map((p) => ({
          entityType,
          field: p.field,
          role: p.role,
          permission: p.permission,
        })),
      });
    },
    [entityType, setPermissionsBulk]
  );

  // Reset all permissions for this entity type
  const resetAllPermissions = useCallback(async () => {
    return resetPermissions({ entityType });
  }, [entityType, resetPermissions]);

  return {
    // Loading state
    isLoading: fieldsData === undefined,

    // Field access checks
    isFieldVisible,
    isFieldEditable,
    isFieldHidden,
    getFieldPermission,

    // Data filtering
    applyFieldMask,
    filterColumns,

    // Form rendering helpers
    formFields: formFields ?? [],
    visibleFormFields,
    readOnlyFields,

    // Raw data
    visibleFields: fieldsData?.visibleFields ?? [],
    editableFields: fieldsData?.editableFields ?? [],
    hiddenFields: fieldsData?.hiddenFields ?? [],
    allFields: fieldsData?.allFields ?? [],
    permissionMatrix,

    // Mutations
    updatePermission,
    updatePermissions,
    resetAllPermissions,
  };
}

/**
 * Hook for checking a single field's access
 * Lighter weight than the full useFieldPermissions hook
 */
export function useFieldAccess(
  role: Role,
  entityType: EntityType,
  field: string
) {
  const accessData = useQuery(api.permissions.checkFieldAccess, {
    role,
    entityType,
    field,
    accessType: "read",
  });

  const writeAccessData = useQuery(api.permissions.checkFieldAccess, {
    role,
    entityType,
    field,
    accessType: "write",
  });

  return {
    isLoading: accessData === undefined,
    canRead: accessData?.allowed ?? true,
    canWrite: writeAccessData?.allowed ?? role !== "member",
    permission: accessData?.permission ?? (role === "member" ? "read" : "write"),
  };
}

/**
 * Hook for permission matrix editing (admin UI)
 */
export function usePermissionMatrix(entityType: EntityType) {
  const matrix = useQuery(api.permissions.getPermissionMatrix, { entityType });
  const availableFields = useQuery(api.permissions.getAvailableFields, { entityType });
  const setPermissions = useMutation(api.permissions.setPermissions);
  const resetPermissions = useMutation(api.permissions.resetPermissions);

  const updateMatrix = useCallback(
    async (
      changes: Array<{
        field: string;
        role: Role;
        permission: PermissionLevel;
      }>
    ) => {
      return setPermissions({
        permissions: changes.map((c) => ({
          entityType,
          field: c.field,
          role: c.role,
          permission: c.permission,
        })),
      });
    },
    [entityType, setPermissions]
  );

  const reset = useCallback(async () => {
    return resetPermissions({ entityType });
  }, [entityType, resetPermissions]);

  return {
    isLoading: matrix === undefined,
    matrix: matrix ?? [],
    availableFields: availableFields ?? [],
    updateMatrix,
    reset,
  };
}

export default useFieldPermissions;
