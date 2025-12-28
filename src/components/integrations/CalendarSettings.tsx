"use client";

import { useState } from "react";
import { Calendar, Eye, EyeOff, RefreshCw, Loader2, ExternalLink, Copy, Check } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CalendarSettingsConfig {
  // Google Calendar
  googleClientId: string;
  googleClientSecret: string;
  googleEnabled: boolean;

  // Outlook Calendar
  outlookClientId: string;
  outlookClientSecret: string;
  outlookEnabled: boolean;

  // General settings
  defaultSyncDirection: "one-way" | "two-way";
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

interface CalendarSettingsProps {
  initialConfig?: Partial<CalendarSettingsConfig>;
  onSave?: (config: CalendarSettingsConfig) => Promise<void>;
  convexSiteUrl?: string;
}

export function CalendarSettings({
  initialConfig,
  onSave,
  convexSiteUrl,
}: CalendarSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showOutlookSecret, setShowOutlookSecret] = useState(false);

  const [config, setConfig] = useState<CalendarSettingsConfig>({
    googleClientId: initialConfig?.googleClientId || "",
    googleClientSecret: initialConfig?.googleClientSecret || "",
    googleEnabled: initialConfig?.googleEnabled ?? false,
    outlookClientId: initialConfig?.outlookClientId || "",
    outlookClientSecret: initialConfig?.outlookClientSecret || "",
    outlookEnabled: initialConfig?.outlookEnabled ?? false,
    defaultSyncDirection: initialConfig?.defaultSyncDirection || "two-way",
    autoSyncEnabled: initialConfig?.autoSyncEnabled ?? true,
    syncIntervalMinutes: initialConfig?.syncIntervalMinutes || 15,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(config);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Callback URLs for OAuth configuration
  const googleCallbackUrl = convexSiteUrl
    ? `${convexSiteUrl}/oauth/google/callback`
    : "https://YOUR_DEPLOYMENT.convex.site/oauth/google/callback";

  const outlookCallbackUrl = convexSiteUrl
    ? `${convexSiteUrl}/oauth/outlook/callback`
    : "https://YOUR_DEPLOYMENT.convex.site/oauth/outlook/callback";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Calendar Integration</CardTitle>
              <CardDescription>
                Connect external calendars to sync meetings and events
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.googleEnabled || config.outlookEnabled ? "default" : "secondary"}>
            {config.googleEnabled || config.outlookEnabled ? "Configured" : "Not Configured"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">Google Calendar</TabsTrigger>
            <TabsTrigger value="outlook">Outlook Calendar</TabsTrigger>
          </TabsList>

          {/* Google Calendar Tab */}
          <TabsContent value="google" className="space-y-4 pt-4">
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription className="text-sm">
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Create a new OAuth 2.0 Client ID</li>
                  <li>Add the callback URL below as an authorized redirect URI</li>
                  <li>Enable the Google Calendar API</li>
                  <li>Copy your Client ID and Client Secret below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Callback URL */}
              <div className="space-y-2">
                <Label>Callback URL (add to Google Console)</Label>
                <div className="flex gap-2">
                  <Input
                    value={googleCallbackUrl}
                    readOnly
                    className="bg-zinc-50 font-mono text-sm dark:bg-zinc-900"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(googleCallbackUrl, "google-callback")}
                  >
                    {copied === "google-callback" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="google-client-id">Client ID</Label>
                <Input
                  id="google-client-id"
                  placeholder="123456789-abcdefg.apps.googleusercontent.com"
                  value={config.googleClientId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, googleClientId: e.target.value }))
                  }
                />
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="google-client-secret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="google-client-secret"
                    type={showGoogleSecret ? "text" : "password"}
                    placeholder="GOCSPX-..."
                    value={config.googleClientSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, googleClientSecret: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showGoogleSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="google-enabled" className="text-sm font-medium">
                    Enable Google Calendar
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Allow users to connect their Google Calendar
                  </p>
                </div>
                <Switch
                  id="google-enabled"
                  checked={config.googleEnabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, googleEnabled: checked }))
                  }
                  disabled={!config.googleClientId || !config.googleClientSecret}
                />
              </div>
            </div>
          </TabsContent>

          {/* Outlook Calendar Tab */}
          <TabsContent value="outlook" className="space-y-4 pt-4">
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription className="text-sm">
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Azure Portal - App Registrations</a></li>
                  <li>Create a new application registration</li>
                  <li>Add the callback URL below as a redirect URI</li>
                  <li>Add Calendar.ReadWrite permission under API permissions</li>
                  <li>Create a client secret and copy both values below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Callback URL */}
              <div className="space-y-2">
                <Label>Callback URL (add to Azure Portal)</Label>
                <div className="flex gap-2">
                  <Input
                    value={outlookCallbackUrl}
                    readOnly
                    className="bg-zinc-50 font-mono text-sm dark:bg-zinc-900"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(outlookCallbackUrl, "outlook-callback")}
                  >
                    {copied === "outlook-callback" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="outlook-client-id">Application (Client) ID</Label>
                <Input
                  id="outlook-client-id"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={config.outlookClientId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, outlookClientId: e.target.value }))
                  }
                />
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="outlook-client-secret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="outlook-client-secret"
                    type={showOutlookSecret ? "text" : "password"}
                    placeholder="Your Azure client secret"
                    value={config.outlookClientSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, outlookClientSecret: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOutlookSecret(!showOutlookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showOutlookSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="outlook-enabled" className="text-sm font-medium">
                    Enable Outlook Calendar
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Allow users to connect their Outlook Calendar
                  </p>
                </div>
                <Switch
                  id="outlook-enabled"
                  checked={config.outlookEnabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, outlookEnabled: checked }))
                  }
                  disabled={!config.outlookClientId || !config.outlookClientSecret}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* General Settings */}
        <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Sync Settings
          </h3>

          <div className="space-y-4">
            {/* Default Sync Direction */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Default Sync Direction</Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  How events sync between CRM and calendars
                </p>
              </div>
              <select
                value={config.defaultSyncDirection}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    defaultSyncDirection: e.target.value as "one-way" | "two-way",
                  }))
                }
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="one-way">One-way (CRM to Calendar)</option>
                <option value="two-way">Two-way (Bidirectional)</option>
              </select>
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="text-sm font-medium">
                  Automatic Sync
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Periodically sync events in the background
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={config.autoSyncEnabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, autoSyncEnabled: checked }))
                }
              />
            </div>

            {/* Sync Interval */}
            {config.autoSyncEnabled && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Sync Interval</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    How often to check for calendar updates
                  </p>
                </div>
                <select
                  value={config.syncIntervalMinutes}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      syncIntervalMinutes: parseInt(e.target.value),
                    }))
                  }
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
