"use client";

import * as React from "react";
import {
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export interface PipelineStage {
  name: string;
  value: number;
  count: number;
  fill?: string;
}

export interface PipelineChartProps {
  data: PipelineStage[];
  title?: string;
  description?: string;
  className?: string;
  currency?: string;
  showValue?: boolean;
  showCount?: boolean;
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PipelineStage;
  }>;
  currency: string;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        Value: {formatCurrency(data.value, currency)}
      </p>
      <p className="text-sm text-muted-foreground">
        Deals: {formatNumber(data.count)}
      </p>
    </div>
  );
}

export function PipelineChart({
  data,
  title = "Pipeline Funnel",
  description = "Deal value by pipeline stage",
  className,
  currency = "USD",
  showValue = true,
  showCount = true,
}: PipelineChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const totalValue = data.reduce((sum, stage) => sum + stage.value, 0);
  const totalCount = data.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            {showValue && (
              <p className="text-2xl font-bold">{formatCurrency(totalValue, currency)}</p>
            )}
            {showCount && (
              <p className="text-sm text-muted-foreground">{totalCount} deals</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                content={<CustomTooltip currency={currency} />}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
              />
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive
                animationDuration={500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  position="right"
                  dataKey="name"
                  fill="hsl(var(--foreground))"
                  stroke="none"
                  className="text-sm"
                />
                <LabelList
                  position="center"
                  fill="hsl(var(--primary-foreground))"
                  stroke="none"
                  className="text-xs font-medium"
                  formatter={(value) => typeof value === 'number' ? formatCurrency(value, currency) : String(value ?? '')}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Stage breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {chartData.map((stage, index) => (
            <div
              key={stage.name}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: stage.fill }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{stage.name}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.count} deals
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
