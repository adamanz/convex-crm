"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: Id<"approvalRequests">;
  entityType: "quote" | "deal";
  entityName: string;
  userId: Id<"users">;
  mode: "approve" | "reject";
}

export function ApprovalDialog({
  open,
  onOpenChange,
  requestId,
  entityType,
  entityName,
  userId,
  mode,
}: ApprovalDialogProps) {
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const approve = useMutation(api.approvals.approve);
  const reject = useMutation(api.approvals.reject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "reject" && !comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "approve") {
        await approve({
          requestId,
          userId,
          comment: comment.trim() || undefined,
        });
        toast.success(`${entityType === "quote" ? "Quote" : "Deal"} approved successfully`);
      } else {
        await reject({
          requestId,
          userId,
          reason: comment.trim(),
        });
        toast.success(`${entityType === "quote" ? "Quote" : "Deal"} rejected`);
      }
      onOpenChange(false);
      setComment("");
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApprove = mode === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {isApprove ? "Approve" : "Reject"} {entityType === "quote" ? "Quote" : "Deal"}
            </DialogTitle>
            <DialogDescription>
              {isApprove
                ? `Are you sure you want to approve "${entityName}"?`
                : `Please provide a reason for rejecting "${entityName}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {isApprove ? "Comment (optional)" : "Reason for rejection"}{" "}
                {!isApprove && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  isApprove
                    ? "Add a comment about this approval..."
                    : "Explain why this is being rejected..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className={cn(
                  !isApprove && !comment.trim() && "border-amber-500 focus-visible:ring-amber-500"
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isApprove ? "default" : "destructive"}
              disabled={isSubmitting || (!isApprove && !comment.trim())}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isApprove ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApprovalDialog;
