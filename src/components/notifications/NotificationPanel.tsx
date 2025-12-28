"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NotificationItem, NotificationData } from "./NotificationItem";
import { ApprovalRequestCard } from "@/components/approvals";
import { Bell, Check, Settings, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface NotificationPanelProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  userId?: Id<"users">;
}

export function NotificationPanel({
  onClose,
  onOpenSettings,
  userId,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "unread" | "approvals">("all");

  const showUnreadOnly = activeTab === "unread";

  // Queries
  const notificationsData = useQuery(api.notifications.list, {
    limit: 50,
    unreadOnly: showUnreadOnly,
  });

  // Query pending approvals if userId is provided
  const pendingApprovals = useQuery(
    api.approvals.getMyPendingApprovals,
    userId ? { userId } : "skip"
  );

  // Mutations
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const handleMarkRead = async (id: Id<"notifications">) => {
    try {
      await markRead({ id });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const count = await markAllRead({});
      if (count > 0) {
        toast.success(`Marked ${count} notifications as read`);
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
      console.error("Failed to mark all as read:", error);
    }
  };

  const notifications = notificationsData?.items as NotificationData[] | undefined;
  const isLoading = notificationsData === undefined;
  const hasUnread = notifications?.some((n) => !n.read);
  const pendingApprovalCount = pendingApprovals?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Notifications
        </h3>
        <div className="flex items-center gap-1">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100",
                "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100",
                "dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
            activeTab === "all"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={cn(
            "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
            activeTab === "unread"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          Unread
        </button>
        {userId && (
          <button
            onClick={() => setActiveTab("approvals")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "approvals"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            Approvals
            {pendingApprovalCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {pendingApprovalCount}
              </Badge>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {activeTab === "approvals" ? (
            // Approvals Tab Content
            pendingApprovals === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : pendingApprovals.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pendingApprovals.map((request) => (
                  <ApprovalRequestCard
                    key={request._id}
                    request={request}
                    userId={userId!}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No pending approvals
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            )
          ) : (
            // Notifications Tab Content
            isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="flex flex-col gap-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onClick={onClose}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {showUnreadOnly
                    ? "You're all caught up!"
                    : "We'll notify you when something happens"}
                </p>
              </div>
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
