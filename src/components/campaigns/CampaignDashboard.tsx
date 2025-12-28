"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Mail,
  Share2,
  Megaphone,
  Gift,
  MoreHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { CampaignMembers } from "./CampaignMembers";
import { CampaignROI } from "./CampaignROI";

const typeIcons = {
  email: Mail,
  social: Share2,
  ads: Megaphone,
  event: Calendar,
  referral: Gift,
  other: MoreHorizontal,
};

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface CampaignDashboardProps {
  campaignId: Id<"campaigns">;
}

export function CampaignDashboard({ campaignId }: CampaignDashboardProps) {
  const campaign = useQuery(api.campaigns.get, { id: campaignId });
  const stats = useQuery(api.campaigns.getStats, { campaignId });
  const roi = useQuery(api.campaigns.getROI, { campaignId });

  if (campaign === undefined || stats === undefined || roi === undefined) {
    return <CampaignDashboardSkeleton />;
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    );
  }

  const TypeIcon = typeIcons[campaign.type];

  // Prepare chart data
  const chartData = stats.dailyStats.map((stat) => ({
    date: format(new Date(stat.date), "MMM d"),
    impressions: stat.impressions ?? 0,
    clicks: stat.clicks ?? 0,
    conversions: stat.conversions ?? 0,
    revenue: stat.revenue ?? 0,
    spend: stat.spend ?? 0,
  }));

  const statusColors = {
    sent: "#3b82f6",
    responded: "#f59e0b",
    converted: "#22c55e",
  };

  const memberBreakdown = [
    { name: "Sent", value: campaign.memberStats.sent, color: statusColors.sent },
    { name: "Responded", value: campaign.memberStats.responded, color: statusColors.responded },
    { name: "Converted", value: campaign.memberStats.converted, color: statusColors.converted },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <TypeIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-muted-foreground">{campaign.description}</p>
            )}
          </div>
        </div>
        <Badge
          className={cn(
            campaign.status === "active" && "bg-green-100 text-green-700",
            campaign.status === "paused" && "bg-yellow-100 text-yellow-700",
            campaign.status === "completed" && "bg-blue-100 text-blue-700",
            campaign.status === "draft" && "bg-zinc-100 text-zinc-700"
          )}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Members"
          value={campaign.memberCount.toString()}
          subtext={`${campaign.memberStats.converted} converted`}
          trend={campaign.memberStats.conversionRate}
          trendLabel="conversion rate"
        />
        <MetricCard
          icon={TrendingUp}
          label="Response Rate"
          value={`${campaign.memberStats.responseRate.toFixed(1)}%`}
          subtext={`${campaign.memberStats.responded} responded`}
        />
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(campaign.totalRevenue, campaign.currency)}
          subtext={`${formatCurrency(roi.revenuePerMember, campaign.currency)} per member`}
        />
        <MetricCard
          icon={Target}
          label="ROI"
          value={`${roi.roi.toFixed(1)}%`}
          subtext={`${formatCurrency(roi.profit, campaign.currency)} profit`}
          trend={roi.roi}
          isPositive={roi.roi >= 0}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roi">ROI Details</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Chart */}
          {chartData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>
                  Daily metrics for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="conversions"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorConversions)"
                        name="Conversions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>No performance data recorded yet.</p>
                  <p className="text-sm">Stats will appear once the campaign starts generating data.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Member Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.memberCount > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memberBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {memberBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No members yet
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  {memberBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aggregate Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatRow label="Total Impressions" value={stats.impressions.toLocaleString()} />
                  <StatRow label="Total Clicks" value={stats.clicks.toLocaleString()} />
                  <StatRow label="Click Rate" value={`${stats.clickRate.toFixed(2)}%`} />
                  <StatRow label="Total Leads" value={stats.leads.toLocaleString()} />
                  <StatRow label="Total Conversions" value={stats.conversions.toLocaleString()} />
                  <StatRow label="Conversion Rate" value={`${stats.conversionRate.toFixed(2)}%`} />
                  <StatRow label="Total Spend" value={formatCurrency(stats.spend, campaign.currency)} />
                  <StatRow label="Cost per Click" value={formatCurrency(stats.costPerClick, campaign.currency)} />
                  <StatRow label="Cost per Conversion" value={formatCurrency(stats.costPerConversion, campaign.currency)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <CampaignMembers campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="roi">
          <CampaignROI campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  trend?: number;
  trendLabel?: string;
  isPositive?: boolean;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendLabel,
  isPositive,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center text-xs font-medium",
                (isPositive ?? trend >= 0)
                  ? "text-green-600"
                  : "text-red-600"
              )}
            >
              {(isPositive ?? trend >= 0) ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend).toFixed(1)}%
              {trendLabel && <span className="ml-1 text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function CampaignDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default CampaignDashboard;
