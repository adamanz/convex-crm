"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface SendblueConfig {
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  autoReply: boolean;
  syncConversations: boolean;
  syncMessages: boolean;
}

interface SendblueSettingsProps {
  // No props needed - data comes from backend
}

export function SendblueSettings({}: SendblueSettingsProps) {
  // Backend queries and mutations
  const integrationData = useQuery(api.integrations.getSettings, { type: "sendblue" });
  const saveSettingsMutation = useMutation(api.integrations.saveSettings);
  const testConnectionMutation = useMutation(api.integrations.testConnection);
  const disconnectMutation = useMutation(api.integrations.disconnect);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Derive status from backend data
  const status: IntegrationStatus = integrationData?.status || "disconnected";
  const lastSynced = integrationData?.lastSyncedAt
    ? formatLastSynced(integrationData.lastSyncedAt)
    : undefined;

  const [config, setConfig] = useState<SendblueConfig>({
    apiKey: "",
    apiSecret: "",
    webhookUrl: "",
    autoReply: false,
    syncConversations: true,
    syncMessages: true,
  });

  // Load config from backend when data is available
  useEffect(() => {
    if (integrationData?.config) {
      const backendConfig = integrationData.config as Partial<SendblueConfig>;
      setConfig((prev) => ({
        ...prev,
        webhookUrl: backendConfig.webhookUrl || prev.webhookUrl,
        autoReply: backendConfig.autoReply ?? prev.autoReply,
        syncConversations: backendConfig.syncConversations ?? prev.syncConversations,
        syncMessages: backendConfig.syncMessages ?? prev.syncMessages,
      }));
    }
    // Show masked API keys if available
    if (integrationData?.credentials) {
      if (integrationData.credentials.apiKeyMasked) {
        setConfig((prev) => ({
          ...prev,
          apiKey: integrationData.credentials?.apiKeyMasked || "",
        }));
      }
      if (integrationData.credentials.apiSecretMasked) {
        setConfig((prev) => ({
          ...prev,
          apiSecret: integrationData.credentials?.apiSecretMasked || "",
        }));
      }
    }
  }, [integrationData]);

  const handleSave = async () => {
    setIsSaving(true);
    setConnectionMessage(null);
    try {
      // Build config without API keys (they're sent separately)
      const configToSave = {
        webhookUrl: config.webhookUrl,
        autoReply: config.autoReply,
        syncConversations: config.syncConversations,
        syncMessages: config.syncMessages,
      };

      // Only send API keys if they were changed (not masked values)
      const apiKey = config.apiKey.includes("****") ? undefined : config.apiKey;
      const apiSecret = config.apiSecret.includes("****") ? undefined : config.apiSecret;

      await saveSettingsMutation({
        type: "sendblue",
        config: configToSave,
        apiKey,
        apiSecret,
      });

      setConnectionMessage("Settings saved successfully");
      setIsEditing(false);
    } catch (error) {
      setConnectionMessage(`Error saving settings: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionMessage(null);
    try {
      const result = await testConnectionMutation({ type: "sendblue" });
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
    if (confirm("Are you sure you want to disconnect Sendblue? This will stop all messaging sync.")) {
      try {
        await disconnectMutation({ type: "sendblue" });
        setConnectionMessage("Disconnected successfully");
      } catch (error) {
        setConnectionMessage(`Error disconnecting: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const isConnected = status === "connected" || status === "syncing";

  if (!isEditing && !isConnected) {
    return (
      <IntegrationCard
        icon={MessageSquare}
        name="Sendblue"
        description="Send and receive iMessage and SMS directly from your CRM"
        status={status}
        lastSynced={lastSynced}
        onConnect={() => setIsEditing(true)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Sendblue</CardTitle>
              <CardDescription>
                Send and receive iMessage and SMS directly from your CRM
              </CardDescription>
            </div>
          </div>
          <Badge variant={status === "connected" ? "success" : status === "error" ? "destructive" : "secondary"}>
            {status === "connected" ? "Connected" : status === "error" ? "Error" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Credentials */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            API Credentials
          </h3>

          <div className="space-y-2">
            <Label htmlFor="sendblue-api-key">API Key</Label>
            <div className="relative">
              <Input
                id="sendblue-api-key"
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="sb_api_..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sendblue-api-secret">API Secret</Label>
            <div className="relative">
              <Input
                id="sendblue-api-secret"
                type={showApiSecret ? "text" : "password"}
                value={config.apiSecret}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, apiSecret: e.target.value }))
                }
                placeholder="sb_secret_..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showApiSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sendblue-webhook">Webhook URL</Label>
            <Input
              id="sendblue-webhook"
              value={config.webhookUrl}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
              placeholder="https://your-app.convex.site/webhooks/sendblue/receive"
              disabled
              className="bg-zinc-50 dark:bg-zinc-900"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure this URL in your Sendblue dashboard
            </p>
          </div>
        </div>

        {/* Sync Settings */}
        {isConnected && (
          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Sync Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-conversations" className="text-sm font-medium">
                    Sync Conversations
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Automatically sync conversations to your CRM
                  </p>
                </div>
                <Switch
                  id="sync-conversations"
                  checked={config.syncConversations}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, syncConversations: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-messages" className="text-sm font-medium">
                    Sync Messages
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Store message history in your CRM database
                  </p>
                </div>
                <Switch
                  id="sync-messages"
                  checked={config.syncMessages}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, syncMessages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-reply" className="text-sm font-medium">
                    AI Auto-Reply
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Enable AI-powered automatic responses
                  </p>
                </div>
                <Switch
                  id="auto-reply"
                  checked={config.autoReply}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({ ...prev, autoReply: checked }))
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
          <div className="flex items-center gap-2">
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
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isSaving || !config.apiKey || !config.apiSecret || config.apiKey.includes("****")}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
