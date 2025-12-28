"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

type ApprovalStatusType = "pending" | "approved" | "rejected";

interface ApprovalStatusProps {
  status: ApprovalStatusType;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  ApprovalStatusType,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
    icon: React.ElementType;
    iconColor: string;
  }
> = {
  pending: {
    label: "Pending Approval",
    variant: "warning",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  approved: {
    label: "Approved",
    variant: "success",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
    iconColor: "text-red-500",
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function ApprovalStatus({
  status,
  className,
  showIcon = true,
  size = "md",
}: ApprovalStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1.5", sizeClasses[size], className)}
    >
      {showIcon && (
        <Icon className={cn(iconSizeClasses[size], config.iconColor)} />
      )}
      {config.label}
    </Badge>
  );
}

interface ApprovalTypeIndicatorProps {
  approvalType: "any" | "all" | "sequential";
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export function ApprovalTypeIndicator({
  approvalType,
  currentStep,
  totalSteps,
  className,
}: ApprovalTypeIndicatorProps) {
  const typeLabels: Record<string, string> = {
    any: "Any Approver",
    all: "All Approvers",
    sequential: "Sequential",
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span>{typeLabels[approvalType]}</span>
      {approvalType === "sequential" &&
        currentStep !== undefined &&
        totalSteps !== undefined && (
          <Badge variant="outline" className="text-xs">
            Step {currentStep + 1} of {totalSteps}
          </Badge>
        )}
    </div>
  );
}

export default ApprovalStatus;
