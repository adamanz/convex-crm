"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Zap,
  Settings,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Clock,
  ChevronRight,
  MessageSquare,
  Building2,
  Filter,
  Slack,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getSlackAuthorizationUrl } from "@/lib/slack";

// Signal type config
const signalTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  expansion: { label: "Expansion", icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-100" },
  risk: { label: "Risk", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
  buying_intent: { label: "Buying Intent", icon: DollarSign, color: "text-blue-600", bgColor: "bg-blue-100" },
  usage: { label: "Usage", icon: Settings, color: "text-purple-600", bgColor: "bg-purple-100" },
  churn: { label: "Churn Risk", icon: X, color: "text-orange-600", bgColor: "bg-orange-100" },
  relationship: { label: "Relationship", icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-100" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  handled: { label: "Handled", color: "bg-green-500" },
  dismissed: { label: "Dismissed", color: "bg-gray-500" },
  snoozed: { label: "Snoozed", color: "bg-yellow-500" },
  synced: { label: "Synced", color: "bg-purple-500" },
};

// Loading skeleton
function MomentumSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-[400px]" />
    </div>
  );
}

// Stats card component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={cn("rounded-lg p-2.5 h-fit", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// Signal card component
function SignalCard({
  signal,
  onStatusChange,
}: {
  signal: {
    _id: Id<"sentinelSignals">;
    type: string;
    text: string;
    confidence: number;
    sentiment?: string | null;
    status: string;
    channelName?: string;
    customerName?: string | null;
    createdAt: number;
  };
  onStatusChange: (signalId: Id<"sentinelSignals">, status: "handled" | "dismissed" | "snoozed") => void;
}) {
  const config = signalTypeConfig[signal.type] || signalTypeConfig.usage;
  const Icon = config.icon;
  const isUrgent = signal.sentiment === "urgent";

  return (
    <Card className={cn("hover:shadow-md transition-shadow", isUrgent && "border-red-200 bg-red-50/30")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("rounded-lg p-2.5 h-fit shrink-0", config.bgColor)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{config.label}</span>
              {signal.status === "new" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  NEW
                </Badge>
              )}
              {isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  URGENT
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{signal.text}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {signal.channelName && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {signal.channelName}
                </span>
              )}
              {signal.customerName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {signal.customerName}
                </span>
              )}
              <span>{new Date(signal.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <span className="text-lg font-bold">{signal.confidence}%</span>
              <p className="text-xs text-muted-foreground">confidence</p>
            </div>

            {signal.status === "new" && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onStatusChange(signal._id, "handled")}
                  title="Mark as handled"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onStatusChange(signal._id, "snoozed")}
                  title="Snooze"
                >
                  <Clock className="w-4 h-4 text-yellow-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onStatusChange(signal._id, "dismissed")}
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state
function EmptyState({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-6 mb-6">
            <Slack className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect Slack to Get Started</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Momentum automatically detects revenue signals from your Slack conversations.
            Connect your workspace to start capturing buying intent, expansion opportunities, and risk signals.
          </p>
          <Button asChild>
            <a href={getSlackAuthorizationUrl()}>
              <Slack className="w-4 h-4 mr-2" />
              Connect Slack
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-slate-100 p-6 mb-6">
          <MessageSquare className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Signals Yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Momentum is monitoring your Slack channels. Signals will appear here when
          buying intent, expansion opportunities, or risk indicators are detected.
        </p>
      </CardContent>
    </Card>
  );
}

export default function MomentumPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number } | null>(null);

  // Fetch data
  const stats = useQuery(api.signals.getStats, {});
  const workspaces = useQuery(api.signals.listWorkspaces, {});

  const signals = useQuery(api.signals.listSignals, {
    signalType: typeFilter !== "all" ? typeFilter as "expansion" | "risk" | "buying_intent" | "usage" | "churn" | "relationship" : undefined,
    status: statusFilter !== "all" ? statusFilter as "new" | "handled" | "dismissed" | "snoozed" | "synced" : undefined,
    minConfidence: minConfidence > 0 ? minConfidence : undefined,
    limit: 50,
  });

  const updateStatus = useMutation(api.signals.updateSignalStatus);

  const handleStatusChange = async (signalId: Id<"sentinelSignals">, status: "handled" | "dismissed" | "snoozed") => {
    await updateStatus({ signalId, status });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch("/api/slack/sync", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setSyncResult({ created: data.created, updated: data.updated });
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading state
  if (stats === undefined || signals === undefined || workspaces === undefined) {
    return <MomentumSkeleton />;
  }

  const isConnected = workspaces.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Momentum
          </h1>
          <p className="text-muted-foreground">
            AI-powered revenue signals from Slack conversations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {syncResult && (
            <span className="text-sm text-muted-foreground">
              Synced: {syncResult.created} new, {syncResult.updated} updated
            </span>
          )}
          {isConnected ? (
            <>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
                {isSyncing ? "Syncing..." : "Sync Contacts"}
              </Button>
            </>
          ) : (
            <Button asChild>
              <a href={getSlackAuthorizationUrl()}>
                <Slack className="w-4 h-4 mr-2" />
                Connect Slack
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Signals"
          value={stats.totalSignals}
          icon={MessageSquare}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="New Signals"
          value={stats.newSignals}
          icon={Zap}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
          subtitle="Awaiting review"
        />
        <StatCard
          title="High Confidence"
          value={stats.highConfidenceSignals}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          subtitle="80%+ confidence"
        />
        <StatCard
          title="Urgent"
          value={stats.urgentSignals}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          subtitle="Needs attention"
        />
      </div>

      {/* Signal type breakdown */}
      {stats.totalSignals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Signal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.byType).map(([type, count]) => {
                const config = signalTypeConfig[type];
                if (!config || count === 0) return null;
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("rounded p-1", config.bgColor)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signals list */}
      <Tabs defaultValue="signals" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Signal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(signalTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Min confidence:</span>
              <Slider
                value={[minConfidence]}
                onValueChange={([val]) => setMinConfidence(val)}
                max={100}
                step={10}
                className="w-24"
              />
              <span className="text-sm font-medium w-8">{minConfidence}%</span>
            </div>
          </div>
        </div>

        <TabsContent value="signals" className="space-y-4">
          {signals.length === 0 ? (
            <EmptyState connected={isConnected} />
          ) : (
            signals.map((signal) => (
              <SignalCard
                key={signal._id}
                signal={signal}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          {workspaces.length === 0 ? (
            <EmptyState connected={false} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workspaces.map((workspace) => (
                <Card key={workspace._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-purple-100 p-3">
                        <Slack className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {workspace.slackTeamDomain || workspace.slackTeamId}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Connected {new Date(workspace.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={workspace.healthStatus === "healthy" ? "default" : "destructive"}
                      >
                        {workspace.healthStatus || "healthy"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
