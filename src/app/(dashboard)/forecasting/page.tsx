"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { format } from "date-fns";
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  BarChart3,
  Users,
  Award,
} from "lucide-react";
import { ForecastDashboard } from "@/components/forecasting";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sublabel?: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "success" | "warning";
  };
  trend?: {
    value: number;
    label: string;
  };
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sublabel, badge, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>
          )}
          {badge && (
            <Badge variant={badge.variant} className="mt-2 text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.value >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 text-red-500 rotate-180" />
          )}
          <span className={cn(
            "text-[12px] font-medium",
            trend.value >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}%
          </span>
          <span className="text-[12px] text-zinc-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

interface PipelineBreakdownProps {
  committed: number;
  bestCase: number;
  pipeline: number;
  closed: number;
  target?: number;
}

function PipelineBreakdown({ committed, bestCase, pipeline, closed, target }: PipelineBreakdownProps) {
  const total = committed + bestCase + pipeline + closed;
  const committedPercent = total > 0 ? (committed / total) * 100 : 0;
  const bestCasePercent = total > 0 ? (bestCase / total) * 100 : 0;
  const pipelinePercent = total > 0 ? (pipeline / total) * 100 : 0;
  const closedPercent = total > 0 ? (closed / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pipeline Breakdown
        </CardTitle>
        <CardDescription>Revenue distribution by forecast category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual breakdown */}
        <div className="h-4 w-full flex rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {closedPercent > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${closedPercent}%` }}
              title={`Closed: ${formatCurrency(closed)}`}
            />
          )}
          {committedPercent > 0 && (
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${committedPercent}%` }}
              title={`Committed: ${formatCurrency(committed)}`}
            />
          )}
          {bestCasePercent > 0 && (
            <div
              className="bg-violet-500 transition-all"
              style={{ width: `${bestCasePercent}%` }}
              title={`Best Case: ${formatCurrency(bestCase)}`}
            />
          )}
          {pipelinePercent > 0 && (
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${pipelinePercent}%` }}
              title={`Pipeline: ${formatCurrency(pipeline)}`}
            />
          )}
        </div>

        {/* Category details */}
        <div className="space-y-3">
          <CategoryItem
            color="bg-emerald-500"
            label="Closed Won"
            value={closed}
            percent={closedPercent}
          />
          <CategoryItem
            color="bg-blue-500"
            label="Committed (90%+)"
            value={committed}
            percent={committedPercent}
          />
          <CategoryItem
            color="bg-violet-500"
            label="Best Case (70-89%)"
            value={bestCase}
            percent={bestCasePercent}
          />
          <CategoryItem
            color="bg-amber-500"
            label="Pipeline (20-69%)"
            value={pipeline}
            percent={pipelinePercent}
          />
        </div>

        {/* Total and target */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total Pipeline</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {target && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>Progress to Target</span>
                <span>{((closed / target) * 100).toFixed(0)}%</span>
              </div>
              <Progress
                value={(closed / target) * 100}
                variant={
                  (closed / target) * 100 >= 100 ? "success" :
                  (closed / target) * 100 >= 75 ? "default" :
                  (closed / target) * 100 >= 50 ? "warning" : "error"
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryItemProps {
  color: string;
  label: string;
  value: number;
  percent: number;
}

function CategoryItem({ color, label, value, percent }: CategoryItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{formatCurrency(value)}</span>
        <span className="text-xs text-zinc-400 min-w-[3ch] text-right">
          {percent > 0 ? percent.toFixed(0) : 0}%
        </span>
      </div>
    </div>
  );
}

interface PeriodSelectorProps {
  value: "monthly" | "quarterly" | "yearly";
  onChange: (value: "monthly" | "quarterly" | "yearly") => void;
}

function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="quarterly">Quarterly</SelectItem>
        <SelectItem value="yearly">Yearly</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ForecastingPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "quarterly" | "yearly">("quarterly");

  // Fetch active forecasts summary
  const forecastSummary = useQuery(api.forecasting.getForecastSummary);
  const forecasts = useQuery(api.forecasting.listForecasts, {
    isActive: true,
    period: selectedPeriod,
    limit: 5
  });

  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  // Loading state
  if (forecastSummary === undefined || forecasts === undefined) {
    return <PageSkeleton />;
  }

  const currentForecast = forecastSummary?.forecast;
  const closed = currentForecast?.closed || 0;
  const target = currentForecast?.targetRevenue || 0;
  const predicted = currentForecast?.predictedRevenue || 0;
  const committed = currentForecast?.committed || 0;
  const bestCase = currentForecast?.bestCase || 0;
  const pipeline = currentForecast?.pipeline || 0;

  const progressPercent = target > 0 ? (closed / target) * 100 : 0;
  const predictedPercent = target > 0 ? (predicted / target) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Revenue Forecasting
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            {currentForecast ? (
              <>
                {format(new Date(currentForecast.startDate), "MMM d, yyyy")} - {format(new Date(currentForecast.endDate), "MMM d, yyyy")}
              </>
            ) : (
              "No active forecast"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>
      </div>

      {/* Key Metrics */}
      {currentForecast ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            label="Closed Won"
            value={formatCurrency(closed)}
            sublabel={target > 0 ? `${progressPercent.toFixed(0)}% of target` : undefined}
            trend={
              forecastSummary?.previousForecast?.closed
                ? {
                    value: ((closed - forecastSummary.previousForecast.closed) / forecastSummary.previousForecast.closed) * 100,
                    label: "vs last period"
                  }
                : undefined
            }
          />

          <StatCard
            icon={Target}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-500/10"
            label="Target Revenue"
            value={formatCurrency(target)}
            sublabel={forecastSummary ? `${forecastSummary.daysRemaining} days remaining` : undefined}
            badge={forecastSummary?.paceStatus ? {
              text: forecastSummary.paceStatus === "ahead" ? "Ahead of Pace" :
                    forecastSummary.paceStatus === "on_track" ? "On Track" :
                    forecastSummary.paceStatus === "behind" ? "Behind Pace" : "At Risk",
              variant: forecastSummary.paceStatus === "ahead" ? "success" :
                       forecastSummary.paceStatus === "on_track" ? "default" :
                       forecastSummary.paceStatus === "behind" ? "warning" : "secondary"
            } : undefined}
          />

          <StatCard
            icon={TrendingUp}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-500/10"
            label="AI Predicted"
            value={formatCurrency(predicted)}
            sublabel={target > 0 ? `${predictedPercent.toFixed(0)}% of target` : undefined}
            badge={currentForecast.confidence ? {
              text: `${currentForecast.confidence}% confidence`,
              variant: "secondary"
            } : undefined}
          />

          <StatCard
            icon={BarChart3}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
            label="Total Pipeline"
            value={formatCurrency(committed + bestCase + pipeline)}
            sublabel={`${(forecasts?.length || 0)} active forecasts`}
          />
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No Active Forecast</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Create a forecast to start tracking revenue predictions
          </p>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Forecasts</TabsTrigger>
          <TabsTrigger value="history">Historical Accuracy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Pipeline Breakdown + Quick Stats */}
          {currentForecast && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ForecastDashboard onDealClick={handleDealClick} />
              </div>
              <div>
                <PipelineBreakdown
                  committed={committed}
                  bestCase={bestCase}
                  pipeline={pipeline}
                  closed={closed}
                  target={target}
                />
              </div>
            </div>
          )}

          {!currentForecast && (
            <div className="text-center py-12">
              <p className="text-zinc-500">Select or create a forecast to view details</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          {/* Full forecast dashboard with deal breakdown */}
          <ForecastDashboard onDealClick={handleDealClick} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team/Rep forecasts placeholder */}
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Team Forecasts</h3>
            <p className="text-sm text-zinc-500 mb-4">
              View revenue forecasts broken down by sales rep and team
            </p>
            <Badge variant="secondary">Coming Soon</Badge>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Historical accuracy placeholder */}
          <Card className="p-12 text-center">
            <Award className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Historical Accuracy</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Compare forecast predictions to actual results over time
            </p>
            <Badge variant="secondary">Coming Soon</Badge>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Forecasts List */}
      {forecasts && forecasts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Forecasts</CardTitle>
              <Badge variant="secondary">{selectedPeriod}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecasts.map((forecast) => (
                <div
                  key={forecast._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/forecasting?id=${forecast._id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{forecast.name}</p>
                      {forecast.isActive && (
                        <Badge variant="success" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {format(new Date(forecast.startDate), "MMM d")} - {format(new Date(forecast.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(forecast.predictedRevenue || 0)}</p>
                      <p className="text-xs text-zinc-500">predicted</p>
                    </div>
                    {forecast.targetRevenue && (
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(forecast.closed || 0)}</p>
                        <p className="text-xs text-zinc-500">
                          {((forecast.closed || 0) / forecast.targetRevenue * 100).toFixed(0)}% of target
                        </p>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
