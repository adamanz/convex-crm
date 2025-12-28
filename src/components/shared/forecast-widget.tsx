"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Brain,
  Clock,
} from "lucide-react";
import Link from "next/link";

export interface ForecastWidgetProps {
  className?: string;
}

function ProgressBar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={cn("h-2 w-full bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full transition-all duration-500 rounded-full",
          percentage >= 100
            ? "bg-green-500"
            : percentage >= 75
            ? "bg-blue-500"
            : percentage >= 50
            ? "bg-amber-500"
            : "bg-red-500"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function PaceIndicator({ status }: { status: string }) {
  const config = {
    ahead: {
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      label: "Ahead of pace",
    },
    on_track: {
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      label: "On track",
    },
    behind: {
      icon: TrendingDown,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      label: "Behind pace",
    },
    at_risk: {
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      label: "At risk",
    },
  }[status] || {
    icon: Target,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "Unknown",
  };

  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.bgColor, config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

export function ForecastWidget({ className }: ForecastWidgetProps) {
  const summary = useQuery(api.forecasting.getForecastSummary, {});

  // Loading state
  if (summary === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Forecast
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No forecast
  if (!summary) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No active forecast
            </p>
            <Link href="/forecasting">
              <Button size="sm" variant="outline">
                Create Forecast
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { forecast, progress, daysRemaining, paceStatus } = summary;
  const closed = forecast.closed || 0;
  const target = forecast.targetRevenue || 0;
  const predicted = forecast.predictedRevenue || 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            {forecast.name}
          </CardTitle>
          <Link href="/forecasting">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress toward target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">
              {formatCurrency(closed)}
            </span>
            {target > 0 && (
              <span className="text-sm text-muted-foreground">
                of {formatCurrency(target)}
              </span>
            )}
          </div>

          {target > 0 && (
            <>
              <ProgressBar value={closed} max={target} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">
                  {progress.toFixed(0)}% to target
                </span>
                <PaceIndicator status={paceStatus} />
              </div>
            </>
          )}
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Brain className="h-3 w-3" />
              AI Predicted
            </div>
            <p className="font-semibold">{formatCurrency(predicted)}</p>
            {forecast.confidence && (
              <Badge variant="secondary" className="text-xs mt-1">
                {forecast.confidence}% confident
              </Badge>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Days Left
            </div>
            <p className="font-semibold">{daysRemaining}</p>
            <span className="text-xs text-muted-foreground">
              in period
            </span>
          </div>
        </div>

        {/* Pipeline breakdown */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Closed</span>
              <span className="font-medium">{formatCurrency(closed)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Committed</span>
              <span className="font-medium">{formatCurrency(forecast.committed || 0)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Best Case</span>
              <span className="font-medium">{formatCurrency(forecast.bestCase || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pipeline</span>
              <span className="font-medium">{formatCurrency(forecast.pipeline || 0)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
