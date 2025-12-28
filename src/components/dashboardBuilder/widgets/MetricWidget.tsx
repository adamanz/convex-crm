"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetricWidgetProps {
  data: {
    value: number;
    change?: number;
  };
  config: Record<string, unknown>;
}

export function MetricWidget({ data, config }: MetricWidgetProps) {
  const { value, change } = data;
  const { metricType, metricField, color = "#3b82f6" } = config;

  // Format the value based on type
  const formatValue = () => {
    if (metricField === "amount" || metricType === "currency") {
      return formatCurrency(value);
    }
    if (typeof value === "number") {
      if (metricType === "percentage") {
        return `${value.toFixed(1)}%`;
      }
      return formatNumber(value);
    }
    return String(value);
  };

  // Determine trend
  const trend = change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : null;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div
        className="text-4xl font-bold tabular-nums"
        style={{ color: typeof color === "string" ? color : undefined }}
      >
        {formatValue()}
      </div>

      {change !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-sm font-medium",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-zinc-500"
          )}
        >
          {trend === "up" && <TrendingUp className="h-4 w-4" />}
          {trend === "down" && <TrendingDown className="h-4 w-4" />}
          {trend === "neutral" && <Minus className="h-4 w-4" />}
          <span>
            {trend === "up" && "+"}
            {change.toFixed(1)}%
          </span>
          <span className="text-zinc-400 font-normal">vs previous period</span>
        </div>
      )}
    </div>
  );
}
