"use client";

import * as React from "react";
import { Reply, Forward, MoreHorizontal, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate, getInitials } from "@/lib/utils";

export interface EmailMessage {
  id: string;
  from: {
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  subject: string;
  body: string;
  sentAt: number;
  isRead?: boolean;
}

export interface EmailThreadProps {
  /** Subject of the email thread */
  subject: string;
  /** Messages in the thread (oldest first) */
  messages: EmailMessage[];
  /** Callback when reply is clicked */
  onReply?: (messageId: string) => void;
  /** Callback when forward is clicked */
  onForward?: (messageId: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (messageId: string) => void;
  /** Additional class name */
  className?: string;
}

function EmailMessageItem({
  message,
  isLast,
  onReply,
  onForward,
  onDelete,
}: {
  message: EmailMessage;
  isLast: boolean;
  onReply?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(isLast);
  const initials = getInitials(
    message.from.name?.split(" ")[0],
    message.from.name?.split(" ")[1]
  );

  return (
    <div className="group">
      {/* Message Header */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          !isExpanded && "border-b"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Avatar className="h-10 w-10">
          {message.from.avatarUrl && (
            <AvatarImage src={message.from.avatarUrl} alt={message.from.name} />
          )}
          <AvatarFallback className="text-sm bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">
                {message.from.name || message.from.email}
              </span>
              {!message.isRead && (
                <Badge variant="info" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(message.sentAt)}
            </span>
          </div>

          {!isExpanded && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {message.body.slice(0, 100)}...
            </p>
          )}

          {isExpanded && (
            <p className="text-sm text-muted-foreground">
              To: {message.to.map((r) => r.name || r.email).join(", ")}
              {message.cc && message.cc.length > 0 && (
                <span className="ml-2">
                  CC: {message.cc.map((r) => r.name || r.email).join(", ")}
                </span>
              )}
            </p>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </div>

      {/* Message Body */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="pl-13 ml-10">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm">{message.body}</div>
            </div>

            {/* Message Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(message.id);
                }}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onForward?.(message.id);
                }}
              >
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDelete?.(message.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {isExpanded && !isLast && <Separator />}
    </div>
  );
}

export function EmailThread({
  subject,
  messages,
  onReply,
  onForward,
  onDelete,
  className,
}: EmailThreadProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Thread Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{subject}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {messages.length} message{messages.length !== 1 && "s"}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {messages.map((message, index) => (
            <EmailMessageItem
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              onReply={onReply}
              onForward={onForward}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default EmailThread;
