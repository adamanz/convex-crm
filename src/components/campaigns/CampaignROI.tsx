"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ComposedChart,
  Line,
  Area,
} from "recharts";

interface CampaignROIProps {
  campaignId: Id<"campaigns">;
}

export function CampaignROI({ campaignId }: CampaignROIProps) {
  const campaign = useQuery(api.campaigns.get, { id: campaignId });
  const roi = useQuery(api.campaigns.getROI, { campaignId });
  const stats = useQuery(api.campaigns.getStats, { campaignId });

  if (campaign === undefined || roi === undefined || stats === undefined) {
    return <CampaignROISkeleton />;
  }

  if (!campaign || !roi) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Campaign data not available</p>
      </div>
    );
  }

  const isPositiveROI = roi.roi >= 0;
  const budgetUtilization = campaign.budget
    ? ((campaign.actualSpend ?? 0) / campaign.budget) * 100
    : 0;

  // Prepare data for revenue vs spend chart
  const revenueSpendData = stats.dailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: stat.revenue ?? 0,
    spend: stat.spend ?? 0,
    profit: (stat.revenue ?? 0) - (stat.spend ?? 0),
  }));

  // Goal progress data
  const goalProgress = [];
  if (campaign.goals) {
    if (campaign.goals.impressions) {
      goalProgress.push({
        name: "Impressions",
        current: stats.impressions,
        target: campaign.goals.impressions,
        percentage: Math.min((stats.impressions / campaign.goals.impressions) * 100, 100),
      });
    }
    if (campaign.goals.clicks) {
      goalProgress.push({
        name: "Clicks",
        current: stats.clicks,
        target: campaign.goals.clicks,
        percentage: Math.min((stats.clicks / campaign.goals.clicks) * 100, 100),
      });
    }
    if (campaign.goals.leads) {
      goalProgress.push({
        name: "Leads",
        current: stats.leads,
        target: campaign.goals.leads,
        percentage: Math.min((stats.leads / campaign.goals.leads) * 100, 100),
      });
    }
    if (campaign.goals.revenue) {
      goalProgress.push({
        name: "Revenue",
        current: campaign.totalRevenue,
        target: campaign.goals.revenue,
        percentage: Math.min((campaign.totalRevenue / campaign.goals.revenue) * 100, 100),
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* ROI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  isPositiveROI ? "text-green-600" : "text-red-600"
                )}
              >
                {isPositiveROI ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(roi.roi).toFixed(1)}% ROI
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {formatCurrency(campaign.totalRevenue, campaign.currency)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <PiggyBank className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {formatCurrency(campaign.actualSpend ?? 0, campaign.currency)}
              </p>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              {campaign.budget && (
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetUtilization.toFixed(0)}% of{" "}
                  {formatCurrency(campaign.budget, campaign.currency)} budget
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isPositiveROI
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                )}
              >
                {isPositiveROI ? (
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <p
                className={cn(
                  "text-2xl font-bold",
                  isPositiveROI ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(roi.profit, campaign.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPositiveROI ? "Net Profit" : "Net Loss"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {formatCurrency(roi.revenuePerMember, campaign.currency)}
              </p>
              <p className="text-sm text-muted-foreground">Revenue per Member</p>
              <p className="text-xs text-muted-foreground mt-1">
                {campaign.memberCount} total members
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Spend Chart */}
      {revenueSpendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Spend Over Time</CardTitle>
            <CardDescription>
              Daily comparison of revenue generated and amount spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueSpendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                  />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) =>
                      typeof value === 'number' ? formatCurrency(value, campaign.currency) : String(value ?? '')
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Progress */}
      {goalProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
            <CardDescription>
              Track progress towards campaign objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goalProgress.map((goal) => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground">
                      {goal.name === "Revenue"
                        ? formatCurrency(goal.current, campaign.currency)
                        : goal.current.toLocaleString()}{" "}
                      /{" "}
                      {goal.name === "Revenue"
                        ? formatCurrency(goal.target, campaign.currency)
                        : goal.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={goal.percentage}
                    className={cn(
                      "h-2",
                      goal.percentage >= 100 && "[&>div]:bg-green-500"
                    )}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {goal.percentage.toFixed(0)}% complete
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Utilization */}
      {campaign.budget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>
              How the campaign budget has been allocated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Budget Used</span>
                <span className="text-sm">
                  {formatCurrency(campaign.actualSpend ?? 0, campaign.currency)}{" "}
                  of {formatCurrency(campaign.budget, campaign.currency)}
                </span>
              </div>
              <Progress
                value={Math.min(budgetUtilization, 100)}
                className={cn(
                  "h-3",
                  budgetUtilization > 100 && "[&>div]:bg-red-500",
                  budgetUtilization > 80 &&
                    budgetUtilization <= 100 &&
                    "[&>div]:bg-yellow-500"
                )}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {budgetUtilization.toFixed(1)}% utilized
                  {budgetUtilization > 100 && " (Over budget!)"}
                </span>
                <span>
                  {formatCurrency(
                    Math.max(0, campaign.budget - (campaign.actualSpend ?? 0)),
                    campaign.currency
                  )}{" "}
                  remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Efficiency Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Efficiency</CardTitle>
          <CardDescription>Key cost metrics for the campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">Cost per Click</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(stats.costPerClick, campaign.currency)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">Cost per Lead</p>
              <p className="text-xl font-semibold mt-1">
                {stats.leads > 0
                  ? formatCurrency(stats.spend / stats.leads, campaign.currency)
                  : "-"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">Cost per Conversion</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(stats.costPerConversion, campaign.currency)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">
                Cost per Acquired Customer
              </p>
              <p className="text-xl font-semibold mt-1">
                {campaign.convertedCount > 0
                  ? formatCurrency(
                      (campaign.actualSpend ?? 0) / campaign.convertedCount,
                      campaign.currency
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignROISkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default CampaignROI;
