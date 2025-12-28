"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  FileText,
  DollarSign,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ApprovalRuleForm } from "./ApprovalRuleForm";

interface ApprovalRuleListProps {
  entityType?: "quote" | "deal";
  className?: string;
}

export function ApprovalRuleList({ entityType, className }: ApprovalRuleListProps) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<any>(null);
  const [deletingRuleId, setDeletingRuleId] = React.useState<Id<"approvalRules"> | null>(null);

  const rules = useQuery(api.approvals.listRules, {
    entityType,
    activeOnly: false,
  });

  const updateRule = useMutation(api.approvals.updateRule);
  const deleteRule = useMutation(api.approvals.deleteRule);

  const handleToggleActive = async (
    ruleId: Id<"approvalRules">,
    currentActive: boolean
  ) => {
    try {
      await updateRule({ id: ruleId, isActive: !currentActive });
      toast.success(`Rule ${!currentActive ? "activated" : "deactivated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update rule");
    }
  };

  const handleDelete = async () => {
    if (!deletingRuleId) return;

    try {
      await deleteRule({ id: deletingRuleId });
      toast.success("Approval rule deleted");
      setDeletingRuleId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rule");
    }
  };

  if (rules === undefined) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Approval Rules</h2>
            <p className="text-sm text-muted-foreground">
              Configure when approvals are required
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const deletingRule = rules.find((r) => r._id === deletingRuleId);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Approval Rules</h2>
          <p className="text-sm text-muted-foreground">
            Configure when approvals are required for{" "}
            {entityType ? `${entityType}s` : "quotes and deals"}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No approval rules</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create approval rules to require approvals for quotes or deals
              that meet specific conditions.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule._id}
              rule={rule}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => setDeletingRuleId(rule._id)}
              onToggleActive={() => handleToggleActive(rule._id, rule.isActive)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Approval Rule</DialogTitle>
            <DialogDescription>
              Define conditions that require approval before proceeding.
            </DialogDescription>
          </DialogHeader>
          <ApprovalRuleForm
            onSubmit={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Approval Rule</DialogTitle>
            <DialogDescription>
              Update the conditions and approvers for this rule.
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <ApprovalRuleForm
              initialData={editingRule}
              onSubmit={() => setEditingRule(null)}
              onCancel={() => setEditingRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingRuleId}
        onOpenChange={(open) => !open && setDeletingRuleId(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Approval Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{deletingRule?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRuleId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RuleCardProps {
  rule: {
    _id: Id<"approvalRules">;
    name: string;
    description?: string;
    entityType: "quote" | "deal";
    conditions: Array<{ field: string; operator: string; value: any }>;
    approvers: Id<"users">[];
    approverDetails?: Array<{
      _id: Id<"users">;
      firstName?: string;
      lastName?: string;
      email: string;
      avatarUrl?: string;
    }>;
    approvalType: "any" | "all" | "sequential";
    priority?: number;
    isActive: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function RuleCard({ rule, onEdit, onDelete, onToggleActive }: RuleCardProps) {
  const approvalTypeLabels = {
    any: "Any",
    all: "All",
    sequential: "Sequential",
  };

  const operatorLabels: Record<string, string> = {
    equals: "=",
    notEquals: "!=",
    greaterThan: ">",
    lessThan: "<",
    greaterThanOrEqual: ">=",
    lessThanOrEqual: "<=",
    contains: "contains",
    in: "in",
  };

  return (
    <Card className={cn(!rule.isActive && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                rule.entityType === "deal"
                  ? "bg-blue-100 dark:bg-blue-950"
                  : "bg-purple-100 dark:bg-purple-950"
              )}
            >
              {rule.entityType === "deal" ? (
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                {rule.name}
                {!rule.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </h3>
              {rule.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {rule.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={onToggleActive}
              aria-label={rule.isActive ? "Deactivate rule" : "Activate rule"}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-4 text-sm">
          {/* Conditions */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Conditions
            </p>
            <div className="flex flex-wrap gap-1">
              {rule.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="text-xs font-mono">
                  {condition.field} {operatorLabels[condition.operator] || condition.operator}{" "}
                  {Array.isArray(condition.value)
                    ? condition.value.join(", ")
                    : String(condition.value)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Approvers */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Approvers ({approvalTypeLabels[rule.approvalType]})
            </p>
            <div className="flex items-center gap-1">
              {rule.approverDetails?.slice(0, 4).map((approver) => {
                const initials =
                  `${approver.firstName?.[0] ?? ""}${approver.lastName?.[0] ?? ""}`.toUpperCase() ||
                  approver.email[0].toUpperCase();
                return (
                  <Avatar key={approver._id} className="h-6 w-6">
                    <AvatarImage src={approver.avatarUrl} />
                    <AvatarFallback className="text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {(rule.approverDetails?.length ?? 0) > 4 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{(rule.approverDetails?.length ?? 0) - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Priority */}
          {rule.priority !== undefined && rule.priority > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Priority
              </p>
              <Badge variant="secondary" className="text-xs">
                {rule.priority}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ApprovalRuleList;
