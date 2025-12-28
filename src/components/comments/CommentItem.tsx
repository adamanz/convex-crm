"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Reply,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface CommentAuthor {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
}

interface MentionedUser {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
}

export interface CommentData {
  _id: Id<"comments">;
  content: string;
  authorId: Id<"users">;
  entityType: "contact" | "company" | "deal" | "activity";
  entityId: string;
  parentId?: Id<"comments">;
  mentions: Id<"users">[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
  author: CommentAuthor | null;
  mentionedUsers: MentionedUser[];
  replyCount?: number;
}

interface CommentItemProps {
  comment: CommentData;
  currentUserId: Id<"users">;
  onReply?: (parentId: Id<"comments">) => void;
  showReplyButton?: boolean;
  isReply?: boolean;
  className?: string;
}

/**
 * Render content with highlighted mentions
 */
function renderContentWithMentions(
  content: string,
  mentionedUsers: MentionedUser[]
): React.ReactNode {
  if (mentionedUsers.length === 0) {
    return content;
  }

  // Create a map of names/emails to users for highlighting
  const mentionMap = new Map<string, MentionedUser>();
  mentionedUsers.forEach((user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (fullName) mentionMap.set(fullName.toLowerCase(), user);
    if (user.email) mentionMap.set(user.email.toLowerCase(), user);
    if (user.firstName) mentionMap.set(user.firstName.toLowerCase(), user);
    if (user.lastName) mentionMap.set(user.lastName.toLowerCase(), user);
  });

  // Match @[Name] or @name patterns
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /@\[([^\]]+)\]|@(\w+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const mentionText = match[1] || match[2]; // [Name] or name
    const user = mentionMap.get(mentionText.toLowerCase());

    if (user) {
      parts.push(
        <span
          key={match.index}
          className="rounded bg-blue-100 px-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          @{mentionText}
        </span>
      );
    } else {
      parts.push(match[0]); // No matching user, show as-is
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <>{parts}</>;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  showReplyButton = true,
  isReply = false,
  className,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateComment = useMutation(api.comments.update);
  const deleteComment = useMutation(api.comments.delete_);

  const isOwner = comment.authorId === currentUserId;
  const authorName = comment.author
    ? [comment.author.firstName, comment.author.lastName]
        .filter(Boolean)
        .join(" ") || comment.author.email
    : "Unknown User";

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateComment({
        id: comment._id,
        content: editContent.trim(),
        authorId: currentUserId,
      });
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment({
        id: comment._id,
        authorId: currentUserId,
      });
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3",
        isReply && "ml-10",
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.author?.avatarUrl} alt={authorName} />
        <AvatarFallback className="text-xs">
          {getInitials(comment.author?.firstName, comment.author?.lastName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {authorName}
          </span>
          <span className="text-xs text-zinc-500">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-zinc-400">(edited)</span>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] text-sm"
              placeholder="Edit your comment..."
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {renderContentWithMentions(comment.content, comment.mentionedUsers)}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="mt-2 flex items-center gap-4">
            {/* Reply button */}
            {showReplyButton && onReply && !isReply && (
              <button
                onClick={() => onReply(comment._id)}
                className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {/* Reply count indicator */}
            {!isReply && (comment.replyCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <MessageSquare className="h-3.5 w-3.5" />
                {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions Menu */}
      {isOwner && !isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
