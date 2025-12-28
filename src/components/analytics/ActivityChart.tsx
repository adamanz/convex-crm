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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Video,
  FileText,
  LucideIcon,
} from "lucide-react";

export interface ActivityData {
  type: string;
  count: number;
  fill?: string;
}

export interface ActivityChartProps {
  data: ActivityData[];
  title?: string;
  description?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
  showIcons?: boolean;
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  message: MessageSquare,
  video: Video,
  note: FileText,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ActivityData;
    value: number;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="font-medium text-sm capitalize">{data.type}</p>
      <p className="text-sm text-muted-foreground">
        Count: {formatNumber(data.count)}
      </p>
    </div>
  );
}

export function ActivityChart({
  data,
  title = "Activity Breakdown",
  description = "Activities by type",
  className,
  orientation = "vertical",
  showIcons = true,
}: ActivityChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const totalActivities = data.reduce((sum, activity) => sum + activity.count, 0);
  const topActivity = data.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  , data[0]);

  const isHorizontal = orientation === "horizontal";

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatNumber(totalActivities)}</p>
            <p className="text-sm text-muted-foreground">total activities</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout={isHorizontal ? "vertical" : "horizontal"}
              margin={isHorizontal ? { left: 80 } : undefined}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                horizontal={!isHorizontal}
                vertical={isHorizontal}
              />
              {isHorizontal ? (
                <>
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="type"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                </>
              )}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
              />
              <Bar
                dataKey="count"
                radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                maxBarSize={50}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity breakdown with icons */}
        {showIcons && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chartData.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type.toLowerCase()] || MessageSquare;
              const percentage = totalActivities > 0
                ? ((activity.count / totalActivities) * 100).toFixed(1)
                : "0";

              return (
                <div
                  key={activity.type}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${activity.fill}20` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: activity.fill }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {activity.type}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(activity.count)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top activity highlight */}
        {topActivity && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              Most common activity:{" "}
              <span className="font-medium text-foreground capitalize">
                {topActivity.type}
              </span>{" "}
              with {formatNumber(topActivity.count)} occurrences (
              {((topActivity.count / totalActivities) * 100).toFixed(1)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
