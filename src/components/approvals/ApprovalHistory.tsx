"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";

interface ApprovalHistoryProps {
  entityType: "quote" | "deal";
  entityId: string;
  className?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export function ApprovalHistory({
  entityType,
  entityId,
  className,
  maxItems,
  showTitle = true,
}: ApprovalHistoryProps) {
  const [expanded, setExpanded] = React.useState(false);

  const requests = useQuery(api.approvals.listRequests, {
    entityType,
    entityId,
  });

  if (requests === undefined) {
    return (
      <div className={cn("space-y-3", className)}>
        {showTitle && (
          <h3 className="text-sm font-medium">Approval History</h3>
        )}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {showTitle && (
          <h3 className="text-sm font-medium">Approval History</h3>
        )}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No approval requests yet</p>
        </div>
      </div>
    );
  }

  const displayRequests =
    maxItems && !expanded ? requests.slice(0, maxItems) : requests;
  const hasMore = maxItems && requests.length > maxItems;

  return (
    <div className={cn("space-y-3", className)}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Approval History</h3>
          <Badge variant="secondary" className="text-xs">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {displayRequests.map((request) => (
          <ApprovalHistoryItem key={request._id} request={request} />
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Show {requests.length - (maxItems ?? 0)} more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

interface ApprovalHistoryItemProps {
  request: {
    _id: Id<"approvalRequests">;
    ruleName: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: number;
    completedAt?: number;
    approvalType: "any" | "all" | "sequential";
    requiredApprovers: Id<"users">[];
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
    approverDetails?: Array<{
      _id: Id<"users">;
      firstName?: string;
      lastName?: string;
      email: string;
      avatarUrl?: string;
    }>;
  };
}

function ApprovalHistoryItem({ request }: ApprovalHistoryItemProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-950",
      label: "Pending",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100 dark:bg-emerald-950",
      label: "Approved",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-950",
      label: "Rejected",
    },
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  const requesterName = request.requestedByUser
    ? `${request.requestedByUser.firstName ?? ""} ${request.requestedByUser.lastName ?? ""}`.trim() ||
      request.requestedByUser.email
    : "Unknown";

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-full p-1", config.bgColor)}>
            <StatusIcon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
          <div>
            <p className="text-sm font-medium">{request.ruleName}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(request.requestedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Badge
          variant={
            request.status === "approved"
              ? "success"
              : request.status === "rejected"
                ? "destructive"
                : "warning"
          }
          className="text-xs"
        >
          {config.label}
        </Badge>
      </div>

      {/* Requester */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Send className="h-3 w-3" />
        <span>Requested by {requesterName}</span>
      </div>

      {/* Timeline of responses */}
      {request.responses.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Responses
          </p>
          <div className="space-y-2">
            {request.responses.map((response, index) => {
              // Find the approver details
              const approver = request.approverDetails?.find(
                (a) => a._id === response.userId
              );
              const approverName = approver
                ? `${approver.firstName ?? ""} ${approver.lastName ?? ""}`.trim() ||
                  approver.email
                : "Unknown";
              const approverInitials = approver
                ? `${approver.firstName?.[0] ?? ""}${approver.lastName?.[0] ?? ""}`.toUpperCase() ||
                  approver.email[0].toUpperCase()
                : "?";

              return (
                <div key={index} className="flex items-start gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={approver?.avatarUrl} />
                    <AvatarFallback className="text-[8px]">
                      {approverInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">
                        {approverName}
                      </span>
                      {response.decision === "approved" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                    </div>
                    {response.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        &quot;{response.comment}&quot;
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(response.decidedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending approvers */}
      {request.status === "pending" && (
        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Waiting for approval from
          </p>
          <div className="flex flex-wrap gap-1">
            {request.approverDetails
              ?.filter(
                (approver) =>
                  !request.responses.some((r) => r.userId === approver._id)
              )
              .map((approver) => (
                <Badge key={approver._id} variant="outline" className="text-xs">
                  {`${approver.firstName ?? ""} ${approver.lastName ?? ""}`.trim() ||
                    approver.email}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalHistory;
