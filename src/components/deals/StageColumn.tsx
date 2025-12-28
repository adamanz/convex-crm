"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn, formatCurrency } from "@/lib/utils";

interface StageColumnProps {
  id: string;
  name: string;
  color: string;
  count: number;
  totalValue: number;
  children: React.ReactNode;
}

export function StageColumn({
  id,
  name,
  color,
  count,
  totalValue,
  children,
}: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 flex-shrink-0 flex-col rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Stage Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200/50 px-4 py-3 dark:border-zinc-800/50">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {name}
            </h3>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-200 px-1.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {count}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {children}
        {count === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Drop deals here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
