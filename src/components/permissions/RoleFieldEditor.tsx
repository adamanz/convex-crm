"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionCell, PermissionLevel } from "./PermissionCell";
import { Shield, ShieldCheck, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "admin" | "manager" | "member";

interface FieldPermission {
  field: string;
  label: string;
  isCustom: boolean;
  required: boolean;
  permission: PermissionLevel;
}

interface RoleFieldEditorProps {
  role: Role;
  fields: FieldPermission[];
  onPermissionChange: (field: string, permission: PermissionLevel) => void;
  onResetToDefaults?: () => void;
  isLoading?: boolean;
  className?: string;
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    description: "Full access to all fields",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    description: "Can manage most fields",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  member: {
    label: "Member",
    icon: User,
    description: "Limited field access",
    color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
};

export function RoleFieldEditor({
  role,
  fields,
  onPermissionChange,
  onResetToDefaults,
  isLoading = false,
  className,
}: RoleFieldEditorProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  // Group fields into standard and custom
  const standardFields = fields.filter((f) => !f.isCustom);
  const customFields = fields.filter((f) => f.isCustom);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{config.label}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          {onResetToDefaults && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToDefaults}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Standard Fields */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Standard Fields</h4>
          <div className="space-y-2">
            {standardFields.map((field) => (
              <div
                key={field.field}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <PermissionCell
                  permission={field.permission}
                  onChange={(perm) => onPermissionChange(field.field, perm)}
                  disabled={isLoading || (field.required && role === "admin")}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div className="space-y-4 mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Custom Fields</h4>
            <div className="space-y-2">
              {customFields.map((field) => (
                <div
                  key={field.field}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      Custom
                    </Badge>
                    {field.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <PermissionCell
                    permission={field.permission}
                    onChange={(perm) => onPermissionChange(field.field, perm)}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleTabs({
  value,
  onChange,
  className,
}: {
  value: Role;
  onChange: (value: Role) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {Object.entries(roleConfig).map(([roleValue, cfg]) => {
        const Icon = cfg.icon;
        const isActive = value === roleValue;

        return (
          <button
            key={roleValue}
            onClick={() => onChange(roleValue as Role)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

export default RoleFieldEditor;
