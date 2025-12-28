"use client";

import { useState, useEffect } from "react";
import { Cloud, RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
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

interface SyncObject {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastSynced?: string;
  recordCount?: number;
  hasError?: boolean;
}

interface SalesforceConfig {
  instanceUrl: string;
  syncContacts: boolean;
  syncOpportunities: boolean;
  syncLeads: boolean;
  syncAccounts: boolean;
  bidirectionalSync: boolean;
  syncInterval: "realtime" | "hourly" | "daily";
}

interface SalesforceSettingsProps {
  onConnect?: () => void;
  onSync?: () => Promise<void>;
}

export function SalesforceSettings({
  onConnect,
  onSync,
}: SalesforceSettingsProps) {
  // Backend queries and mutations
  const integrationData = useQuery(api.integrations.getSettings, { type: "salesforce" });
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

  const [config, setConfig] = useState<SalesforceConfig>({
    instanceUrl: "",
    syncContacts: true,
    syncOpportunities: true,
    syncLeads: true,
    syncAccounts: true,
    bidirectionalSync: false,
    syncInterval: "realtime",
  });

  // Load config from backend when data is available
  useEffect(() => {
    if (integrationData?.config) {
      setConfig((prev) => ({
        ...prev,
        ...integrationData.config,
      }));
    }
    if (integrationData?.instanceUrl) {
      setConfig((prev) => ({
        ...prev,
        instanceUrl: integrationData.instanceUrl || "",
      }));
    }
  }, [integrationData]);

  const [syncObjects, setSyncObjects] = useState<SyncObject[]>([
    {
      id: "contacts",
      name: "Contacts",
      description: "Sync contact records between systems",
      enabled: true,
      lastSynced: "2 minutes ago",
      recordCount: 1250,
    },
    {
      id: "opportunities",
      name: "Opportunities",
      description: "Sync deals and opportunity data",
      enabled: true,
      lastSynced: "5 minutes ago",
      recordCount: 384,
    },
    {
      id: "leads",
      name: "Leads",
      description: "Sync lead records and status",
      enabled: true,
      lastSynced: "1 hour ago",
      recordCount: 2100,
    },
    {
      id: "accounts",
      name: "Accounts",
      description: "Sync company/account information",
      enabled: false,
      recordCount: 450,
    },
  ]);

  // Update sync objects from config
  useEffect(() => {
    if (integrationData?.config) {
      const cfg = integrationData.config as SalesforceConfig;
      setSyncObjects((prev) =>
        prev.map((obj) => {
          if (obj.id === "contacts" && cfg.syncContacts !== undefined) {
            return { ...obj, enabled: cfg.syncContacts };
          }
          if (obj.id === "opportunities" && cfg.syncOpportunities !== undefined) {
            return { ...obj, enabled: cfg.syncOpportunities };
          }
          if (obj.id === "leads" && cfg.syncLeads !== undefined) {
            return { ...obj, enabled: cfg.syncLeads };
          }
          if (obj.id === "accounts" && cfg.syncAccounts !== undefined) {
            return { ...obj, enabled: cfg.syncAccounts };
          }
          return obj;
        })
      );
    }
  }, [integrationData?.config]);

  const handleSave = async () => {
    setIsSaving(true);
    setConnectionMessage(null);
    try {
      // Build the config object to save
      const configToSave = {
        ...config,
        syncContacts: syncObjects.find((o) => o.id === "contacts")?.enabled ?? true,
        syncOpportunities: syncObjects.find((o) => o.id === "opportunities")?.enabled ?? true,
        syncLeads: syncObjects.find((o) => o.id === "leads")?.enabled ?? true,
        syncAccounts: syncObjects.find((o) => o.id === "accounts")?.enabled ?? false,
      };

      await saveSettingsMutation({
        type: "salesforce",
        config: configToSave,
        instanceUrl: config.instanceUrl,
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
      await onSync?.();
      setConnectionMessage("Sync started");
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
      const result = await testConnectionMutation({ type: "salesforce" });
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
    if (confirm("Are you sure you want to disconnect Salesforce? This will stop all data sync.")) {
      try {
        await disconnectMutation({ type: "salesforce" });
        setConnectionMessage("Disconnected successfully");
      } catch (error) {
        setConnectionMessage(`Error disconnecting: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const handleToggleSync = (objectId: string, enabled: boolean) => {
    setSyncObjects((prev) =>
      prev.map((obj) => (obj.id === objectId ? { ...obj, enabled } : obj))
    );
  };

  const isConnected = status === "connected" || status === "syncing";

  if (!isEditing && !isConnected) {
    return (
      <IntegrationCard
        icon={Cloud}
        name="Salesforce"
        description="Sync contacts, opportunities, and leads with your Salesforce org"
        status={status}
        lastSynced={lastSynced}
        onConnect={onConnect || (() => setIsEditing(true))}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00A1E0]">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Salesforce</CardTitle>
              <CardDescription>
                Sync contacts, opportunities, and leads with your Salesforce org
              </CardDescription>
            </div>
          </div>
          <Badge variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"}>
            {status === "connected" ? "Connected" : status === "error" ? "Error" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Info */}
        {isConnected && config.instanceUrl && (
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              <span className="font-medium">Connected to:</span>{" "}
              <span className="text-zinc-900 dark:text-zinc-50">
                {config.instanceUrl}
              </span>
            </p>
            {lastSynced && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Last synced: {lastSynced}
              </p>
            )}
          </div>
        )}

        {/* Sync Objects */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Object Sync Settings
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
              {syncObjects.map((obj) => (
                <div
                  key={obj.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center">
                      {obj.hasError ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : obj.enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {obj.name}
                        </span>
                        {obj.recordCount !== undefined && obj.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            {obj.recordCount.toLocaleString()} records
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {obj.description}
                        {obj.lastSynced && obj.enabled && (
                          <span> - Last synced {obj.lastSynced}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={obj.enabled}
                    onCheckedChange={(checked: boolean) =>
                      handleToggleSync(obj.id, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {isConnected && (
          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Advanced Settings
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bidirectional-sync" className="text-sm font-medium">
                  Bidirectional Sync
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Push changes from your CRM back to Salesforce
                </p>
              </div>
              <Switch
                id="bidirectional-sync"
                checked={config.bidirectionalSync}
                onCheckedChange={(checked: boolean) =>
                  setConfig((prev) => ({ ...prev, bidirectionalSync: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sync Interval</Label>
              <div className="flex gap-2">
                {(["realtime", "hourly", "daily"] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, syncInterval: interval }))
                    }
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      config.syncInterval === interval
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  </button>
                ))}
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
                <Button onClick={onConnect} size="sm">
                  Connect with Salesforce
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
