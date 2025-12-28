"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { WebhookCard } from "./WebhookCard";
import { WebhookForm } from "./WebhookForm";
import { DeliveryLog } from "./DeliveryLog";
import { Plus, Webhook, Loader2 } from "lucide-react";

export function WebhookList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [viewingDeliveries, setViewingDeliveries] = useState<{
    id: Id<"webhookSubscriptions">;
    name: string;
  } | null>(null);

  const webhooks = useQuery(api.webhooks.listSubscriptions, {});

  const handleEdit = (webhook: any) => {
    setEditingWebhook(webhook);
  };

  const handleCloseEdit = () => {
    setEditingWebhook(null);
  };

  const handleViewDeliveries = (id: Id<"webhookSubscriptions">, name: string) => {
    setViewingDeliveries({ id, name });
  };

  if (!webhooks) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Webhook Subscriptions
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Send real-time events to your external services
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Empty State */}
      {webhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto mb-4">
            <Webhook className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            No webhooks configured
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            Webhooks allow you to send real-time notifications to your external
            services when events happen in your CRM.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Webhook
          </Button>
        </div>
      ) : (
        /* Webhook Cards */
        <div className="grid gap-4 md:grid-cols-2">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook._id}
              webhook={webhook}
              onEdit={() => handleEdit(webhook)}
              onViewDeliveries={() =>
                handleViewDeliveries(webhook._id, webhook.name)
              }
            />
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Webhook Security
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          All webhooks are signed using HMAC-SHA256. Verify the signature to
          ensure requests are from your CRM.
        </p>
        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-zinc-300 font-mono">
{`// Verify webhook signature (Node.js example)
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}
          </pre>
        </div>
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium mb-2">Headers sent with each webhook:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                X-Webhook-Signature
              </code>{" "}
              - HMAC-SHA256 signature (sha256=...)
            </li>
            <li>
              <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                X-Webhook-Event
              </code>{" "}
              - Event type (e.g., contact.created)
            </li>
            <li>
              <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                X-Webhook-Timestamp
              </code>{" "}
              - Unix timestamp in milliseconds
            </li>
            <li>
              <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                X-Webhook-Delivery-Id
              </code>{" "}
              - Unique delivery ID
            </li>
          </ul>
        </div>
      </div>

      {/* Create Form */}
      <WebhookForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => setShowCreateForm(false)}
      />

      {/* Edit Form */}
      {editingWebhook && (
        <WebhookForm
          open={!!editingWebhook}
          onOpenChange={handleCloseEdit}
          webhook={editingWebhook}
          onSuccess={handleCloseEdit}
        />
      )}

      {/* Delivery Log */}
      {viewingDeliveries && (
        <DeliveryLog
          open={!!viewingDeliveries}
          onOpenChange={() => setViewingDeliveries(null)}
          subscriptionId={viewingDeliveries.id}
          webhookName={viewingDeliveries.name}
        />
      )}
    </div>
  );
}
