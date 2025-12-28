"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { MetricWidget } from "./widgets/MetricWidget";
import { ChartWidget } from "./widgets/ChartWidget";
import { ListWidget } from "./widgets/ListWidget";
import { TableWidget } from "./widgets/TableWidget";
import { FunnelWidget } from "./widgets/FunnelWidget";
import { LeaderboardWidget } from "./widgets/LeaderboardWidget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, X, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Widget {
  _id: Id<"dashboardWidgets">;
  type: "metric" | "chart" | "list" | "table" | "funnel" | "leaderboard";
  title: string;
  description?: string;
  config: Record<string, unknown>;
  refreshInterval?: number;
  order?: number;
}

interface WidgetCardProps {
  widget: Widget;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function WidgetCard({
  widget,
  isEditing,
  isSelected,
  onSelect,
  onRemove,
}: WidgetCardProps) {
  // Fetch widget data
  const widgetData = useQuery(api.dashboards.getWidgetData, { widgetId: widget._id });

  // Render the appropriate widget type
  const renderWidgetContent = () => {
    if (widgetData === undefined) {
      return <WidgetSkeleton type={widget.type} />;
    }

    if (widgetData === null) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-zinc-500">
          No data available
        </div>
      );
    }

    switch (widget.type) {
      case "metric":
        return (
          <MetricWidget
            data={widgetData as { value: number; change?: number }}
            config={widget.config}
          />
        );
      case "chart":
        return (
          <ChartWidget
            data={widgetData as Array<{ name: string; value: number }>}
            config={widget.config}
          />
        );
      case "list":
        return (
          <ListWidget
            data={widgetData as Array<Record<string, unknown>>}
            config={widget.config}
          />
        );
      case "table":
        return (
          <TableWidget
            data={widgetData as Array<Record<string, unknown>>}
            config={widget.config}
          />
        );
      case "funnel":
        return (
          <FunnelWidget
            data={widgetData as { stages: Array<{ name: string; value: number; amount: number; color: string }> }}
            config={widget.config}
          />
        );
      case "leaderboard":
        return (
          <LeaderboardWidget
            data={widgetData as { entries: Array<{ userId: string; name: string; value: number; avatarUrl?: string }> }}
            config={widget.config}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-sm text-zinc-500">
            Unknown widget type
          </div>
        );
    }
  };

  return (
    <Card
      className={cn(
        "h-full flex flex-col overflow-hidden transition-all",
        isEditing && "cursor-pointer",
        isSelected && "ring-2 ring-blue-500",
        !isEditing && "hover:shadow-md"
      )}
      onClick={(e) => {
        if (isEditing) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing && (
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-zinc-400" />
            </div>
          )}
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {widget.title}
          </h3>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {renderWidgetContent()}
      </div>
    </Card>
  );
}

// Loading skeleton based on widget type
function WidgetSkeleton({ type }: { type: string }) {
  switch (type) {
    case "metric":
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      );
    case "chart":
      return (
        <div className="flex items-end justify-around h-full gap-2 px-4">
          <Skeleton className="w-8 h-[40%]" />
          <Skeleton className="w-8 h-[60%]" />
          <Skeleton className="w-8 h-[80%]" />
          <Skeleton className="w-8 h-[50%]" />
          <Skeleton className="w-8 h-[70%]" />
        </div>
      );
    case "list":
    case "table":
      return (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    case "funnel":
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-[85%]" />
          <Skeleton className="h-8 w-[70%]" />
          <Skeleton className="h-8 w-[55%]" />
        </div>
      );
    case "leaderboard":
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      );
    default:
      return <Skeleton className="h-full w-full" />;
  }
}
