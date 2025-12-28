"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CommentItem, CommentData } from "./CommentItem";
import { cn } from "@/lib/utils";
import { MessageSquare, Loader2 } from "lucide-react";

interface CommentListProps {
  entityType: "contact" | "company" | "deal" | "activity";
  entityId: string;
  currentUserId: Id<"users">;
  onReply?: (parentId: Id<"comments">) => void;
  className?: string;
}

export function CommentList({
  entityType,
  entityId,
  currentUserId,
  onReply,
  className,
}: CommentListProps) {
  const commentsResult = useQuery(api.comments.list, {
    entityType,
    entityId,
    limit: 50,
    includeReplies: false, // Only top-level comments
  });

  // Loading state
  if (commentsResult === undefined) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Empty state
  if (commentsResult.items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center",
          className
        )}
      >
        <MessageSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-500">No comments yet</p>
        <p className="text-xs text-zinc-400">Be the first to add a comment</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {commentsResult.items.map((comment) => (
        <CommentWithReplies
          key={comment._id}
          comment={comment as CommentData}
          currentUserId={currentUserId}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

interface CommentWithRepliesProps {
  comment: CommentData;
  currentUserId: Id<"users">;
  onReply?: (parentId: Id<"comments">) => void;
}

function CommentWithReplies({
  comment,
  currentUserId,
  onReply,
}: CommentWithRepliesProps) {
  // Fetch replies for this comment
  const replies = useQuery(
    api.comments.getReplies,
    comment.replyCount && comment.replyCount > 0
      ? { parentId: comment._id }
      : "skip"
  );

  return (
    <div className="space-y-3">
      {/* Main comment */}
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        onReply={onReply}
        showReplyButton={true}
      />

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply as CommentData}
              currentUserId={currentUserId}
              isReply={true}
              showReplyButton={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
