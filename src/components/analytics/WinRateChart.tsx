"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface WinRateData {
  won: number;
  lost: number;
  pending?: number;
  wonValue?: number;
  lostValue?: number;
  pendingValue?: number;
}

export interface WinRateChartProps {
  data: WinRateData;
  title?: string;
  description?: string;
  className?: string;
  showValue?: boolean;
  showTrend?: boolean;
  previousWinRate?: number;
  currency?: string;
}

const COLORS = {
  won: "#22c55e", // green-500
  lost: "#ef4444", // red-500
  pending: "#f59e0b", // amber-500
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      displayValue?: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm capitalize">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        Count: {formatNumber(data.value)}
      </p>
      {data.displayValue !== undefined && (
        <p className="text-sm text-muted-foreground">
          Value: {formatCurrency(data.displayValue, "USD")}
        </p>
      )}
    </div>
  );
}

export function WinRateChart({
  data,
  title = "Win Rate",
  description = "Won vs lost deals",
  className,
  showValue = true,
  showTrend = true,
  previousWinRate,
  currency = "USD",
}: WinRateChartProps) {
  const totalDeals = data.won + data.lost + (data.pending || 0);
  const closedDeals = data.won + data.lost;
  const winRate = closedDeals > 0 ? (data.won / closedDeals) * 100 : 0;

  const trendChange = previousWinRate !== undefined
    ? winRate - previousWinRate
    : undefined;

  const chartData = [
    {
      name: "Won",
      value: data.won,
      displayValue: data.wonValue,
      fill: COLORS.won,
    },
    {
      name: "Lost",
      value: data.lost,
      displayValue: data.lostValue,
      fill: COLORS.lost,
    },
    ...(data.pending
      ? [{
          name: "Pending",
          value: data.pending,
          displayValue: data.pendingValue,
          fill: COLORS.pending,
        }]
      : []),
  ];

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
            <div className="flex items-center justify-end gap-2">
              <p className="text-3xl font-bold">{winRate.toFixed(1)}%</p>
              {showTrend && trendChange !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  trendChange > 0 && "bg-green-500/10 text-green-500",
                  trendChange < 0 && "bg-red-500/10 text-red-500",
                  trendChange === 0 && "bg-zinc-500/10 text-zinc-500"
                )}>
                  {trendChange > 0 && <TrendingUp className="h-3 w-3" />}
                  {trendChange < 0 && <TrendingDown className="h-3 w-3" />}
                  {trendChange === 0 && <Minus className="h-3 w-3" />}
                  {trendChange > 0 ? "+" : ""}{trendChange.toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(closedDeals)} closed deals
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground capitalize">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">Won</p>
            <p className="text-lg font-semibold text-green-500">
              {formatNumber(data.won)}
            </p>
            {showValue && data.wonValue !== undefined && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.wonValue, currency)}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">Lost</p>
            <p className="text-lg font-semibold text-red-500">
              {formatNumber(data.lost)}
            </p>
            {showValue && data.lostValue !== undefined && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.lostValue, currency)}
              </p>
            )}
          </div>
          {data.pending !== undefined ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-amber-500">
                {formatNumber(data.pending)}
              </p>
              {showValue && data.pendingValue !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.pendingValue, currency)}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{formatNumber(totalDeals)}</p>
              {showValue && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    (data.wonValue || 0) + (data.lostValue || 0),
                    currency
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
