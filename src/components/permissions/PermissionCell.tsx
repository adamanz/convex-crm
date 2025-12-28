"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type PermissionLevel = "read" | "write" | "hidden";

interface PermissionCellProps {
  permission: PermissionLevel;
  onChange: (permission: PermissionLevel) => void;
  disabled?: boolean;
  showBadge?: boolean;
  className?: string;
}

const permissionConfig = {
  write: {
    label: "Write",
    icon: Pencil,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Can view and edit",
  },
  read: {
    label: "Read",
    icon: Eye,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "Can view only",
  },
  hidden: {
    label: "Hidden",
    icon: EyeOff,
    color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    description: "Cannot access",
  },
};

export function PermissionCell({
  permission,
  onChange,
  disabled = false,
  showBadge = false,
  className,
}: PermissionCellProps) {
  const config = permissionConfig[permission];
  const Icon = config.icon;

  if (showBadge) {
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1", config.color, className)}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <Select
      value={permission}
      onValueChange={(value) => onChange(value as PermissionLevel)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[120px]", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(permissionConfig).map(([value, cfg]) => {
          const ItemIcon = cfg.icon;
          return (
            <SelectItem key={value} value={value}>
              <div className="flex items-center gap-2">
                <ItemIcon className="h-3.5 w-3.5" />
                <span>{cfg.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({cfg.description})
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function PermissionBadge({
  permission,
  className,
}: {
  permission: PermissionLevel;
  className?: string;
}) {
  const config = permissionConfig[permission];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1", config.color, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default PermissionCell;
