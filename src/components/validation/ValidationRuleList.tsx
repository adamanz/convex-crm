"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRuleListProps {
  onCreateRule: () => void;
  onEditRule: (ruleId: Id<"validationRules">) => void;
  onViewViolations: (ruleId: Id<"validationRules">) => void;
}

const ENTITY_TYPE_LABELS = {
  contact: "Contact",
  company: "Company",
  deal: "Deal",
};

const RULE_TYPE_LABELS = {
  required: "Required",
  format: "Format",
  range: "Range",
  regex: "Regex",
  unique: "Unique",
  lookup: "Lookup",
};

const RULE_TYPE_ICONS = {
  required: AlertTriangle,
  format: FileWarning,
  range: Search,
  regex: Search,
  unique: ShieldCheck,
  lookup: Search,
};

const RULE_TYPE_COLORS = {
  required: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  format: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  range: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  regex: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  unique: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  lookup: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
};

export function ValidationRuleList({
  onCreateRule,
  onEditRule,
  onViewViolations,
}: ValidationRuleListProps) {
  const [entityFilter, setEntityFilter] = useState<"all" | "contact" | "company" | "deal">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const rules = useQuery(api.validation.listRules, {
    entityType: entityFilter === "all" ? undefined : entityFilter,
    activeOnly: activeFilter === "active" ? true : undefined,
  });

  const updateRule = useMutation(api.validation.updateRule);
  const deleteRule = useMutation(api.validation.deleteRule);

  const handleToggleActive = async (ruleId: Id<"validationRules">, currentActive: boolean) => {
    try {
      await updateRule({ id: ruleId, isActive: !currentActive });
      toast.success(`Rule ${currentActive ? "disabled" : "enabled"}`);
    } catch (error) {
      console.error("Failed to toggle rule:", error);
      toast.error("Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId: Id<"validationRules">) => {
    if (!confirm("Are you sure you want to delete this validation rule?")) {
      return;
    }

    try {
      await deleteRule({ id: ruleId });
      toast.success("Rule deleted successfully");
    } catch (error) {
      console.error("Failed to delete rule:", error);
      toast.error("Failed to delete rule");
    }
  };

  const filteredRules = rules?.filter((rule) => {
    if (activeFilter === "inactive" && rule.isActive) return false;
    return true;
  });

  if (!rules) {
    return <ValidationRuleListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Entity:</span>
          <Select value={entityFilter} onValueChange={(v) => setEntityFilter(v as typeof entityFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="contact">Contacts</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="deal">Deals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Status:</span>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <Button onClick={onCreateRule}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Rules List */}
      {filteredRules && filteredRules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <ShieldCheck className="h-6 w-6 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No validation rules
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create your first validation rule to ensure data quality.
            </p>
            <Button onClick={onCreateRule} className="mt-4">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRules?.map((rule) => {
            const RuleIcon = RULE_TYPE_ICONS[rule.ruleType];
            return (
              <Card
                key={rule._id}
                className={cn(
                  "transition-colors",
                  !rule.isActive && "opacity-60"
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      RULE_TYPE_COLORS[rule.ruleType]
                    )}
                  >
                    <RuleIcon className="h-5 w-5" />
                  </div>

                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {rule.name}
                      </h4>
                      {rule.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Badge variant="outline" className="text-xs">
                        {ENTITY_TYPE_LABELS[rule.entityType]}
                      </Badge>
                      <span>-</span>
                      <span className="font-mono text-xs">{rule.field}</span>
                      <span>-</span>
                      <span>{RULE_TYPE_LABELS[rule.ruleType]}</span>
                    </div>
                    {rule.description && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {rule.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggleActive(rule._id, rule.isActive)}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditRule(rule._id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewViolations(rule._id)}>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          View Violations
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteRule(rule._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Rule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ValidationRuleListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <div className="flex-1" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-8 w-8" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ValidationRuleList;
