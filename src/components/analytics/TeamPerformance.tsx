"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Trophy, Medal } from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  dealsWon: number;
  dealsLost: number;
  revenue: number;
  target?: number;
  activities: number;
  winRate?: number;
}

export interface TeamPerformanceProps {
  data: TeamMember[];
  title?: string;
  description?: string;
  className?: string;
  currency?: string;
  sortBy?: "revenue" | "winRate" | "dealsWon" | "activities";
  showChart?: boolean;
  limit?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TeamMember;
    value: number;
  }>;
  currency: string;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const member = payload[0].payload;
  const winRate = member.dealsWon + member.dealsLost > 0
    ? (member.dealsWon / (member.dealsWon + member.dealsLost)) * 100
    : 0;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm">{member.name}</p>
      <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
        <p>Revenue: {formatCurrency(member.revenue, currency)}</p>
        <p>Deals Won: {formatNumber(member.dealsWon)}</p>
        <p>Win Rate: {winRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-zinc-400" />;
    case 3:
      return <Medal className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-xs text-muted-foreground font-medium">#{rank}</span>;
  }
}

export function TeamPerformance({
  data,
  title = "Team Performance",
  description = "Individual performance metrics",
  className,
  currency = "USD",
  sortBy = "revenue",
  showChart = true,
  limit,
}: TeamPerformanceProps) {
  // Calculate win rates if not provided
  const membersWithWinRate = data.map((member) => ({
    ...member,
    winRate: member.winRate ?? (
      member.dealsWon + member.dealsLost > 0
        ? (member.dealsWon / (member.dealsWon + member.dealsLost)) * 100
        : 0
    ),
  }));

  // Sort by selected metric
  const sortedData = [...membersWithWinRate].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.revenue - a.revenue;
      case "winRate":
        return (b.winRate || 0) - (a.winRate || 0);
      case "dealsWon":
        return b.dealsWon - a.dealsWon;
      case "activities":
        return b.activities - a.activities;
      default:
        return b.revenue - a.revenue;
    }
  });

  const displayData = limit ? sortedData.slice(0, limit) : sortedData;

  // Team totals
  const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
  const totalDealsWon = data.reduce((sum, m) => sum + m.dealsWon, 0);
  const totalDealsLost = data.reduce((sum, m) => sum + m.dealsLost, 0);
  const teamWinRate = totalDealsWon + totalDealsLost > 0
    ? (totalDealsWon / (totalDealsWon + totalDealsLost)) * 100
    : 0;

  // Chart colors based on rank
  const getBarColor = (index: number) => {
    if (index === 0) return "hsl(var(--chart-1))";
    if (index === 1) return "hsl(var(--chart-2))";
    if (index === 2) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-4))";
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</p>
            <p className="text-sm text-muted-foreground">
              Team win rate: {teamWinRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        {showChart && displayData.length > 0 && (
          <div className="h-[200px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      fill="hsl(var(--foreground))"
                      fontSize={12}
                      textAnchor="end"
                    >
                      {payload.value.split(" ")[0]}
                    </text>
                  )}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Team members list */}
        <div className="space-y-3">
          {displayData.map((member, index) => {
            const targetProgress = member.target
              ? Math.min((member.revenue / member.target) * 100, 100)
              : null;
            const isAboveTarget = member.target && member.revenue >= member.target;

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* Avatar */}
                <Avatar>
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="font-semibold">
                      {formatCurrency(member.revenue, currency)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{member.dealsWon} won</span>
                    <span>{member.dealsLost} lost</span>
                    <span
                      className={cn(
                        (member.winRate || 0) >= 50 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {(member.winRate || 0).toFixed(1)}% win rate
                    </span>
                    <span>{formatNumber(member.activities)} activities</span>
                  </div>

                  {/* Target progress */}
                  {member.target && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="text-muted-foreground">Target</span>
                        </div>
                        <span className={cn(
                          "font-medium",
                          isAboveTarget ? "text-green-500" : "text-muted-foreground"
                        )}>
                          {formatCurrency(member.revenue, currency)} / {formatCurrency(member.target, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isAboveTarget ? "bg-green-500" : "bg-primary"
                          )}
                          style={{ width: `${targetProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trend indicator */}
                <div className={cn(
                  "flex items-center justify-center rounded-full p-2",
                  (member.winRate || 0) >= 50 ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  {(member.winRate || 0) >= 50 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Team summary */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Team Members</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Won</p>
            <p className="text-lg font-semibold text-green-500">
              {formatNumber(totalDealsWon)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Lost</p>
            <p className="text-lg font-semibold text-red-500">
              {formatNumber(totalDealsLost)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Revenue</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.length > 0 ? totalRevenue / data.length : 0, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
