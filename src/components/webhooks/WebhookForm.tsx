"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EventSelector } from "./EventSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Copy, Check, Eye, EyeOff } from "lucide-react";

interface WebhookFormData {
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
}

interface WebhookFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook?: {
    _id: Id<"webhookSubscriptions">;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    secret: string;
  } | null;
  onSuccess?: (secret?: string) => void;
}

export function WebhookForm({
  open,
  onOpenChange,
  webhook,
  onSuccess,
}: WebhookFormProps) {
  const isEditing = !!webhook;

  const createWebhook = useMutation(api.webhooks.createSubscription);
  const updateWebhook = useMutation(api.webhooks.updateSubscription);

  const [formData, setFormData] = useState<WebhookFormData>({
    name: webhook?.name ?? "",
    url: webhook?.url ?? "",
    events: webhook?.events ?? [],
    isActive: webhook?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.url.trim()) {
      setError("URL is required");
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    if (formData.events.length === 0) {
      setError("At least one event must be selected");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateWebhook({
          id: webhook._id,
          name: formData.name,
          url: formData.url,
          events: formData.events,
          isActive: formData.isActive,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        const result = await createWebhook({
          name: formData.name,
          url: formData.url,
          events: formData.events,
          isActive: formData.isActive,
        });
        setNewSecret(result.secret);
        onSuccess?.(result.secret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = () => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (newSecret) {
      // Reset form when closing after showing secret
      setFormData({
        name: "",
        url: "",
        events: [],
        isActive: true,
      });
      setNewSecret(null);
    }
    onOpenChange(false);
  };

  // Show secret after creation
  if (newSecret) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Created Successfully</DialogTitle>
            <DialogDescription>
              Save this secret key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Important</p>
                  <p className="mt-1">
                    This secret is used to verify webhook signatures. Store it
                    securely - you&apos;ll need it to validate incoming webhooks.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signing Secret</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={newSecret}
                    readOnly
                    className="pr-10 font-mono text-sm"
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
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Webhook" : "Create Webhook"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your webhook subscription settings."
                : "Set up a new webhook endpoint to receive CRM events."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Webhook"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                A friendly name to identify this webhook.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/webhooks/crm"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                The HTTPS URL where webhook events will be sent.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <EventSelector
                selectedEvents={formData.events}
                onChange={(events) => setFormData({ ...formData, events })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enable or disable this webhook subscription.
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
