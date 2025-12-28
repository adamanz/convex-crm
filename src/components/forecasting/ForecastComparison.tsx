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
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Brain } from "lucide-react";

export interface AccuracyData {
  forecastId: string;
  name: string;
  period: string;
  startDate: number;
  endDate: number;
  predicted: number;
  actual: number;
  target: number;
  predictionAccuracy: number;
  targetAttainment: number;
  variance: number;
  variancePercentage: number;
}

export interface ForecastComparisonProps {
  data: AccuracyData[];
  aggregates?: {
    averageAccuracy: number;
    averageAttainment: number;
    totalForecasts: number;
  };
  className?: string;
  currency?: string;
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
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">
              {entry.dataKey === "predicted" ? "AI Predicted" : entry.dataKey}:
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

export function ForecastComparison({
  data,
  aggregates,
  className,
  currency = "USD",
}: ForecastComparisonProps) {
  // Prepare chart data
  const chartData = data.map((item) => ({
    name: item.name,
    predicted: item.predicted,
    actual: item.actual,
    target: item.target,
    accuracy: item.predictionAccuracy,
  }));

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  // Calculate trend
  const recentData = data.slice(-3);
  const avgRecentAccuracy = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.predictionAccuracy, 0) / recentData.length
    : 0;
  const olderData = data.slice(0, -3);
  const avgOlderAccuracy = olderData.length > 0
    ? olderData.reduce((sum, d) => sum + d.predictionAccuracy, 0) / olderData.length
    : avgRecentAccuracy;
  const accuracyTrend = avgRecentAccuracy - avgOlderAccuracy;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Forecast Accuracy</CardTitle>
            <CardDescription>
              Comparing predictions to actual results
            </CardDescription>
          </div>
          {aggregates && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm text-muted-foreground">Avg Accuracy</span>
                </div>
                <p className="text-xl font-bold">
                  {aggregates.averageAccuracy.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Avg Attainment</span>
                </div>
                <p className="text-xl font-bold">
                  {aggregates.averageAttainment.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend indicator */}
        {data.length >= 3 && (
          <div className="mb-4 flex items-center gap-2">
            {accuracyTrend > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">
                  Accuracy improving (+{accuracyTrend.toFixed(1)}% vs earlier periods)
                </span>
              </>
            ) : accuracyTrend < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">
                  Accuracy declining ({accuracyTrend.toFixed(1)}% vs earlier periods)
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Accuracy stable
              </span>
            )}
          </div>
        )}

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
                angle={-15}
                textAnchor="end"
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
                    {value === "predicted" ? "AI Predicted" : value}
                  </span>
                )}
              />

              <Line
                type="monotone"
                dataKey="target"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: "#06b6d4", strokeWidth: 0, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison table */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm">Period Details</h4>
          <div className="rounded-lg border">
            <div className="grid grid-cols-6 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
              <div>Period</div>
              <div className="text-right">Target</div>
              <div className="text-right">Predicted</div>
              <div className="text-right">Actual</div>
              <div className="text-center">Accuracy</div>
              <div className="text-center">Attainment</div>
            </div>
            {data.map((item) => (
              <div
                key={item.forecastId}
                className="grid grid-cols-6 gap-2 p-3 border-t text-sm"
              >
                <div className="font-medium truncate">{item.name}</div>
                <div className="text-right text-muted-foreground">
                  {formatCurrency(item.target, currency)}
                </div>
                <div className="text-right">
                  {formatCurrency(item.predicted, currency)}
                </div>
                <div className="text-right font-medium">
                  {formatCurrency(item.actual, currency)}
                </div>
                <div className="text-center">
                  <Badge
                    variant={item.predictionAccuracy >= 80 ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      item.predictionAccuracy >= 90 && "bg-green-100 text-green-800",
                      item.predictionAccuracy >= 80 && item.predictionAccuracy < 90 && "bg-blue-100 text-blue-800",
                      item.predictionAccuracy < 80 && "bg-amber-100 text-amber-800"
                    )}
                  >
                    {item.predictionAccuracy.toFixed(0)}%
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      item.targetAttainment >= 100 && "border-green-300 text-green-600",
                      item.targetAttainment >= 80 && item.targetAttainment < 100 && "border-blue-300 text-blue-600",
                      item.targetAttainment < 80 && "border-red-300 text-red-600"
                    )}
                  >
                    {item.targetAttainment.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
