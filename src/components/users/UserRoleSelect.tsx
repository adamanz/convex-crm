"use client";

import * as React from "react";
import { Shield, UserCog, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/users";

interface UserRoleSelectProps {
  value: UserRole;
  onValueChange: (value: UserRole) => void;
  disabled?: boolean;
  className?: string;
}

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; description: string; icon: React.ElementType }
> = {
  admin: {
    label: "Admin",
    description: "Full access to all features",
    icon: Shield,
  },
  manager: {
    label: "Manager",
    description: "Can manage team members",
    icon: UserCog,
  },
  member: {
    label: "Member",
    description: "Standard user access",
    icon: User,
  },
};

export function UserRoleSelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: UserRoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as UserRole)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder="Select a role">
          <div className="flex items-center gap-2">
            {React.createElement(ROLE_CONFIG[value].icon, {
              className: "h-4 w-4",
            })}
            <span>{ROLE_CONFIG[value].label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          return (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default UserRoleSelect;
