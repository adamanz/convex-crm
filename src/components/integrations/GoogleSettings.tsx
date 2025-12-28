"use client";

import { useState, useEffect } from "react";
import { Calendar, Mail, RefreshCw, Loader2, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegrationCard, IntegrationStatus } from "./IntegrationCard";

// Helper to format last synced time
function formatLastSynced(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

interface GoogleService {
  id: "calendar" | "gmail";
  name: string;
  description: string;
  icon: typeof Calendar | typeof Mail;
  enabled: boolean;
  connected: boolean;
  email?: string;
  lastSynced?: string;
}

interface GoogleConfig {
  calendarEnabled: boolean;
  gmailEnabled: boolean;
  syncCalendarEvents: boolean;
  syncEmailThreads: boolean;
  autoLogEmails: boolean;
  createEventsFromDeals: boolean;
  defaultCalendarId?: string;
}

interface GoogleSettingsProps {
  onConnect?: (service: "calendar" | "gmail") => void;
}

export function GoogleSettings({
  onConnect,
}: GoogleSettingsProps) {
  // Backend queries and mutations
  const integrationData = useQuery(api.integrations.getSettings, { type: "google" });
  const saveSettingsMutation = useMutation(api.integrations.saveSettings);
  const testConnectionMutation = useMutation(api.integrations.testConnection);
  const disconnectMutation = useMutation(api.integrations.disconnect);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Derive status from backend data
  const status: IntegrationStatus = integrationData?.status || "disconnected";
  const lastSynced = integrationData?.lastSyncedAt
    ? formatLastSynced(integrationData.lastSyncedAt)
    : undefined;
  const connectedEmail = integrationData?.connectedEmail;

  const [config, setConfig] = useState<GoogleConfig>({
    calendarEnabled: true,
    gmailEnabled: true,
    syncCalendarEvents: true,
    syncEmailThreads: true,
    autoLogEmails: false,
    createEventsFromDeals: false,
    defaultCalendarId: undefined,
  });

  // Load config from backend when data is available
  useEffect(() => {
    if (integrationData?.config) {
      setConfig((prev) => ({
        ...prev,
        ...integrationData.config,
      }));
    }
  }, [integrationData]);

  const [services, setServices] = useState<GoogleService[]>([
    {
      id: "calendar",
      name: "Google Calendar",
      description: "Sync meetings and schedule events",
      icon: Calendar,
      enabled: true,
      connected: false,
      email: undefined,
      lastSynced: undefined,
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Log email conversations with contacts",
      icon: Mail,
      enabled: true,
      connected: false,
      email: undefined,
      lastSynced: undefined,
    },
  ]);

  // Update services from backend data
  useEffect(() => {
    if (integrationData) {
      setServices([
        {
          id: "calendar",
          name: "Google Calendar",
          description: "Sync meetings and schedule events",
          icon: Calendar,
          enabled: (integrationData.config as GoogleConfig)?.calendarEnabled ?? true,
          connected: status === "connected",
          email: connectedEmail,
          lastSynced: status === "connected" ? lastSynced : undefined,
        },
        {
          id: "gmail",
          name: "Gmail",
          description: "Log email conversations with contacts",
          icon: Mail,
          enabled: (integrationData.config as GoogleConfig)?.gmailEnabled ?? true,
          connected: status === "connected",
          email: connectedEmail,
          lastSynced: status === "connected" ? lastSynced : undefined,
        },
      ]);
    }
  }, [integrationData, status, connectedEmail, lastSynced]);

  const handleSave = async () => {
    setIsSaving(true);
    setConnectionMessage(null);
    try {
      // Build the config object with service enabled states
      const configToSave = {
        ...config,
        calendarEnabled: services.find((s) => s.id === "calendar")?.enabled ?? true,
        gmailEnabled: services.find((s) => s.id === "gmail")?.enabled ?? true,
      };

      await saveSettingsMutation({
        type: "google",
        config: configToSave,
        connectedEmail: connectedEmail,
      });

      setConnectionMessage("Settings saved successfully");
      setIsEditing(false);
    } catch (error) {
      setConnectionMessage(`Error saving settings: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setConnectionMessage(null);
    try {
      // In a real implementation, this would trigger a sync action
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setConnectionMessage("Sync completed");
    } catch (error) {
      setConnectionMessage(`Sync error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionMessage(null);
    try {
      const result = await testConnectionMutation({ type: "google" });
      if (result.success) {
        setConnectionMessage(result.message || "Connection successful");
      } else {
        setConnectionMessage(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionMessage(`Test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect Google? This will stop calendar and email sync.")) {
      try {
        await disconnectMutation({ type: "google" });
        setConnectionMessage("Disconnected successfully");
      } catch (error) {
        setConnectionMessage(`Error disconnecting: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const handleToggleService = (serviceId: "calendar" | "gmail", enabled: boolean) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, enabled } : s))
    );
    if (serviceId === "calendar") {
      setConfig((prev) => ({ ...prev, calendarEnabled: enabled }));
    } else {
      setConfig((prev) => ({ ...prev, gmailEnabled: enabled }));
    }
  };

  const isConnected = status === "connected" || status === "syncing";

  if (!isEditing && !isConnected) {
    return (
      <IntegrationCard
        icon={Calendar}
        name="Google Workspace"
        description="Connect Google Calendar and Gmail to sync meetings and emails"
        status={status}
        lastSynced={lastSynced}
        onConnect={() => onConnect?.("calendar")}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Workspace</CardTitle>
              <CardDescription>
                Connect Google Calendar and Gmail to sync meetings and emails
              </CardDescription>
            </div>
          </div>
          <Badge variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"}>
            {status === "connected" ? "Connected" : status === "error" ? "Error" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Account */}
        {isConnected && connectedEmail && (
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-700">
                <span className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                  {connectedEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {connectedEmail}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Google Account
                </p>
              </div>
              <Check className="ml-auto h-5 w-5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Services */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Connected Services
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          service.id === "calendar"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            service.id === "calendar"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {service.name}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {service.description}
                          {service.lastSynced && service.enabled && (
                            <span> - Last synced {service.lastSynced}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={service.enabled}
                      onCheckedChange={(checked: boolean) =>
                        handleToggleService(service.id, checked)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Settings */}
        {isConnected && config.calendarEnabled && (
          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Calendar Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-events" className="text-sm font-medium">
                    Sync Calendar Events
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Show upcoming meetings in your CRM
                  </p>
                </div>
                <Switch
                  id="sync-events"
                  checked={config.syncCalendarEvents}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, syncCalendarEvents: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="create-events" className="text-sm font-medium">
                    Create Events from Deals
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Automatically schedule follow-ups when deals progress
                  </p>
                </div>
                <Switch
                  id="create-events"
                  checked={config.createEventsFromDeals}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, createEventsFromDeals: checked }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Gmail Settings */}
        {isConnected && config.gmailEnabled && (
          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Gmail Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-emails" className="text-sm font-medium">
                    Sync Email Threads
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Show email conversations with contacts
                  </p>
                </div>
                <Switch
                  id="sync-emails"
                  checked={config.syncEmailThreads}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, syncEmailThreads: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-log" className="text-sm font-medium">
                    Auto-Log Emails
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Automatically log emails as contact activities
                  </p>
                </div>
                <Switch
                  id="auto-log"
                  checked={config.autoLogEmails}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, autoLogEmails: checked }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Message */}
        {connectionMessage && (
          <div
            className={`rounded-lg p-3 text-sm ${
              connectionMessage.toLowerCase().includes("error") ||
              connectionMessage.toLowerCase().includes("failed")
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {connectionMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <div>
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Disconnect
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => onConnect?.("calendar")} size="sm">
                  Connect with Google
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
