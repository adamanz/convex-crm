"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MentionInput, MentionInputRef } from "./MentionInput";
import { cn, getInitials } from "@/lib/utils";
import { Send, X } from "lucide-react";
import { toast } from "sonner";

interface CommentFormProps {
  entityType: "contact" | "company" | "deal" | "activity";
  entityId: string;
  currentUserId: Id<"users">;
  currentUserName?: string;
  currentUserAvatar?: string;
  parentId?: Id<"comments">;
  onCancelReply?: () => void;
  placeholder?: string;
  className?: string;
  onSuccess?: () => void;
}

export function CommentForm({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  parentId,
  onCancelReply,
  placeholder,
  className,
  onSuccess,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<Id<"users">[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<MentionInputRef>(null);

  const createComment = useMutation(api.comments.create);

  const handleChange = (value: string, newMentions: Id<"users">[]) => {
    setContent(value);
    setMentions(newMentions);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment({
        content: content.trim(),
        authorId: currentUserId,
        entityType,
        entityId,
        parentId,
        mentions: mentions.length > 0 ? mentions : undefined,
      });

      // Clear form
      setContent("");
      setMentions([]);
      inputRef.current?.clear();

      // Close reply mode if it's a reply
      if (parentId && onCancelReply) {
        onCancelReply();
      }

      toast.success(parentId ? "Reply added" : "Comment added");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeySubmit = () => {
    handleSubmit();
  };

  const isReply = !!parentId;

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={currentUserAvatar} alt={currentUserName} />
        <AvatarFallback className="text-xs">
          {currentUserName
            ? getInitials(
                currentUserName.split(" ")[0],
                currentUserName.split(" ")[1]
              )
            : "?"}
        </AvatarFallback>
      </Avatar>

      {/* Input area */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Reply indicator */}
        {isReply && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Replying to comment</span>
            <button
              onClick={onCancelReply}
              className="rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Input */}
        <MentionInput
          ref={inputRef}
          value={content}
          onChange={handleChange}
          placeholder={
            placeholder ||
            (isReply
              ? "Write a reply..."
              : "Write a comment... Use @ to mention someone")
          }
          disabled={isSubmitting}
          onSubmit={handleKeySubmit}
          minRows={isReply ? 1 : 2}
          maxRows={6}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {mentions.length > 0 && (
              <span>
                {mentions.length} {mentions.length === 1 ? "person" : "people"}{" "}
                will be notified
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isReply && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending..." : isReply ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
