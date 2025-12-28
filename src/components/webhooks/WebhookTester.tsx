"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, AlertCircle, Send } from "lucide-react";

interface WebhookTesterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: Id<"webhookSubscriptions">;
  webhookName: string;
}

export function WebhookTester({
  open,
  onOpenChange,
  subscriptionId,
  webhookName,
}: WebhookTesterProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const testWebhook = useMutation(api.webhooks.testWebhook);

  const handleTest = async () => {
    setStatus("sending");
    setError(null);

    try {
      await testWebhook({ id: subscriptionId });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send test webhook");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>
            Send a test payload to &quot;{webhookName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {status === "idle" && (
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto">
                <Send className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  This will send a test event to your webhook endpoint.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  The event type will be &quot;test&quot; with a sample payload.
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-left">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Sample Payload
                </p>
                <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
{`{
  "type": "test",
  "message": "This is a test webhook from your CRM",
  "timestamp": ${Date.now()}
}`}
                </pre>
              </div>
            </div>
          )}

          {status === "sending" && (
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Sending test webhook...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Test webhook sent!
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Check your endpoint to verify it was received. You can also view
                  the delivery in the delivery history.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Failed to send test webhook
                </p>
                {error && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleTest}>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </>
          )}
          {status === "sending" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </Button>
          )}
          {(status === "success" || status === "error") && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {status === "error" && (
                <Button onClick={handleTest}>
                  Try Again
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
