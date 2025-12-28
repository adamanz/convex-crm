"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Sparkles,
  Brain,
  Zap,
  Key,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AISettingsPage() {
  const settings = useQuery(api.ai.getSettings);
  const saveSettings = useMutation(api.ai.saveSettings);

  const [isSaving, setIsSaving] = useState(false);
  const [showEnrichmentKey, setShowEnrichmentKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  // Form state
  const [enrichmentProvider, setEnrichmentProvider] = useState<string>("");
  const [enrichmentApiKey, setEnrichmentApiKey] = useState<string>("");
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  const [autoEnrichContacts, setAutoEnrichContacts] = useState(false);
  const [autoEnrichCompanies, setAutoEnrichCompanies] = useState(false);
  const [autoCalculateScores, setAutoCalculateScores] = useState(true);
  const [autoAnalyzeSentiment, setAutoAnalyzeSentiment] = useState(true);

  // Initialize form when settings load
  const isLoaded = settings !== undefined;
  if (isLoaded && enrichmentProvider === "" && settings) {
    setEnrichmentProvider(settings.enrichmentProvider || "clearbit");
    setEnrichmentApiKey(settings.enrichmentApiKey || "");
    setOpenaiApiKey(settings.openaiApiKey || "");
    setAnthropicApiKey(settings.anthropicApiKey || "");
    setAutoEnrichContacts(settings.autoEnrichContacts || false);
    setAutoEnrichCompanies(settings.autoEnrichCompanies || false);
    setAutoCalculateScores(settings.autoCalculateScores ?? true);
    setAutoAnalyzeSentiment(settings.autoAnalyzeSentiment ?? true);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        enrichmentProvider,
        enrichmentApiKey: enrichmentApiKey || undefined,
        openaiApiKey: openaiApiKey || undefined,
        anthropicApiKey: anthropicApiKey || undefined,
        autoEnrichContacts,
        autoEnrichCompanies,
        autoCalculateScores,
        autoAnalyzeSentiment,
      });
      toast.success("AI settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return <AISettingsSkeleton />;
  }

  const hasEnrichmentKey = Boolean(enrichmentApiKey);
  const hasLLMKey = Boolean(openaiApiKey || anthropicApiKey);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          AI Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure AI-powered features including enrichment, lead scoring, and sentiment analysis.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hasEnrichmentKey ? "bg-emerald-100 dark:bg-emerald-950" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <Sparkles className={`h-5 w-5 ${hasEnrichmentKey ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enrichment</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {hasEnrichmentKey ? "Configured" : "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hasLLMKey ? "bg-emerald-100 dark:bg-emerald-950" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <Brain className={`h-5 w-5 ${hasLLMKey ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Analysis</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {hasLLMKey ? "Configured" : "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${autoCalculateScores ? "bg-emerald-100 dark:bg-emerald-950" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <Zap className={`h-5 w-5 ${autoCalculateScores ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Lead Scoring</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {autoCalculateScores ? "Active" : "Disabled"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Data Enrichment
          </CardTitle>
          <CardDescription>
            Automatically enrich contacts and companies with data from third-party providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enrichment-provider">Enrichment Provider</Label>
              <Select value={enrichmentProvider} onValueChange={setEnrichmentProvider}>
                <SelectTrigger id="enrichment-provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parallel">Parallel.ai (Recommended)</SelectItem>
                  <SelectItem value="clearbit">Clearbit</SelectItem>
                  <SelectItem value="apollo">Apollo.io</SelectItem>
                  <SelectItem value="zoominfo">ZoomInfo</SelectItem>
                  <SelectItem value="peopledatalabs">People Data Labs</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrichment-key">API Key</Label>
              <div className="relative">
                <Input
                  id="enrichment-key"
                  type={showEnrichmentKey ? "text" : "password"}
                  value={enrichmentApiKey}
                  onChange={(e) => setEnrichmentApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEnrichmentKey(!showEnrichmentKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showEnrichmentKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-enrich-contacts" className="text-sm font-medium">
                  Auto-enrich Contacts
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Automatically enrich new contacts when they are created
                </p>
              </div>
              <Switch
                id="auto-enrich-contacts"
                checked={autoEnrichContacts}
                onCheckedChange={setAutoEnrichContacts}
                disabled={!hasEnrichmentKey}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-enrich-companies" className="text-sm font-medium">
                  Auto-enrich Companies
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Automatically enrich new companies when they are created
                </p>
              </div>
              <Switch
                id="auto-enrich-companies"
                checked={autoEnrichCompanies}
                onCheckedChange={setAutoEnrichCompanies}
                disabled={!hasEnrichmentKey}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis
          </CardTitle>
          <CardDescription>
            Configure AI models for sentiment analysis, deal insights, and intelligent suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="flex items-center gap-2">
                OpenAI API Key
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
                  Optional
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? "text" : "password"}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showOpenAIKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anthropic-key" className="flex items-center gap-2">
                Anthropic API Key
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
                  Optional
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? "text" : "password"}
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showAnthropicKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sentiment" className="text-sm font-medium">
                  Auto-analyze Sentiment
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Automatically analyze sentiment in activity notes and emails
                </p>
              </div>
              <Switch
                id="auto-sentiment"
                checked={autoAnalyzeSentiment}
                onCheckedChange={setAutoAnalyzeSentiment}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Lead Scoring
          </CardTitle>
          <CardDescription>
            Automatically calculate and update lead scores based on engagement and profile data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-scores" className="text-sm font-medium">
                Automatic Lead Scoring
              </Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Automatically calculate scores when contacts are created or updated
              </p>
            </div>
            <Switch
              id="auto-scores"
              checked={autoCalculateScores}
              onCheckedChange={setAutoCalculateScores}
            />
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Scoring Factors
            </h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Lead scores are calculated based on:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Profile completeness (email, phone, title, etc.)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Company association and details
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Recent engagement and activity
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Enrichment data quality
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Tags and categorization
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function AISettingsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
