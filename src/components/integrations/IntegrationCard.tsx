"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";

interface IntegrationCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSynced?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const statusConfig: Record<
  IntegrationStatus,
  { label: string; variant: "success" | "secondary" | "destructive" | "warning" }
> = {
  connected: { label: "Connected", variant: "success" },
  disconnected: { label: "Not Connected", variant: "secondary" },
  error: { label: "Error", variant: "destructive" },
  syncing: { label: "Syncing...", variant: "warning" },
};

export function IntegrationCard({
  icon: Icon,
  name,
  description,
  status,
  lastSynced,
  onConnect,
  onDisconnect,
  onSettings,
  isLoading,
  children,
}: IntegrationCardProps) {
  const { label, variant } = statusConfig[status];
  const isConnected = status === "connected" || status === "syncing";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                isConnected
                  ? "bg-zinc-900 dark:bg-zinc-50"
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isConnected
                    ? "text-white dark:text-zinc-900"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSynced && status === "connected" && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Last synced: {lastSynced}
          </p>
        )}

        {children}

        <div className="flex items-center gap-2 pt-2">
          {isConnected ? (
            <>
              {onSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSettings}
                  disabled={isLoading}
                >
                  Configure
                </Button>
              )}
              {onDisconnect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Disconnect
                </Button>
              )}
            </>
          ) : (
            onConnect && (
              <Button onClick={onConnect} size="sm" disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
