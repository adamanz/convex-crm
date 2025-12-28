"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Webhook,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebhookCardProps {
  webhook: {
    _id: Id<"webhookSubscriptions">;
    name: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
    lastTriggeredAt?: number;
    failureCount: number;
    createdAt: number;
    recentStats?: {
      total: number;
      success: number;
      failed: number;
    };
  };
  onEdit: () => void;
  onViewDeliveries: () => void;
}

export function WebhookCard({
  webhook,
  onEdit,
  onViewDeliveries,
}: WebhookCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const updateWebhook = useMutation(api.webhooks.updateSubscription);
  const deleteWebhook = useMutation(api.webhooks.deleteSubscription);
  const testWebhook = useMutation(api.webhooks.testWebhook);
  const regenerateSecret = useMutation(api.webhooks.regenerateSecret);
  const retryFailed = useMutation(api.webhooks.retryFailedDeliveries);

  const handleToggleActive = async () => {
    await updateWebhook({
      id: webhook._id,
      isActive: !webhook.isActive,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWebhook({ id: webhook._id });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await testWebhook({ id: webhook._id });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRegenerateSecret = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateSecret({ id: webhook._id });
      setNewSecret(result.secret);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRetryFailed = async () => {
    await retryFailed({ subscriptionId: webhook._id });
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const truncateUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const path =
        parsed.pathname.length > 20
          ? parsed.pathname.substring(0, 20) + "..."
          : parsed.pathname;
      return `${parsed.hostname}${path}`;
    } catch {
      return url.substring(0, 40) + (url.length > 40 ? "..." : "");
    }
  };

  const stats = webhook.recentStats || { total: 0, success: 0, failed: 0 };

  return (
    <>
      <Card
        className={cn(
          "transition-all",
          !webhook.isActive && "opacity-60"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  webhook.isActive
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-700"
                )}
              >
                <Webhook
                  className={cn(
                    "h-5 w-5",
                    webhook.isActive
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {webhook.name}
                  {webhook.failureCount >= 5 && (
                    <Badge variant="destructive" className="text-xs">
                      Failing
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-0.5">
                  <ExternalLink className="h-3 w-3" />
                  {truncateUrl(webhook.url)}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={webhook.isActive ? "default" : "secondary"}>
                {webhook.isActive ? "Active" : "Inactive"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleActive}>
                    {webhook.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Enable
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTest} disabled={isTesting}>
                    <RefreshCw
                      className={cn("h-4 w-4 mr-2", isTesting && "animate-spin")}
                    />
                    Send Test
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSecretDialog(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    View Secret
                  </DropdownMenuItem>
                  {stats.failed > 0 && (
                    <DropdownMenuItem onClick={handleRetryFailed}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Events */}
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Subscribed Events ({webhook.events.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {webhook.events.slice(0, 4).map((event) => (
                <Badge
                  key={event}
                  variant="outline"
                  className="text-xs font-mono"
                >
                  {event}
                </Badge>
              ))}
              {webhook.events.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{webhook.events.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>{stats.success}</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span>{stats.failed}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {webhook.lastTriggeredAt && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(webhook.lastTriggeredAt)}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDeliveries}
                className="text-xs h-7"
              >
                View Deliveries
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the webhook &quot;{webhook.name}&quot; and all
              its delivery history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Secret Dialog */}
      <AlertDialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Webhook Secret</AlertDialogTitle>
            <AlertDialogDescription>
              Use this secret to verify webhook signatures. Keep it secure.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Secret</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={newSecret || webhook.secret}
                    readOnly
                    className="w-full px-3 py-2 pr-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copySecret(newSecret || webhook.secret)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleRegenerateSecret}
              disabled={isRegenerating}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              {isRegenerating ? "Regenerating..." : "Regenerate Secret"}
            </Button>
            {newSecret && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Secret regenerated. Make sure to update your endpoint.
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSecretDialog(false);
                setShowSecret(false);
                setNewSecret(null);
              }}
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
