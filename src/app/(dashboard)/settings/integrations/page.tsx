"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plug,
  Key,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function IntegrationsPage() {
  // Parallel.ai integration
  const parallelSettings = useQuery(api.integrations.getSettings, { type: "parallel" });
  const saveSettings = useMutation(api.integrations.saveSettings);
  const testConnection = useMutation(api.integrations.testConnection);
  const enrichmentStats = useQuery(api.parallel.getEnrichmentStats);
  const processQueue = useAction(api.parallel.processEnrichmentQueue);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const isLoaded = parallelSettings !== undefined;

  const handleSaveParallel = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        type: "parallel",
        config: {
          processor: "base", // base, core, or lite
          autoEnrich: true,
        },
        apiKey: apiKey || undefined,
      });
      toast.success("Parallel.ai settings saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection({ type: "parallel" });
      if (result.success) {
        toast.success(result.message || "Connection successful");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error("Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const result = await processQueue({});
      toast.success(`Processed ${result.processed} items, ${result.errors} errors`);
    } catch (error) {
      console.error("Failed to process queue:", error);
      toast.error("Failed to process queue");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded) {
    return <IntegrationsSkeleton />;
  }

  const isConnected = parallelSettings?.status === "connected";
  const hasCredentials = Boolean(parallelSettings?.credentials?.hasAccessToken || apiKey);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Connect third-party services to enhance your CRM capabilities.
        </p>
      </div>

      {/* Parallel.ai Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Parallel.ai
                  {isConnected ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  AI-powered data enrichment for contacts and companies
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parallel-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="parallel-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      parallelSettings?.credentials?.apiKeyMasked ||
                      "Enter your Parallel.ai API key"
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button onClick={handleSaveParallel} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !hasCredentials}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Get your API key from{" "}
                <a
                  href="https://platform.parallel.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  platform.parallel.ai
                </a>
              </p>
            </div>
          </div>

          {isConnected && (
            <>
              <Separator />

              {/* Enrichment Queue Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Enrichment Queue
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleProcessQueue}
                    disabled={isProcessing || (enrichmentStats?.pending ?? 0) === 0}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Process Now
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Pending
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {enrichmentStats?.pending ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Processing
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {enrichmentStats?.processing ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Completed
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {enrichmentStats?.completed ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Failed
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {enrichmentStats?.failed ?? 0}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  The enrichment queue is processed automatically every 5 minutes.
                </p>
              </div>

              <Separator />

              {/* Sync Status */}
              {parallelSettings?.lastSyncedAt && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Last Sync
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {new Date(parallelSettings.lastSyncedAt).toLocaleString()}
                      </p>
                    </div>
                    {parallelSettings.lastSyncStatus && (
                      <Badge
                        variant={
                          parallelSettings.lastSyncStatus === "success"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          parallelSettings.lastSyncStatus === "success"
                            ? "bg-emerald-500"
                            : ""
                        }
                      >
                        {parallelSettings.lastSyncStatus}
                      </Badge>
                    )}
                  </div>
                  {parallelSettings.lastSyncError && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {parallelSettings.lastSyncError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Features */}
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              What Parallel.ai Provides
            </h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <Users className="h-3 w-3 text-indigo-500" />
                Contact enrichment (title, company, LinkedIn)
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <Building2 className="h-3 w-3 text-indigo-500" />
                Company enrichment (size, industry, funding)
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <TrendingUp className="h-3 w-3 text-indigo-500" />
                Tech stack and competitor data
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                AI-powered web research
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Integrations Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-400">
            <Plug className="h-5 w-5" />
            More Integrations Coming Soon
          </CardTitle>
          <CardDescription>
            Gmail, Slack, Stripe, and more integrations are on the roadmap.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
