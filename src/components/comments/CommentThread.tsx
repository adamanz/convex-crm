"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface CommentThreadProps {
  entityType: "contact" | "company" | "deal" | "activity";
  entityId: string;
  currentUserId: Id<"users">;
  currentUserName?: string;
  currentUserAvatar?: string;
  title?: string;
  className?: string;
}

export function CommentThread({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  title = "Comments",
  className,
}: CommentThreadProps) {
  const [replyToId, setReplyToId] = useState<Id<"comments"> | undefined>(
    undefined
  );

  // Get comment count for the header
  const commentCount = useQuery(api.comments.count, {
    entityType,
    entityId,
  });

  const handleReply = (parentId: Id<"comments">) => {
    setReplyToId(parentId);
  };

  const handleCancelReply = () => {
    setReplyToId(undefined);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          {commentCount !== undefined && commentCount > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {commentCount}
            </span>
          )}
        </div>
      </div>

      {/* Comment Form - New Comment */}
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <CommentForm
          entityType={entityType}
          entityId={entityId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
        />
      </div>

      {/* Reply Form (if replying) */}
      {replyToId && (
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <CommentForm
            entityType={entityType}
            entityId={entityId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            parentId={replyToId}
            onCancelReply={handleCancelReply}
          />
        </div>
      )}

      {/* Comments List */}
      <div className="p-6">
        <CommentList
          entityType={entityType}
          entityId={entityId}
          currentUserId={currentUserId}
          onReply={handleReply}
        />
      </div>
    </div>
  );
}
