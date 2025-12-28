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
  Legend,
  Cell,
  ComposedChart,
  Line,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

export interface ForecastChartData {
  label: string;
  committed: number;
  bestCase: number;
  pipeline: number;
  closed: number;
  target?: number;
  predicted?: number;
}

export interface ForecastChartProps {
  data: ForecastChartData[];
  title?: string;
  description?: string;
  className?: string;
  currency?: string;
  showTarget?: boolean;
  showPredicted?: boolean;
  variant?: "stacked" | "grouped" | "waterfall";
}

const COLORS = {
  closed: "#22c55e", // green
  committed: "#3b82f6", // blue
  bestCase: "#8b5cf6", // purple
  pipeline: "#f59e0b", // amber
  target: "#ef4444", // red (line)
  predicted: "#06b6d4", // cyan (line)
};

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

  const labelMap: Record<string, string> = {
    closed: "Closed Won",
    committed: "Committed",
    bestCase: "Best Case",
    pipeline: "Pipeline",
    target: "Target",
    predicted: "AI Predicted",
  };

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {labelMap[entry.dataKey] || entry.dataKey}:
            </span>
          </div>
          <span className="font-medium">
            {formatCurrency(entry.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ForecastChart({
  data,
  title = "Forecast Overview",
  description = "Revenue by forecast category",
  className,
  currency = "USD",
  showTarget = true,
  showPredicted = true,
  variant = "stacked",
}: ForecastChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  // Calculate totals for summary
  const latestData = data[data.length - 1];
  const totalPipeline = latestData
    ? latestData.closed + latestData.committed + latestData.bestCase + latestData.pipeline
    : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalPipeline, currency)}</p>
            <p className="text-sm text-muted-foreground">Total Pipeline</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
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
                formatter={(value) => {
                  const labelMap: Record<string, string> = {
                    closed: "Closed Won",
                    committed: "Committed",
                    bestCase: "Best Case",
                    pipeline: "Pipeline",
                    target: "Target",
                    predicted: "AI Predicted",
                  };
                  return (
                    <span className="text-sm text-muted-foreground">
                      {labelMap[value] || value}
                    </span>
                  );
                }}
              />

              {/* Stacked bars */}
              <Bar
                dataKey="closed"
                stackId="a"
                fill={COLORS.closed}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="committed"
                stackId="a"
                fill={COLORS.committed}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="bestCase"
                stackId="a"
                fill={COLORS.bestCase}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="pipeline"
                stackId="a"
                fill={COLORS.pipeline}
                radius={[4, 4, 0, 0]}
              />

              {/* Target line */}
              {showTarget && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={COLORS.target}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {/* Predicted line */}
              {showPredicted && (
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke={COLORS.predicted}
                  strokeWidth={2}
                  dot={{ fill: COLORS.predicted, strokeWidth: 0, r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with values */}
        {latestData && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.closed }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Closed Won</p>
                <p className="font-semibold">{formatCurrency(latestData.closed, currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.committed }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Committed</p>
                <p className="font-semibold">{formatCurrency(latestData.committed, currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.bestCase }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Best Case</p>
                <p className="font-semibold">{formatCurrency(latestData.bestCase, currency)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.pipeline }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Pipeline</p>
                <p className="font-semibold">{formatCurrency(latestData.pipeline, currency)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
