"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Widget {
  _id: Id<"dashboardWidgets">;
  type: "metric" | "chart" | "list" | "table" | "funnel" | "leaderboard";
  title: string;
  description?: string;
  config: Record<string, unknown>;
  refreshInterval?: number;
}

interface WidgetConfigPanelProps {
  widgetId: Id<"dashboardWidgets">;
  widget: Widget;
  onClose: () => void;
}

export function WidgetConfigPanel({ widgetId, widget, onClose }: WidgetConfigPanelProps) {
  const updateWidget = useMutation(api.dashboards.updateWidget);

  const [title, setTitle] = useState(widget.title);
  const [description, setDescription] = useState(widget.description ?? "");
  const [config, setConfig] = useState<Record<string, unknown>>(widget.config);
  const [refreshInterval, setRefreshInterval] = useState(widget.refreshInterval ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when widget changes
  useEffect(() => {
    setTitle(widget.title);
    setDescription(widget.description ?? "");
    setConfig(widget.config);
    setRefreshInterval(widget.refreshInterval ?? 0);
  }, [widget]);

  // Update config field
  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWidget({
        widgetId,
        title,
        description: description || undefined,
        config: config as any,
        refreshInterval: refreshInterval || undefined,
      });
      toast.success("Widget updated");
    } catch (error) {
      console.error("Failed to update widget:", error);
      toast.error("Failed to update widget");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Widget Settings
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-140px)]">
        <div className="p-4 space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Basic Settings
            </h4>

            <div className="space-y-2">
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-description">Description</Label>
              <Textarea
                id="widget-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Data Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Data Settings
            </h4>

            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={config.dataSource as string}
                onValueChange={(value) => updateConfig("dataSource", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="activities">Activities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={config.dateRange as string}
                onValueChange={(value) => updateConfig("dateRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Type-specific Settings */}
          {widget.type === "metric" && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Metric Settings
              </h4>

              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select
                  value={config.metricType as string}
                  onValueChange={(value) => updateConfig("metricType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Field to Aggregate</Label>
                <Select
                  value={config.metricField as string}
                  onValueChange={(value) => updateConfig("metricField", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="probability">Probability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-comparison">Show Comparison</Label>
                <Switch
                  id="show-comparison"
                  checked={config.showComparison as boolean}
                  onCheckedChange={(checked) => updateConfig("showComparison", checked)}
                />
              </div>
            </div>
          )}

          {widget.type === "chart" && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Chart Settings
              </h4>

              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select
                  value={config.chartType as string}
                  onValueChange={(value) => updateConfig("chartType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="donut">Donut Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Group By</Label>
                <Select
                  value={config.groupBy as string}
                  onValueChange={(value) => updateConfig("groupBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="stageId">Stage</SelectItem>
                    <SelectItem value="ownerId">Owner</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(widget.type === "list" || widget.type === "table") && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Display Settings
              </h4>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={config.sortBy as string}
                  onValueChange={(value) => updateConfig("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="updatedAt">Updated Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={config.sortOrder as string}
                  onValueChange={(value) => updateConfig("sortOrder", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  max={100}
                  value={config.limit as number ?? 10}
                  onChange={(e) => updateConfig("limit", parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          )}

          {widget.type === "leaderboard" && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Leaderboard Settings
              </h4>

              <div className="space-y-2">
                <Label>Leaderboard Type</Label>
                <Select
                  value={config.leaderboardType as string}
                  onValueChange={(value) => updateConfig("leaderboardType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deals_won">Deals Won</SelectItem>
                    <SelectItem value="deals_value">Deals Value</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                    <SelectItem value="contacts_added">Contacts Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lb-limit">Top N</Label>
                <Input
                  id="lb-limit"
                  type="number"
                  min={1}
                  max={25}
                  value={config.limit as number ?? 10}
                  onChange={(e) => updateConfig("limit", parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Appearance */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Appearance
            </h4>

            <div className="space-y-2">
              <Label htmlFor="widget-color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="widget-color"
                  type="color"
                  value={config.color as string ?? "#3b82f6"}
                  onChange={(e) => updateConfig("color", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={config.color as string ?? "#3b82f6"}
                  onChange={(e) => updateConfig("color", e.target.value)}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Refresh Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Refresh Settings
            </h4>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">
                Auto-refresh Interval (seconds)
              </Label>
              <Input
                id="refresh-interval"
                type="number"
                min={0}
                max={3600}
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 0)}
                placeholder="0 = disabled"
              />
              <p className="text-xs text-zinc-500">
                Set to 0 to disable auto-refresh
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
