"use client";

import { History } from "lucide-react";
import { AuditLogTable } from "@/components/audit/AuditLogTable";

export default function AuditLogPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <History className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Audit Log
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Track all changes made to your CRM data
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The audit log records all create, update, and delete operations on your data.
          Use the filters below to find specific changes by user, entity type, action, or date range.
          Click on any entry to see the full details and changes made.
        </p>
      </div>

      {/* Audit Log Table */}
      <AuditLogTable showFilters={true} />
    </div>
  );
}
