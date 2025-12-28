"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  target?: number;
  previousPeriod?: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  description?: string;
  className?: string;
  currency?: string;
  showTarget?: boolean;
  showPreviousPeriod?: boolean;
  variant?: "line" | "area";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  currency: string;
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">
            {entry.dataKey === "previousPeriod" ? "Previous" : entry.dataKey}:
          </span>
          <span className="font-medium">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  title = "Revenue Trend",
  description = "Revenue over time",
  className,
  currency = "USD",
  showTarget = false,
  showPreviousPeriod = false,
  variant = "area",
}: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);
  const latestRevenue = data[data.length - 1]?.revenue || 0;
  const previousRevenue = data[data.length - 2]?.revenue || 0;
  const growthRate = previousRevenue > 0
    ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const ChartComponent = variant === "area" ? AreaChart : LineChart;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(latestRevenue, currency)}</p>
            <p className={cn(
              "text-sm",
              growthRate >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}% vs previous
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground capitalize">
                    {value === "previousPeriod" ? "Previous Period" : value}
                  </span>
                )}
              />
              {showPreviousPeriod && (
                variant === "area" ? (
                  <Area
                    type="monotone"
                    dataKey="previousPeriod"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    fill="transparent"
                    dot={false}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="previousPeriod"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )
              )}
              {showTarget && (
                variant === "area" ? (
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#targetGradient)"
                    dot={false}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                )
              )}
              {variant === "area" ? (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(totalRevenue, currency)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.length > 0 ? totalRevenue / data.length : 0, currency)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Peak</p>
            <p className="text-lg font-semibold">
              {formatCurrency(Math.max(...data.map(d => d.revenue)), currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
