"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  count: number;
  value: number;
}

interface PipelineChartProps {
  pipeline: {
    id: string;
    name: string;
  } | null;
  stages: PipelineStage[];
  className?: string;
}

export function PipelineChart({
  pipeline,
  stages,
  className,
}: PipelineChartProps) {
  // Calculate total value and max count for scaling
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = stages.reduce((sum, stage) => sum + stage.count, 0);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  if (!pipeline || stages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Pipeline Overview
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No pipeline data available
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Create deals to see your pipeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Pipeline Overview
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {pipeline.name}
          </span>
        </div>
        <Link
          href="/deals"
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          View all deals
        </Link>
      </div>

      <div className="p-4">
        {/* Summary Stats */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Total pipeline value
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">{totalDeals} deals</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3">
          {stages.map((stage) => {
            const widthPercent = (stage.count / maxCount) * 100;
            const valuePercent = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;

            return (
              <div key={stage.id} className="group">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {stage.name}
                  </span>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <span>{stage.count} deals</span>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <span>{formatCurrency(stage.value)}</span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {stage.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
