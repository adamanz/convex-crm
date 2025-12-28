"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Hash,
  BarChart3,
  List,
  Table,
  TrendingDown,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetType = "metric" | "chart" | "list" | "table" | "funnel" | "leaderboard";

interface WidgetTypeOption {
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const widgetTypes: WidgetTypeOption[] = [
  {
    type: "metric",
    label: "Metric",
    description: "Single number with optional comparison",
    icon: <Hash className="h-6 w-6" />,
  },
  {
    type: "chart",
    label: "Chart",
    description: "Bar, line, pie, or area chart",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    type: "list",
    label: "List",
    description: "Recent items in a list view",
    icon: <List className="h-6 w-6" />,
  },
  {
    type: "table",
    label: "Table",
    description: "Tabular data with columns",
    icon: <Table className="h-6 w-6" />,
  },
  {
    type: "funnel",
    label: "Funnel",
    description: "Pipeline stage funnel visualization",
    icon: <TrendingDown className="h-6 w-6" />,
  },
  {
    type: "leaderboard",
    label: "Leaderboard",
    description: "Top performers ranking",
    icon: <Trophy className="h-6 w-6" />,
  },
];

interface WidgetTypeSelectorProps {
  selectedType: WidgetType | null;
  onSelect: (type: WidgetType) => void;
}

export function WidgetTypeSelector({ selectedType, onSelect }: WidgetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {widgetTypes.map((option) => (
        <Card
          key={option.type}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedType === option.type
              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
          )}
          onClick={() => onSelect(option.type)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  selectedType === option.type
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {option.label}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {option.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { widgetTypes };
export type { WidgetType };
