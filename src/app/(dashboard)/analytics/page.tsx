"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import {
  TrendingUp,
  DollarSign,
  Target,
  Activity,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeSelector, DateRange } from "@/components/analytics/DateRangeSelector";
import { RevenueChart, RevenueDataPoint } from "@/components/analytics/RevenueChart";
import { PipelineChart } from "@/components/analytics/PipelineChart";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { WinRateChart } from "@/components/analytics/WinRateChart";
import { TeamPerformance } from "@/components/analytics/TeamPerformance";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
}

function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
  trend = "neutral",
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" && (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                )}
                {trend === "down" && (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  // Default date range: Last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // Calculate timestamps
  const startDate = dateRange.from ? startOfDay(dateRange.from).getTime() : subDays(new Date(), 29).getTime();
  const endDate = dateRange.to ? endOfDay(dateRange.to).getTime() : new Date().getTime();

  // Calculate previous period for comparison
  const daysDiff = dateRange.from && dateRange.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const previousStartDate = dateRange.from ? subDays(dateRange.from, daysDiff).getTime() : undefined;
  const previousEndDate = dateRange.from ? subDays(dateRange.from, 1).getTime() : undefined;

  // Fetch analytics data
  const analytics = useQuery(api.analytics.getAnalytics, {
    startDate,
    endDate,
  });

  const revenueData = useQuery(api.analytics.getRevenueOverTime, {
    startDate,
    endDate,
    groupBy: daysDiff <= 31 ? "day" : daysDiff <= 90 ? "week" : "month",
  });

  const activityData = useQuery(api.analytics.getActivityAnalytics, {
    startDate,
    endDate,
  });

  const winRateData = useQuery(api.analytics.getWinRateAnalytics, {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  });

  const teamPerformanceData = useQuery(api.analytics.getTeamPerformance, {
    startDate,
    endDate,
  });

  const conversionData = useQuery(api.analytics.getConversionFunnel, {
    startDate,
    endDate,
  });

  // Get default pipeline for pipeline chart
  const pipelines = useQuery(api.pipelines.list, {});
  const defaultPipeline = pipelines?.find((p) => p.isDefault);

  const pipelineData = useQuery(
    api.analytics.getPipelineAnalytics,
    defaultPipeline
      ? {
          pipelineId: defaultPipeline._id,
          startDate,
          endDate,
        }
      : "skip"
  );

  // Loading state
  if (
    analytics === undefined ||
    revenueData === undefined ||
    activityData === undefined ||
    winRateData === undefined ||
    teamPerformanceData === undefined ||
    conversionData === undefined
  ) {
    return <AnalyticsSkeleton />;
  }

  const { kpis } = analytics;

  // Transform revenue data for chart
  const revenueChartData: RevenueDataPoint[] = revenueData.map((item) => ({
    date: item.date,
    revenue: item.revenue,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your sales performance
          </p>
        </div>
        <DateRangeSelector
          value={dateRange}
          onChange={(range) => range && setDateRange(range)}
          className="w-auto"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue, "USD")}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/20"
        />
        <KpiCard
          title="Win Rate"
          value={`${kpis.winRate.toFixed(1)}%`}
          icon={Target}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/20"
        />
        <KpiCard
          title="Pipeline Value"
          value={formatCurrency(kpis.pipelineValue, "USD")}
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/20"
        />
        <KpiCard
          title="Total Activities"
          value={formatNumber(kpis.totalActivities)}
          icon={Activity}
          iconColor="text-orange-600"
          iconBg="bg-orange-100 dark:bg-orange-900/20"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue and Win Rate Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart
              data={revenueChartData}
              title="Revenue Trend"
              description="Revenue over selected period"
              currency="USD"
              variant="area"
            />
            <WinRateChart
              data={winRateData}
              title="Win Rate Analysis"
              description="Deal outcomes breakdown"
              showValue
              showTrend
              previousWinRate={winRateData.previousWinRate}
              currency="USD"
            />
          </div>

          {/* Pipeline and Activity Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {pipelineData && pipelineData.length > 0 && (
              <PipelineChart
                data={pipelineData}
                title="Pipeline Distribution"
                description="Deals by stage"
                currency="USD"
              />
            )}
            {activityData && activityData.length > 0 && (
              <ActivityChart
                data={activityData}
                title="Activity Breakdown"
                description="Activities by type"
                orientation="vertical"
                showIcons
              />
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis.avgDealSize, "USD")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {kpis.wonDeals} won deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Deals Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(kpis.closedDeals)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.wonDeals} won, {kpis.lostDeals} lost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(kpis.openDeals)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(kpis.pipelineValue, "USD")} in pipeline
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <RevenueChart
            data={revenueChartData}
            title="Revenue Over Time"
            description="Detailed revenue analysis"
            currency="USD"
            variant="area"
            className="h-[500px]"
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis.totalRevenue, "USD")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Deal Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis.avgDealSize, "USD")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(kpis.wonDeals)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis.pipelineValue, "USD")}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          {pipelineData && pipelineData.length > 0 ? (
            <>
              <PipelineChart
                data={pipelineData}
                title="Pipeline Funnel"
                description="Deal progression through stages"
                currency="USD"
                className="h-[500px]"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        pipelineData.reduce((sum, stage) => sum + stage.value, 0),
                        "USD"
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(
                        pipelineData.reduce((sum, stage) => sum + stage.count, 0)
                      )}{" "}
                      open deals
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pipelineData.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active stages</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.winRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Overall conversion rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No pipeline data available for the selected period
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6">
          {teamPerformanceData && teamPerformanceData.length > 0 ? (
            <TeamPerformance
              data={teamPerformanceData}
              title="Team Performance"
              description="Individual sales performance metrics"
              currency="USD"
              sortBy="revenue"
              showChart
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No team performance data available for the selected period
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Contact to deal to win journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionData.stages.map((stage, index) => (
                    <div key={stage.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stage.name}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(stage.count)} ({stage.conversionRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${stage.conversionRate}%`,
                          }}
                        />
                      </div>
                      {index < conversionData.stages.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Conversion</span>
                    <span className="text-lg font-bold text-primary">
                      {conversionData.overallConversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Metrics */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Contact to Deal Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {kpis.contactToDealsRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(kpis.totalDeals)} deals from {formatNumber(kpis.totalContacts)}{" "}
                    contacts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Deal to Won Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {kpis.dealToWonRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(kpis.wonDeals)} won from {formatNumber(kpis.totalDeals)} deals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.winRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(kpis.wonDeals)} won, {formatNumber(kpis.lostDeals)} lost
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Activity Breakdown */}
          {activityData && activityData.length > 0 && (
            <ActivityChart
              data={activityData}
              title="Activity Distribution"
              description="Sales activities breakdown"
              orientation="horizontal"
              showIcons
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
