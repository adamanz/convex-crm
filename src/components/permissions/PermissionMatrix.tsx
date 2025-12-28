"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionCell, PermissionLevel } from "./PermissionCell";
import { EntityTabs, EntityType } from "./EntityFieldSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RotateCcw, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PermissionMatrixProps {
  className?: string;
}

interface MatrixRow {
  field: string;
  label: string;
  isCustom: boolean;
  required: boolean;
  admin: PermissionLevel;
  manager: PermissionLevel;
  member: PermissionLevel;
}

export function PermissionMatrix({ className }: PermissionMatrixProps) {
  const [entityType, setEntityType] = React.useState<EntityType>("contact");
  const [pendingChanges, setPendingChanges] = React.useState<
    Map<string, { role: string; permission: PermissionLevel }>
  >(new Map());
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch the permission matrix
  const matrix = useQuery(api.permissions.getPermissionMatrix, { entityType });
  const setPermissions = useMutation(api.permissions.setPermissions);
  const resetPermissions = useMutation(api.permissions.resetPermissions);

  const handlePermissionChange = (
    field: string,
    role: "admin" | "manager" | "member",
    permission: PermissionLevel
  ) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(`${field}:${role}`, { role, permission });
      return next;
    });
  };

  const getEffectivePermission = (
    row: MatrixRow,
    role: "admin" | "manager" | "member"
  ): PermissionLevel => {
    const key = `${row.field}:${role}`;
    const pending = pendingChanges.get(key);
    if (pending) {
      return pending.permission;
    }
    return row[role];
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      const permissions: Array<{
        entityType: "contact" | "company" | "deal";
        field: string;
        role: "admin" | "manager" | "member";
        permission: "read" | "write" | "hidden";
      }> = [];

      for (const [key, value] of pendingChanges) {
        const [field] = key.split(":");
        permissions.push({
          entityType,
          field,
          role: value.role as "admin" | "manager" | "member",
          permission: value.permission,
        });
      }

      await setPermissions({ permissions });
      setPendingChanges(new Map());
      toast.success(`Saved ${permissions.length} permission changes`);
    } catch (error) {
      toast.error("Failed to save permissions");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset all permissions for ${entityType}s? This will restore default permissions.`)) {
      return;
    }

    setIsSaving(true);
    try {
      await resetPermissions({ entityType });
      setPendingChanges(new Map());
      toast.success("Permissions reset to defaults");
    } catch (error) {
      toast.error("Failed to reset permissions");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
  };

  if (matrix === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Cast matrix rows to MatrixRow type (API returns string, we know they're PermissionLevel)
  const typedMatrix = matrix as unknown as MatrixRow[];

  const hasChanges = pendingChanges.size > 0;
  const standardFields = typedMatrix.filter((row) => !row.isCustom);
  const customFields = typedMatrix.filter((row) => row.isCustom);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with entity selector and actions */}
      <div className="flex items-center justify-between">
        <EntityTabs value={entityType} onChange={setEntityType} />
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleDiscardChanges} disabled={isSaving}>
                Discard
              </Button>
              <Badge variant="secondary" className="text-amber-600">
                {pendingChanges.size} unsaved changes
              </Badge>
            </>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permission Levels</CardTitle>
          <CardDescription>
            Set field-level permissions for each role. Changes take effect immediately after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span><strong>Write</strong> - Can view and edit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span><strong>Read</strong> - Can view only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-400" />
              <span><strong>Hidden</strong> - Field is not visible</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standard Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Fields</CardTitle>
          <CardDescription>
            Core fields for {entityType}s. Required fields cannot be hidden for admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Field</TableHead>
                <TableHead className="w-[150px]">Admin</TableHead>
                <TableHead className="w-[150px]">Manager</TableHead>
                <TableHead className="w-[150px]">Member</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standardFields.map((row) => (
                <TableRow
                  key={row.field}
                  className={cn(
                    pendingChanges.has(`${row.field}:admin`) ||
                    pendingChanges.has(`${row.field}:manager`) ||
                    pendingChanges.has(`${row.field}:member`)
                      ? "bg-amber-50 dark:bg-amber-950/20"
                      : ""
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.label}</span>
                      {row.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PermissionCell
                      permission={getEffectivePermission(row, "admin")}
                      onChange={(perm) => handlePermissionChange(row.field, "admin", perm)}
                      disabled={isSaving || (row.required && getEffectivePermission(row, "admin") !== "hidden")}
                    />
                  </TableCell>
                  <TableCell>
                    <PermissionCell
                      permission={getEffectivePermission(row, "manager")}
                      onChange={(perm) => handlePermissionChange(row.field, "manager", perm)}
                      disabled={isSaving}
                    />
                  </TableCell>
                  <TableCell>
                    <PermissionCell
                      permission={getEffectivePermission(row, "member")}
                      onChange={(perm) => handlePermissionChange(row.field, "member", perm)}
                      disabled={isSaving}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custom Fields Table */}
      {customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>
              Custom fields you've created for {entityType}s.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Field</TableHead>
                  <TableHead className="w-[150px]">Admin</TableHead>
                  <TableHead className="w-[150px]">Manager</TableHead>
                  <TableHead className="w-[150px]">Member</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((row) => (
                  <TableRow
                    key={row.field}
                    className={cn(
                      pendingChanges.has(`${row.field}:admin`) ||
                      pendingChanges.has(`${row.field}:manager`) ||
                      pendingChanges.has(`${row.field}:member`)
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : ""
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          Custom
                        </Badge>
                        {row.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PermissionCell
                        permission={getEffectivePermission(row, "admin")}
                        onChange={(perm) => handlePermissionChange(row.field, "admin", perm)}
                        disabled={isSaving}
                      />
                    </TableCell>
                    <TableCell>
                      <PermissionCell
                        permission={getEffectivePermission(row, "manager")}
                        onChange={(perm) => handlePermissionChange(row.field, "manager", perm)}
                        disabled={isSaving}
                      />
                    </TableCell>
                    <TableCell>
                      <PermissionCell
                        permission={getEffectivePermission(row, "member")}
                        onChange={(perm) => handlePermissionChange(row.field, "member", perm)}
                        disabled={isSaving}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {customFields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Custom Fields</h3>
            <p className="text-muted-foreground text-center mt-2">
              You haven't created any custom fields for {entityType}s yet.
              <br />
              Custom fields can be configured in the Custom Fields settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PermissionMatrix;
