"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Plus,
  Brain,
  Calculator,
  Camera,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
} from "lucide-react";
import { ForecastChart, ForecastChartData } from "./ForecastChart";
import { ForecastTable, ForecastDeal } from "./ForecastTable";
import { ForecastComparison } from "./ForecastComparison";
import { PredictionConfidence } from "./PredictionConfidence";
import { ForecastFilters } from "./ForecastFilters";

// Type definitions based on the schema
interface Forecast extends Doc<"forecasts"> {}

interface ForecastWithDetails extends Forecast {
  latestSnapshot?: Doc<"forecastSnapshots">;
  snapshots: Doc<"forecastSnapshots">[];
}

interface DealsByCategory {
  deals: {
    committed: Doc<"deals">[];
    bestCase: Doc<"deals">[];
    pipeline: Doc<"deals">[];
    omitted: Doc<"deals">[];
  };
  closedDeals: Doc<"deals">[];
  totals: {
    committed: number;
    bestCase: number;
    pipeline: number;
    omitted: number;
    closed: number;
  };
  dealCounts: {
    committed: number;
    bestCase: number;
    pipeline: number;
    omitted: number;
    closed: number;
  };
}

export interface ForecastDashboardProps {
  className?: string;
  forecastId?: Id<"forecasts">;
  onDealClick?: (dealId: string) => void;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <Skeleton className="h-[400px]" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[300px] lg:col-span-2" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}

interface CreateForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    period: "monthly" | "quarterly" | "yearly";
    targetRevenue?: number;
  }) => Promise<void>;
}

function CreateForecastDialog({ open, onOpenChange, onSubmit }: CreateForecastDialogProps) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("quarterly");
  const [targetRevenue, setTargetRevenue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        period,
        targetRevenue: targetRevenue ? parseFloat(targetRevenue) : undefined,
      });
      onOpenChange(false);
      setName("");
      setTargetRevenue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Forecast</DialogTitle>
          <DialogDescription>
            Set up a new revenue forecast for a specific period.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Forecast Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 2025 Forecast"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="period">Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="target">Target Revenue (Optional)</Label>
            <Input
              id="target"
              type="number"
              value={targetRevenue}
              onChange={(e) => setTargetRevenue(e.target.value)}
              placeholder="1000000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Forecast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ForecastDashboard({
  className,
  forecastId,
  onDealClick,
}: ForecastDashboardProps) {
  const [selectedForecastId, setSelectedForecastId] = useState<Id<"forecasts"> | undefined>(forecastId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  // Queries
  const forecasts = useQuery(api.forecasting.listForecasts, { isActive: true, limit: 10 });
  const currentForecast = useQuery(
    api.forecasting.getForecast,
    selectedForecastId ? { id: selectedForecastId } : "skip"
  ) as ForecastWithDetails | null | undefined;
  const dealsByCategory = useQuery(
    api.forecasting.getDealsByForecastCategory,
    selectedForecastId ? { forecastId: selectedForecastId } : "skip"
  ) as DealsByCategory | null | undefined;
  const historicalAccuracy = useQuery(api.forecasting.getHistoricalAccuracy, { limit: 6 });

  // Mutations
  const createQuickForecast = useMutation(api.forecasting.createQuickForecast);
  const calculateForecast = useMutation(api.forecasting.calculateForecast);
  const snapshotForecast = useMutation(api.forecasting.snapshotForecast);

  // Set initial forecast when data loads
  React.useEffect(() => {
    if (!selectedForecastId && forecasts && forecasts.length > 0) {
      setSelectedForecastId(forecasts[0]._id);
    }
  }, [forecasts, selectedForecastId]);

  // Handlers
  const handleCreateForecast = async (data: {
    name: string;
    period: "monthly" | "quarterly" | "yearly";
    targetRevenue?: number;
  }) => {
    const id = await createQuickForecast({
      period: data.period,
      targetRevenue: data.targetRevenue,
    });
    setSelectedForecastId(id);
  };

  const handleCalculate = async () => {
    if (!selectedForecastId) return;
    setIsCalculating(true);
    try {
      await calculateForecast({ id: selectedForecastId });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSnapshot = async () => {
    if (!selectedForecastId) return;
    setIsSnapshotting(true);
    try {
      await snapshotForecast({ forecastId: selectedForecastId });
    } finally {
      setIsSnapshotting(false);
    }
  };

  // Loading state
  if (forecasts === undefined) {
    return <DashboardSkeleton />;
  }

  // Empty state
  if (forecasts.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Forecasts Yet</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            Create your first revenue forecast to start tracking and predicting your sales pipeline performance.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Forecast
          </Button>
        </Card>

        <CreateForecastDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreateForecast}
        />
      </div>
    );
  }

  // Prepare chart data from snapshots
  const chartData: ForecastChartData[] = currentForecast?.snapshots
    ? currentForecast.snapshots.map((snapshot) => ({
        label: new Date(snapshot.snapshotDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        committed: snapshot.committed,
        bestCase: snapshot.bestCase,
        pipeline: snapshot.pipeline,
        closed: snapshot.closed,
        target: currentForecast.targetRevenue,
        predicted: snapshot.predictedTotal,
      })).reverse()
    : [];

  // Add current state if no snapshots or as latest point
  if (currentForecast && (chartData.length === 0 || true)) {
    const currentData: ForecastChartData = {
      label: "Current",
      committed: currentForecast.committed || 0,
      bestCase: currentForecast.bestCase || 0,
      pipeline: currentForecast.pipeline || 0,
      closed: currentForecast.closed || 0,
      target: currentForecast.targetRevenue,
      predicted: currentForecast.predictedRevenue,
    };

    if (chartData.length === 0) {
      chartData.push(currentData);
    } else {
      chartData.push(currentData);
    }
  }

  // Transform deals for table
  const transformDeals = (deals: Doc<"deals">[]): ForecastDeal[] =>
    deals.map((deal) => ({
      id: deal._id,
      name: deal.name,
      amount: deal.amount || 0,
      probability: deal.probability || 0,
      expectedCloseDate: deal.expectedCloseDate,
    }));

  const tableDeals = dealsByCategory
    ? {
        committed: transformDeals(dealsByCategory.deals.committed),
        bestCase: transformDeals(dealsByCategory.deals.bestCase),
        pipeline: transformDeals(dealsByCategory.deals.pipeline),
        omitted: transformDeals(dealsByCategory.deals.omitted),
      }
    : { committed: [], bestCase: [], pipeline: [], omitted: [] };

  const closedDeals = dealsByCategory
    ? transformDeals(dealsByCategory.closedDeals)
    : [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Revenue Forecasting
            </h1>
            {currentForecast && (
              <Badge variant="outline" className="text-sm">
                {currentForecast.period}
              </Badge>
            )}
          </div>
          {currentForecast && (
            <p className="text-muted-foreground mt-1">
              {new Date(currentForecast.startDate).toLocaleDateString()} -{" "}
              {new Date(currentForecast.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Forecast selector */}
          {forecasts.length > 1 && (
            <Select
              value={selectedForecastId}
              onValueChange={(v) => setSelectedForecastId(v as Id<"forecasts">)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select forecast" />
              </SelectTrigger>
              <SelectContent>
                {forecasts.map((forecast) => (
                  <SelectItem key={forecast._id} value={forecast._id}>
                    {forecast.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculate}
            disabled={isCalculating || !selectedForecastId}
          >
            <Calculator className={cn("h-4 w-4 mr-2", isCalculating && "animate-pulse")} />
            Calculate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSnapshot}
            disabled={isSnapshotting || !selectedForecastId}
          >
            <Camera className={cn("h-4 w-4 mr-2", isSnapshotting && "animate-pulse")} />
            Snapshot
          </Button>

          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Forecast
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {currentForecast && (
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Target"
            value={formatCurrency(currentForecast.targetRevenue || 0)}
            icon={Target}
            iconColor="text-red-500"
          />
          <SummaryCard
            title="Closed Won"
            value={formatCurrency(currentForecast.closed || 0)}
            icon={TrendingUp}
            iconColor="text-green-500"
            change={
              currentForecast.targetRevenue
                ? ((currentForecast.closed || 0) / currentForecast.targetRevenue) * 100
                : undefined
            }
            changeLabel="of target"
          />
          <SummaryCard
            title="AI Predicted"
            value={formatCurrency(currentForecast.predictedRevenue || 0)}
            icon={Brain}
            iconColor="text-cyan-500"
            badge={currentForecast.confidence ? `${currentForecast.confidence}% confident` : undefined}
          />
          <SummaryCard
            title="Days Remaining"
            value={Math.max(
              0,
              Math.ceil((currentForecast.endDate - Date.now()) / (1000 * 60 * 60 * 24))
            ).toString()}
            icon={Clock}
            iconColor="text-amber-500"
          />
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ForecastChart
            data={chartData}
            title={currentForecast?.name || "Forecast Overview"}
            description="Revenue breakdown by forecast category"
            showTarget={!!currentForecast?.targetRevenue}
            showPredicted={!!currentForecast?.predictedRevenue}
          />
        </div>

        <div>
          <PredictionConfidence
            confidence={currentForecast?.confidence || 0}
            factors={currentForecast?.predictionFactors || []}
            lastCalculatedAt={currentForecast?.lastCalculatedAt}
          />
        </div>
      </div>

      {/* Deals Table */}
      {dealsByCategory && (
        <ForecastTable
          deals={tableDeals}
          closedDeals={closedDeals}
          totals={dealsByCategory.totals}
          onDealClick={onDealClick}
        />
      )}

      {/* Historical Accuracy */}
      {historicalAccuracy && historicalAccuracy.forecasts.length > 0 && (
        <ForecastComparison
          data={historicalAccuracy.forecasts}
          aggregates={historicalAccuracy.aggregates}
        />
      )}

      {/* Create Dialog */}
      <CreateForecastDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateForecast}
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  change?: number;
  changeLabel?: string;
  badge?: string;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-muted-foreground",
  change,
  changeLabel,
  badge,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                {change.toFixed(1)}% {changeLabel}
              </p>
            )}
            {badge && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <div className={cn("p-3 rounded-lg bg-muted", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
