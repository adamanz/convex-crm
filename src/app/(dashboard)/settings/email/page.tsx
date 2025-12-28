"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Mail,
  Save,
  Loader2,
  Send,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle2,
  Settings,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type EmailProvider = "none" | "smtp" | "sendgrid" | "resend" | "mailgun" | "postmark";

interface EmailSettingsFormData {
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  apiKeyConfigured: boolean;
  defaultFromEmail: string;
  defaultFromName: string;
  replyToEmail: string;
  enableOpenTracking: boolean;
  enableClickTracking: boolean;
  trackingDomain: string;
  defaultSignature: string;
  dailySendLimit: number;
  hourlySendLimit: number;
}

const PROVIDER_OPTIONS = [
  { value: "none", label: "Not Configured", description: "Email sending disabled" },
  { value: "smtp", label: "SMTP", description: "Use your own SMTP server" },
  { value: "sendgrid", label: "SendGrid", description: "Twilio SendGrid API" },
  { value: "resend", label: "Resend", description: "Modern email API" },
  { value: "mailgun", label: "Mailgun", description: "Email API service" },
  { value: "postmark", label: "Postmark", description: "Transactional email" },
];

export default function EmailSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Fetch current settings
  const settings = useQuery(api.email.getSettings);
  const stats = useQuery(api.email.getStats, { period: "week" });

  // Mutations
  const updateSettings = useMutation(api.email.updateSettings);
  const sendTestEmail = useMutation(api.email.sendTestEmail);

  const [formData, setFormData] = useState<EmailSettingsFormData>({
    provider: "none",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: true,
    smtpUsername: "",
    apiKeyConfigured: false,
    defaultFromEmail: "",
    defaultFromName: "",
    replyToEmail: "",
    enableOpenTracking: true,
    enableClickTracking: true,
    trackingDomain: "",
    defaultSignature: "",
    dailySendLimit: 500,
    hourlySendLimit: 50,
  });

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setFormData({
        provider: settings.provider ?? "none",
        smtpHost: settings.smtpHost ?? "",
        smtpPort: settings.smtpPort ?? 587,
        smtpSecure: settings.smtpSecure ?? true,
        smtpUsername: settings.smtpUsername ?? "",
        apiKeyConfigured: settings.apiKeyConfigured ?? false,
        defaultFromEmail: settings.defaultFromEmail ?? "",
        defaultFromName: settings.defaultFromName ?? "",
        replyToEmail: settings.replyToEmail ?? "",
        enableOpenTracking: settings.enableOpenTracking ?? true,
        enableClickTracking: settings.enableClickTracking ?? true,
        trackingDomain: settings.trackingDomain ?? "",
        defaultSignature: settings.defaultSignature ?? "",
        dailySendLimit: settings.dailySendLimit ?? 500,
        hourlySendLimit: settings.hourlySendLimit ?? 50,
      });
    }
  }, [settings]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSwitchChange = (name: keyof EmailSettingsFormData) => {
    return (checked: boolean) => {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    };
  };

  const handleProviderChange = (value: EmailProvider) => {
    setFormData((prev) => ({ ...prev, provider: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        provider: formData.provider,
        smtpHost: formData.smtpHost || undefined,
        smtpPort: formData.smtpPort || undefined,
        smtpSecure: formData.smtpSecure,
        smtpUsername: formData.smtpUsername || undefined,
        apiKeyConfigured: formData.apiKeyConfigured,
        defaultFromEmail: formData.defaultFromEmail || undefined,
        defaultFromName: formData.defaultFromName || undefined,
        replyToEmail: formData.replyToEmail || undefined,
        enableOpenTracking: formData.enableOpenTracking,
        enableClickTracking: formData.enableClickTracking,
        trackingDomain: formData.trackingDomain || undefined,
        defaultSignature: formData.defaultSignature || undefined,
        dailySendLimit: formData.dailySendLimit || undefined,
        hourlySendLimit: formData.hourlySendLimit || undefined,
      });
      toast.success("Email settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsTesting(true);
    try {
      await sendTestEmail({ toEmail: testEmail });
      toast.success("Test email sent!", {
        description: `Check ${testEmail} for the test message`,
      });
    } catch (error) {
      toast.error("Failed to send test email", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = formData.provider !== "none";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Email Settings
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Configure email sending, templates, and tracking
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {isConfigured ? "Configured" : "Not Configured"}
                </p>
                <p className="text-xs text-zinc-500">
                  {PROVIDER_OPTIONS.find((p) => p.value === formData.provider)?.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {stats?.sent ?? 0}
                </p>
                <p className="text-xs text-zinc-500">Sent this week</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {stats?.openRate ?? 0}%
                </p>
                <p className="text-xs text-zinc-500">Open rate</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MousePointer className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {stats?.clickRate ?? 0}%
                </p>
                <p className="text-xs text-zinc-500">Click rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Email Provider
          </CardTitle>
          <CardDescription>
            Choose how to send emails from your CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-zinc-500">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SMTP Settings */}
          {formData.provider === "smtp" && (
            <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-medium">SMTP Configuration</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    value={formData.smtpHost}
                    onChange={handleInputChange}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    value={formData.smtpPort}
                    onChange={handleInputChange}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username</Label>
                  <Input
                    id="smtpUsername"
                    name="smtpUsername"
                    value={formData.smtpUsername}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <Switch
                    id="smtpSecure"
                    checked={formData.smtpSecure}
                    onCheckedChange={handleSwitchChange("smtpSecure")}
                  />
                  <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Note: SMTP password should be set as an environment variable
                (SMTP_PASSWORD) for security.
              </p>
            </div>
          )}

          {/* API Key Provider Settings */}
          {["sendgrid", "resend", "mailgun", "postmark"].includes(
            formData.provider
          ) && (
            <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-medium">API Configuration</h4>
              <div className="flex items-center gap-3">
                {formData.apiKeyConfigured ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    API Key Configured
                  </Badge>
                ) : (
                  <Badge variant="warning" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    API Key Not Set
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Set the API key as an environment variable (
                {formData.provider.toUpperCase()}_API_KEY) in your Convex
                dashboard for security.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sender Information</CardTitle>
          <CardDescription>
            Configure the default sender details for outgoing emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultFromEmail">From Email Address</Label>
              <Input
                id="defaultFromEmail"
                name="defaultFromEmail"
                type="email"
                value={formData.defaultFromEmail}
                onChange={handleInputChange}
                placeholder="noreply@yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultFromName">From Name</Label>
              <Input
                id="defaultFromName"
                name="defaultFromName"
                value={formData.defaultFromName}
                onChange={handleInputChange}
                placeholder="Your Company"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyToEmail">Reply-To Email (optional)</Label>
            <Input
              id="replyToEmail"
              name="replyToEmail"
              type="email"
              value={formData.replyToEmail}
              onChange={handleInputChange}
              placeholder="support@yourcompany.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSignature">Default Email Signature</Label>
            <Textarea
              id="defaultSignature"
              name="defaultSignature"
              value={formData.defaultSignature}
              onChange={handleInputChange}
              placeholder="Best regards,&#10;Your Name&#10;Your Company"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tracking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tracking & Analytics
          </CardTitle>
          <CardDescription>
            Configure email open and click tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Track Email Opens</Label>
              <p className="text-sm text-zinc-500">
                Track when recipients open your emails using a tracking pixel
              </p>
            </div>
            <Switch
              checked={formData.enableOpenTracking}
              onCheckedChange={handleSwitchChange("enableOpenTracking")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Track Link Clicks</Label>
              <p className="text-sm text-zinc-500">
                Track when recipients click links in your emails
              </p>
            </div>
            <Switch
              checked={formData.enableClickTracking}
              onCheckedChange={handleSwitchChange("enableClickTracking")}
            />
          </div>

          {(formData.enableOpenTracking || formData.enableClickTracking) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="trackingDomain">
                  Custom Tracking Domain (optional)
                </Label>
                <Input
                  id="trackingDomain"
                  name="trackingDomain"
                  value={formData.trackingDomain}
                  onChange={handleInputChange}
                  placeholder="track.yourcompany.com"
                />
                <p className="text-xs text-zinc-500">
                  Use a custom domain for tracking links to improve deliverability
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>
            Set sending limits to prevent abuse and maintain deliverability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dailySendLimit">Daily Send Limit</Label>
              <Input
                id="dailySendLimit"
                name="dailySendLimit"
                type="number"
                value={formData.dailySendLimit}
                onChange={handleInputChange}
                placeholder="500"
              />
              <p className="text-xs text-zinc-500">
                Maximum emails per day (0 for unlimited)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlySendLimit">Hourly Send Limit</Label>
              <Input
                id="hourlySendLimit"
                name="hourlySendLimit"
                type="number"
                value={formData.hourlySendLimit}
                onChange={handleInputChange}
                placeholder="50"
              />
              <p className="text-xs text-zinc-500">
                Maximum emails per hour (0 for unlimited)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify your configuration is working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                type="email"
                className="max-w-sm"
              />
              <Button
                variant="outline"
                onClick={handleTestEmail}
                disabled={isTesting || !testEmail}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
