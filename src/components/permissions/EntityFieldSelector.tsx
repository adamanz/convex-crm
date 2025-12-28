"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export type EntityType = "contact" | "company" | "deal";

interface EntityFieldSelectorProps {
  value: EntityType;
  onChange: (value: EntityType) => void;
  label?: string;
  className?: string;
}

const entityConfig = {
  contact: {
    label: "Contacts",
    icon: Users,
    description: "People in your CRM",
  },
  company: {
    label: "Companies",
    icon: Building2,
    description: "Organizations and accounts",
  },
  deal: {
    label: "Deals",
    icon: DollarSign,
    description: "Sales opportunities",
  },
};

export function EntityFieldSelector({
  value,
  onChange,
  label,
  className,
}: EntityFieldSelectorProps) {
  const config = entityConfig[value];
  const Icon = config.icon;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={(v) => onChange(v as EntityType)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(entityConfig).map(([entityValue, cfg]) => {
            const ItemIcon = cfg.icon;
            return (
              <SelectItem key={entityValue} value={entityValue}>
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {cfg.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EntityTabs({
  value,
  onChange,
  className,
}: {
  value: EntityType;
  onChange: (value: EntityType) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {Object.entries(entityConfig).map(([entityValue, cfg]) => {
        const Icon = cfg.icon;
        const isActive = value === entityValue;

        return (
          <button
            key={entityValue}
            onClick={() => onChange(entityValue as EntityType)}
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

export default EntityFieldSelector;
