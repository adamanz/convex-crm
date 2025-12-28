"use client";

import { WebhookList } from "@/components/webhooks";

export default function WebhooksSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Webhooks
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Configure outbound webhooks to send CRM events to external services
        </p>
      </div>

      {/* Webhook List */}
      <WebhookList />
    </div>
  );
}
