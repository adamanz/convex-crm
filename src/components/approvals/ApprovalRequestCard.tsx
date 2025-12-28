"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatus, ApprovalTypeIndicator } from "./ApprovalStatus";
import { ApprovalDialog } from "./ApprovalDialog";
import {
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  Clock,
  User,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ApprovalRequestCardProps {
  request: {
    _id: Id<"approvalRequests">;
    ruleName: string;
    entityType: "quote" | "deal";
    entityId: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: number;
    currentStep?: number;
    requiredApprovers: Id<"users">[];
    approvalType: "any" | "all" | "sequential";
    responses: Array<{
      userId: Id<"users">;
      decision: "approved" | "rejected";
      comment?: string;
      decidedAt: number;
    }>;
    requestedByUser?: {
      firstName?: string;
      lastName?: string;
      email: string;
      avatarUrl?: string;
    } | null;
    entityName?: string;
    entityDetails?: {
      amount?: number;
      total?: number;
      status?: string;
    };
  };
  userId: Id<"users">;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function ApprovalRequestCard({
  request,
  userId,
  showActions = true,
  compact = false,
  className,
}: ApprovalRequestCardProps) {
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);

  const requesterName = request.requestedByUser
    ? `${request.requestedByUser.firstName ?? ""} ${request.requestedByUser.lastName ?? ""}`.trim() ||
      request.requestedByUser.email
    : "Unknown";

  const requesterInitials = request.requestedByUser
    ? `${request.requestedByUser.firstName?.[0] ?? ""}${request.requestedByUser.lastName?.[0] ?? ""}`.toUpperCase() ||
      request.requestedByUser.email[0].toUpperCase()
    : "?";

  const amount = request.entityDetails?.amount ?? request.entityDetails?.total;
  const formattedAmount = amount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    : null;

  // Check if current user can approve/reject
  const canRespond =
    request.status === "pending" &&
    request.requiredApprovers.includes(userId) &&
    !request.responses.some((r) => r.userId === userId);

  // For sequential, also check if it's their turn
  const isUsersTurn =
    request.approvalType !== "sequential" ||
    request.requiredApprovers[request.currentStep ?? 0] === userId;

  const showActionButtons = showActions && canRespond && isUsersTurn;

  const entityLink = `/${request.entityType}s/${request.entityId}`;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-3 rounded-lg border",
          "bg-card hover:bg-accent/50 transition-colors",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              request.entityType === "deal" ? "bg-blue-100 dark:bg-blue-950" : "bg-purple-100 dark:bg-purple-950"
            )}
          >
            {request.entityType === "deal" ? (
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={entityLink}
              className="text-sm font-medium hover:underline truncate block"
            >
              {request.entityName || `${request.entityType} ${request.entityId}`}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {request.ruleName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {formattedAmount && (
            <Badge variant="outline" className="text-xs">
              {formattedAmount}
            </Badge>
          )}
          {showActionButtons ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                onClick={() => setApproveDialogOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ApprovalStatus status={request.status} size="sm" />
          )}
        </div>

        <ApprovalDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          requestId={request._id}
          entityType={request.entityType}
          entityName={request.entityName || request.entityId}
          userId={userId}
          mode="approve"
        />
        <ApprovalDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          requestId={request._id}
          entityType={request.entityType}
          entityName={request.entityName || request.entityId}
          userId={userId}
          mode="reject"
        />
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                request.entityType === "deal" ? "bg-blue-100 dark:bg-blue-950" : "bg-purple-100 dark:bg-purple-950"
              )}
            >
              {request.entityType === "deal" ? (
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <Link
                href={entityLink}
                className="text-base font-semibold hover:underline flex items-center gap-1"
              >
                {request.entityName || `${request.entityType} ${request.entityId}`}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <p className="text-sm text-muted-foreground">{request.ruleName}</p>
            </div>
          </div>
          <ApprovalStatus status={request.status} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={request.requestedByUser?.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {requesterInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                Requested by <span className="text-foreground">{requesterName}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
            </span>
          </div>

          {formattedAmount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formattedAmount}</span>
            </div>
          )}

          <ApprovalTypeIndicator
            approvalType={request.approvalType}
            currentStep={request.currentStep}
            totalSteps={request.requiredApprovers.length}
          />
        </div>

        {/* Response history */}
        {request.responses.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Response History
            </p>
            <div className="space-y-2">
              {request.responses.map((response, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs"
                >
                  {response.decision === "approved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <span className="text-muted-foreground">
                      {response.decision === "approved" ? "Approved" : "Rejected"}
                    </span>
                    {response.comment && (
                      <p className="text-muted-foreground mt-0.5">
                        &quot;{response.comment}&quot;
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(response.decidedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {showActionButtons && (
        <CardFooter className="border-t bg-muted/50 py-3">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setApproveDialogOpen(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </CardFooter>
      )}

      <ApprovalDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        requestId={request._id}
        entityType={request.entityType}
        entityName={request.entityName || request.entityId}
        userId={userId}
        mode="approve"
      />
      <ApprovalDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        requestId={request._id}
        entityType={request.entityType}
        entityName={request.entityName || request.entityId}
        userId={userId}
        mode="reject"
      />
    </Card>
  );
}

export default ApprovalRequestCard;
