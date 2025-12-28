"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface SMSThreadProps {
  contactId: Id<"contacts">;
}

export function SMSThread({ contactId }: SMSThreadProps) {
  const messages = useQuery(api.sendblue.getMessageHistory, { contactId });

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-8 w-8 text-zinc-300 mb-2" />
        <p className="text-sm text-zinc-500">No SMS messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message: any) => (
        <div
          key={message._id}
          className={"flex " + (message.direction === "outbound" ? "justify-end" : "justify-start")}
        >
          <div
            className={"max-w-xs rounded-lg px-3 py-2 text-sm " + (
              message.direction === "outbound"
                ? "bg-blue-600 text-white"
                : "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
            )}
          >
            <p>{message.content}</p>
            <div className="mt-1 text-[11px] opacity-70">
              {formatDate(message.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
