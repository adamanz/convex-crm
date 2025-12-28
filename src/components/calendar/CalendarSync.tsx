"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  RefreshCw,
  Link2,
  Link2Off,
  Settings,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";

type CalendarProvider = "google" | "outlook" | "apple" | "other";
type SyncDirection = "one-way" | "two-way";
type SyncStatus = "connected" | "disconnected" | "syncing" | "error" | "token_expired";

interface CalendarConnection {
  id: string;
  provider: CalendarProvider;
  email: string;
  name: string;
  status: SyncStatus;
  lastSynced?: number;
  syncDirection: SyncDirection;
  syncEnabled: boolean;
}

export interface CalendarSyncProps {
  connections: CalendarConnection[];
  onConnect?: (provider: CalendarProvider) => Promise<void>;
  onDisconnect?: (connectionId: string) => Promise<void>;
  onSyncNow?: (connectionId: string) => Promise<void>;
  onUpdateSettings?: (
    connectionId: string,
    settings: { syncDirection: SyncDirection; syncEnabled: boolean }
  ) => Promise<void>;
  className?: string;
}

const providerConfig: Record<
  CalendarProvider,
  { name: string; color: string; bgColor: string }
> = {
  google: {
    name: "Google Calendar",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
  },
  outlook: {
    name: "Outlook Calendar",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  apple: {
    name: "Apple Calendar",
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
  },
  other: {
    name: "Other Calendar",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
  },
};

const statusConfig: Record<
  SyncStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  connected: { label: "Connected", variant: "default" },
  disconnected: { label: "Disconnected", variant: "secondary" },
  syncing: { label: "Syncing...", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
  token_expired: { label: "Reconnect Required", variant: "destructive" },
};

function formatLastSynced(timestamp?: number): string {
  if (!timestamp) return "Never synced";
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return new Date(timestamp).toLocaleDateString();
}

function ConnectionCard({
  connection,
  onDisconnect,
  onSyncNow,
  onUpdateSettings,
}: {
  connection: CalendarConnection;
  onDisconnect?: (id: string) => Promise<void>;
  onSyncNow?: (id: string) => Promise<void>;
  onUpdateSettings?: (
    id: string,
    settings: { syncDirection: SyncDirection; syncEnabled: boolean }
  ) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const provider = providerConfig[connection.provider];
  const status = statusConfig[connection.status];

  const handleSync = useCallback(async () => {
    if (!onSyncNow) return;
    setIsLoading(true);
    try {
      await onSyncNow(connection.id);
    } finally {
      setIsLoading(false);
    }
  }, [connection.id, onSyncNow]);

  const handleDisconnect = useCallback(async () => {
    if (!onDisconnect) return;
    setIsLoading(true);
    try {
      await onDisconnect(connection.id);
    } finally {
      setIsLoading(false);
    }
  }, [connection.id, onDisconnect]);

  const handleDirectionChange = useCallback(
    async (direction: SyncDirection) => {
      if (!onUpdateSettings) return;
      setIsLoading(true);
      try {
        await onUpdateSettings(connection.id, {
          syncDirection: direction,
          syncEnabled: connection.syncEnabled,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [connection.id, connection.syncEnabled, onUpdateSettings]
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            provider.bgColor
          )}
        >
          <Calendar className={cn("h-5 w-5", provider.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              {connection.name || provider.name}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {connection.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connection.status === "connected" && onSyncNow && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="space-y-4">
            {/* Sync direction */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Sync Direction
              </Label>
              <Select
                value={connection.syncDirection}
                onValueChange={(value: SyncDirection) =>
                  handleDirectionChange(value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-way">
                    One-way (CRM to Calendar)
                  </SelectItem>
                  <SelectItem value="two-way">
                    Two-way (Sync both ways)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Last synced */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                Last synced:
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {formatLastSynced(connection.lastSynced)}
              </span>
            </div>

            {/* Error message */}
            {connection.status === "error" && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Sync failed. Please check your connection and try again.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              {onDisconnect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  <Link2Off className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarSync({
  connections,
  onConnect,
  onDisconnect,
  onSyncNow,
  onUpdateSettings,
  className,
}: CalendarSyncProps) {
  const [isConnecting, setIsConnecting] = useState<CalendarProvider | null>(null);

  const handleConnect = useCallback(
    async (provider: CalendarProvider) => {
      if (!onConnect) return;
      setIsConnecting(provider);
      try {
        await onConnect(provider);
      } finally {
        setIsConnecting(null);
      }
    },
    [onConnect]
  );

  const availableProviders = (
    Object.keys(providerConfig) as CalendarProvider[]
  ).filter((p) => !connections.find((c) => c.provider === p));

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Calendar Integrations
          </h3>
        </div>
        {connections.filter((c) => c.status === "connected").length > 0 && (
          <Badge variant="secondary">
            {connections.filter((c) => c.status === "connected").length} connected
          </Badge>
        )}
      </div>

      {/* Connections list */}
      <div className="flex flex-col gap-3 p-4">
        {connections.length > 0 ? (
          connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onDisconnect={onDisconnect}
              onSyncNow={onSyncNow}
              onUpdateSettings={onUpdateSettings}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No calendars connected
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Connect a calendar to sync your events
            </p>
          </div>
        )}
      </div>

      {/* Add new connection */}
      {onConnect && availableProviders.length > 0 && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Label className="mb-2 block text-xs text-zinc-500 dark:text-zinc-400">
            Connect a new calendar
          </Label>
          <div className="flex flex-wrap gap-2">
            {availableProviders.map((provider) => {
              const config = providerConfig[provider];
              const isLoading = isConnecting === provider;

              return (
                <Button
                  key={provider}
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(provider)}
                  disabled={isConnecting !== null}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  {config.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONNECTED COMPONENT - With Convex integration
// =============================================================================

export interface ConnectedCalendarSyncProps {
  userId: Id<"users">;
  className?: string;
}

/**
 * CalendarSync component connected to Convex backend
 * Handles OAuth flow, sync operations, and real-time updates
 */
export function ConnectedCalendarSync({ userId, className }: ConnectedCalendarSyncProps) {
  // Convex queries and mutations
  const connections = useQuery(api.calendar.getConnections, { userId });
  const updateSettings = useMutation(api.calendar.updateConnectionSettings);
  const disconnectCalendar = useMutation(api.calendar.disconnectCalendar);
  const syncEvents = useAction(api.calendar.syncCalendarEvents);

  // Track syncing state
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_OAUTH_SUCCESS") {
        // Connection was successful - data will update via Convex subscription
        console.log("Google Calendar connected:", event.data.email);
      } else if (event.data?.type === "GOOGLE_OAUTH_ERROR") {
        console.error("Google Calendar connection failed:", event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle connecting a new calendar
  const handleConnect = useCallback(
    async (provider: CalendarProvider) => {
      if (provider === "google") {
        // Get the OAuth URL and open popup
        const redirectUri = `${window.location.origin.replace("localhost:3000", "YOUR_CONVEX_SITE.convex.site")}/oauth/google/callback`;

        // For local development, we need to use the Convex site URL
        const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "";
        const actualRedirectUri = convexSiteUrl
          ? `${convexSiteUrl}/oauth/google/callback`
          : redirectUri;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error("Google Client ID not configured");
          return;
        }

        const state = btoa(JSON.stringify({ userId }));
        const scope = [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/userinfo.email",
        ].join(" ");

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", actualRedirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scope);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);

        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
          authUrl.toString(),
          "google-oauth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else if (provider === "outlook") {
        // TODO: Implement Outlook OAuth
        console.log("Outlook calendar integration coming soon");
      } else if (provider === "apple") {
        // TODO: Implement Apple Calendar integration
        console.log("Apple calendar integration coming soon");
      }
    },
    [userId]
  );

  // Handle disconnecting a calendar
  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      try {
        await disconnectCalendar({
          connectionId: connectionId as Id<"calendarConnections">
        });
      } catch (error) {
        console.error("Failed to disconnect calendar:", error);
      }
    },
    [disconnectCalendar]
  );

  // Handle sync now
  const handleSyncNow = useCallback(
    async (connectionId: string) => {
      setSyncingIds((prev) => new Set(prev).add(connectionId));
      try {
        await syncEvents({
          connectionId: connectionId as Id<"calendarConnections">,
          fullSync: false,
        });
      } catch (error) {
        console.error("Failed to sync calendar:", error);
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(connectionId);
          return next;
        });
      }
    },
    [syncEvents]
  );

  // Handle updating settings
  const handleUpdateSettings = useCallback(
    async (
      connectionId: string,
      settings: { syncDirection: SyncDirection; syncEnabled: boolean }
    ) => {
      try {
        await updateSettings({
          connectionId: connectionId as Id<"calendarConnections">,
          syncDirection: settings.syncDirection,
          syncEnabled: settings.syncEnabled,
        });
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },
    [updateSettings]
  );

  // Transform connections for the UI component
  const transformedConnections: CalendarConnection[] = (connections || []).map((conn) => ({
    id: conn.id,
    provider: conn.provider as CalendarProvider,
    email: conn.email,
    name: conn.name || conn.email,
    status: syncingIds.has(conn.id) ? "syncing" : (conn.status as SyncStatus),
    lastSynced: conn.lastSyncedAt,
    syncDirection: conn.syncDirection as SyncDirection,
    syncEnabled: conn.syncEnabled,
  }));

  return (
    <CalendarSync
      connections={transformedConnections}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onSyncNow={handleSyncNow}
      onUpdateSettings={handleUpdateSettings}
      className={className}
    />
  );
}
