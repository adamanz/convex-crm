"use client";

import { formatCurrency } from "@/lib/utils";

interface FunnelWidgetProps {
  data: {
    stages: Array<{
      name: string;
      value: number;
      amount: number;
      color: string;
    }>;
  };
  config: Record<string, unknown>;
}

export function FunnelWidget({ data, config }: FunnelWidgetProps) {
  const { stages } = data;

  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
        No pipeline data available
      </div>
    );
  }

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col justify-center h-full space-y-2 px-2">
      {stages.map((stage, index) => {
        // Calculate width as percentage of max, with minimum width
        const widthPercent = Math.max((stage.value / maxValue) * 100, 20);

        return (
          <div key={index} className="flex items-center gap-3">
            {/* Stage bar */}
            <div
              className="relative h-10 rounded-md flex items-center justify-between px-3 transition-all duration-300"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: stage.color || "#3b82f6",
                minWidth: "120px",
              }}
            >
              <span className="text-xs font-medium text-white truncate">
                {stage.name}
              </span>
              <span className="text-xs font-bold text-white">
                {stage.value}
              </span>
            </div>

            {/* Value and amount */}
            <div className="flex-shrink-0 text-right min-w-[80px]">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(stage.amount)}
              </p>
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Deals
          </span>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {stages.reduce((sum, s) => sum + s.value, 0)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Value
          </span>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(stages.reduce((sum, s) => sum + s.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
