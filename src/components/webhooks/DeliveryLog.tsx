"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliveryLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: Id<"webhookSubscriptions">;
  webhookName: string;
}

export function DeliveryLog({
  open,
  onOpenChange,
  subscriptionId,
  webhookName,
}: DeliveryLogProps) {
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const deliveries = useQuery(api.webhooks.getDeliveryHistory, {
    subscriptionId,
    limit: 20,
    cursor,
  });

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Delivery History</DialogTitle>
          <DialogDescription>
            Recent webhook deliveries for &quot;{webhookName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!deliveries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : deliveries.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">
                No deliveries yet. Trigger some events or send a test webhook.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.items.map((delivery) => (
                <Collapsible
                  key={delivery._id}
                  open={expandedDelivery === delivery._id}
                  onOpenChange={(open) =>
                    setExpandedDelivery(open ? delivery._id : null)
                  }
                >
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
                          expandedDelivery === delivery._id &&
                            "bg-zinc-50 dark:bg-zinc-800/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {expandedDelivery === delivery._id ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          )}
                          {getStatusIcon(delivery.status)}
                          <code className="text-sm font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                            {delivery.event}
                          </code>
                        </div>

                        <div className="flex items-center gap-4">
                          {delivery.responseCode && (
                            <span
                              className={cn(
                                "text-sm font-mono",
                                delivery.responseCode >= 200 &&
                                  delivery.responseCode < 300
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {delivery.responseCode}
                            </span>
                          )}
                          {delivery.attempts > 1 && (
                            <span className="text-xs text-zinc-500">
                              {delivery.attempts} attempts
                            </span>
                          )}
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatRelativeTime(delivery.createdAt)}
                          </span>
                          {getStatusBadge(delivery.status)}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                              Delivery ID
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono">
                                {delivery._id}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  copyToClipboard(delivery._id, `id-${delivery._id}`)
                                }
                              >
                                {copiedId === `id-${delivery._id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                              Created At
                            </p>
                            <p className="text-xs">
                              {formatTimestamp(delivery.createdAt)}
                            </p>
                          </div>
                          {delivery.deliveredAt && (
                            <div>
                              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                                Delivered At
                              </p>
                              <p className="text-xs">
                                {formatTimestamp(delivery.deliveredAt)}
                              </p>
                            </div>
                          )}
                          {delivery.nextRetryAt && (
                            <div>
                              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                                Next Retry
                              </p>
                              <p className="text-xs">
                                {formatTimestamp(delivery.nextRetryAt)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {delivery.errorMessage && (
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                              Error
                            </p>
                            <div className="rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2">
                              <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                                {delivery.errorMessage}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Payload */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                              Payload
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(delivery.payload, null, 2),
                                  `payload-${delivery._id}`
                                )
                              }
                            >
                              {copiedId === `payload-${delivery._id}` ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="rounded bg-zinc-100 dark:bg-zinc-800 p-3 overflow-auto max-h-48 text-xs font-mono">
                            {JSON.stringify(delivery.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Response Body */}
                        {delivery.responseBody && (
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-1">
                              Response
                            </p>
                            <pre className="rounded bg-zinc-100 dark:bg-zinc-800 p-3 overflow-auto max-h-32 text-xs font-mono">
                              {delivery.responseBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Load More */}
          {deliveries?.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCursor(deliveries.nextCursor ?? undefined)}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
