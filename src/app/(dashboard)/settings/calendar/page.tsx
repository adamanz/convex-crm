"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
  Link2,
  Link2Off,
  Settings2,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { cn, formatRelativeTime } from "@/lib/utils";

type CalendarProvider = "google" | "outlook" | "apple";
type SyncDirection = "one-way" | "two-way";

const PROVIDER_CONFIG = {
  google: {
    name: "Google Calendar",
    icon: "🔴",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  outlook: {
    name: "Outlook Calendar",
    icon: "🔵",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  apple: {
    name: "Apple Calendar",
    icon: "⚪",
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
  },
};

export default function CalendarSettingsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [disconnectConnectionId, setDisconnectConnectionId] = useState<Id<"calendarConnections"> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Get current user
  const usersData = useQuery(api.users.list, { includeInactive: false });
  const currentUser = usersData?.[0];
  const currentUserId = currentUser?._id;

  // Fetch calendar connections
  const connections = useQuery(
    api.calendar.getConnections,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  // Mutations and actions
  const updateSettings = useMutation(api.calendar.updateConnectionSettings);
  const disconnectCalendar = useMutation(api.calendar.disconnectCalendar);
  const getOAuthUrl = useQuery(
    api.calendar.getGoogleOAuthUrl,
    selectedProvider === "google" && currentUserId
      ? { userId: currentUserId, redirectUri: typeof window !== "undefined" ? `${window.location.origin}/api/calendar/callback` : "" }
      : "skip"
  );
  const syncCalendar = useAction(api.calendar.syncCalendarEvents);

  const handleConnect = async (provider: CalendarProvider) => {
    setSelectedProvider(provider);
    setIsConnecting(true);

    try {
      if (provider === "google" && getOAuthUrl) {
        // Redirect to Google OAuth
        window.location.href = getOAuthUrl;
      } else if (provider === "outlook") {
        toast.info("Outlook Calendar integration coming soon");
      } else if (provider === "apple") {
        toast.info("Apple Calendar integration coming soon");
      }
    } catch (error) {
      toast.error("Failed to connect calendar");
    } finally {
      setIsConnecting(false);
      setShowConnectDialog(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectConnectionId) return;

    try {
      await disconnectCalendar({ connectionId: disconnectConnectionId });
      toast.success("Calendar disconnected");
    } catch (error) {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnectConnectionId(null);
    }
  };

  const handleSyncNow = async (connectionId: Id<"calendarConnections">) => {
    setIsSyncing(connectionId);
    try {
      await syncCalendar({ connectionId, fullSync: false });
      toast.success("Calendar synced successfully");
    } catch (error) {
      toast.error("Failed to sync calendar");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleUpdateSettings = async (
    connectionId: Id<"calendarConnections">,
    settings: { syncDirection?: SyncDirection; syncEnabled?: boolean }
  ) => {
    try {
      await updateSettings({
        connectionId,
        ...settings,
      });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default" className="bg-emerald-600">Connected</Badge>;
      case "syncing":
        return <Badge variant="secondary">Syncing...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "token_expired":
        return <Badge variant="destructive">Reconnect Required</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Calendar Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your calendar connections and sync settings
            </p>
          </div>
        </div>
        <Button onClick={() => setShowConnectDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Connect Calendar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Connected Calendars */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Connected Calendars
              </CardTitle>
              <CardDescription>
                Sync your calendar events with the CRM to track meetings and schedule activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No calendars connected</p>
                  <Button onClick={() => setShowConnectDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect your first calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => {
                    const config = PROVIDER_CONFIG[connection.provider as CalendarProvider] || PROVIDER_CONFIG.google;

                    return (
                      <div
                        key={connection.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-lg", config.bgColor)}>
                            <Calendar className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{config.name}</p>
                              {getStatusBadge(connection.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{connection.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Last synced: {connection.lastSyncedAt
                                ? formatRelativeTime(connection.lastSyncedAt)
                                : "Never"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncNow(connection.id)}
                            disabled={isSyncing === connection.id}
                          >
                            {isSyncing === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setDisconnectConnectionId(connection.id)}
                          >
                            <Link2Off className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Settings */}
          {connections && connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Sync Settings
                </CardTitle>
                <CardDescription>
                  Configure how your calendars sync with the CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {connections.map((connection) => {
                  const config = PROVIDER_CONFIG[connection.provider as CalendarProvider] || PROVIDER_CONFIG.google;

                  return (
                    <div key={connection.id} className="space-y-4 pb-4 border-b border-zinc-800 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span className="font-medium">{connection.email}</span>
                      </div>

                      <div className="grid gap-4 pl-7">
                        {/* Sync Enabled */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable Sync</Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically sync events with this calendar
                            </p>
                          </div>
                          <Switch
                            checked={connection.syncEnabled}
                            onCheckedChange={(checked) =>
                              handleUpdateSettings(connection.id, { syncEnabled: checked })
                            }
                          />
                        </div>

                        {/* Sync Direction */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Sync Direction</Label>
                            <p className="text-sm text-muted-foreground">
                              Choose how events are synced between systems
                            </p>
                          </div>
                          <Select
                            value={connection.syncDirection}
                            onValueChange={(value: SyncDirection) =>
                              handleUpdateSettings(connection.id, { syncDirection: value })
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one-way">
                                Calendar → CRM
                              </SelectItem>
                              <SelectItem value="two-way">
                                Two-way sync
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Sync History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync Activity
              </CardTitle>
              <CardDescription>
                Recent sync operations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent sync activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Calendar Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Calendar</DialogTitle>
            <DialogDescription>
              Choose a calendar service to connect with your CRM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {(Object.keys(PROVIDER_CONFIG) as CalendarProvider[]).map((provider) => {
              const config = PROVIDER_CONFIG[provider];
              const isSupported = provider === "google";

              return (
                <button
                  key={provider}
                  onClick={() => handleConnect(provider)}
                  disabled={!isSupported || isConnecting}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-lg border border-zinc-800 transition-colors",
                    isSupported
                      ? "hover:bg-zinc-900 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <Calendar className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{config.name}</p>
                      {!isSupported && (
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      )}
                    </div>
                  </div>
                  {isSupported && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={!!disconnectConnectionId}
        onOpenChange={(open) => !open && setDisconnectConnectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Calendar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this calendar? Your synced events will
              remain in the CRM but future events won't be synced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
