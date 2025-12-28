"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetTypeSelector, WidgetType, widgetTypes } from "./WidgetTypeSelector";
import { toast } from "sonner";

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: Id<"dashboards">;
}

export function AddWidgetDialog({ open, onOpenChange, dashboardId }: AddWidgetDialogProps) {
  const addWidget = useMutation(api.dashboards.addWidget);

  const [step, setStep] = useState<"type" | "config">("type");
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [title, setTitle] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [metricType, setMetricType] = useState("count");
  const [leaderboardType, setLeaderboardType] = useState("deals_won");
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("type");
      setSelectedType(null);
      setTitle("");
      setDataSource("");
      setChartType("bar");
      setMetricType("count");
      setLeaderboardType("deals_won");
    }
    onOpenChange(open);
  };

  // Handle type selection
  const handleTypeSelect = (type: WidgetType) => {
    setSelectedType(type);
    // Set default title based on type
    const typeInfo = widgetTypes.find((t) => t.type === type);
    if (typeInfo) {
      setTitle(`New ${typeInfo.label}`);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (!selectedType) {
      toast.error("Please select a widget type");
      return;
    }
    setStep("config");
  };

  // Handle back
  const handleBack = () => {
    setStep("type");
  };

  // Handle create widget
  const handleCreate = async () => {
    if (!selectedType || !title.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Build config based on widget type
      const config: Record<string, unknown> = {
        dataSource,
        dateRange: "month",
      };

      switch (selectedType) {
        case "metric":
          config.metricType = metricType;
          config.showComparison = true;
          break;
        case "chart":
          config.chartType = chartType;
          config.groupBy = "status";
          break;
        case "list":
        case "table":
          config.limit = 10;
          config.sortBy = "createdAt";
          config.sortOrder = "desc";
          break;
        case "funnel":
          // Funnel uses default pipeline
          break;
        case "leaderboard":
          config.leaderboardType = leaderboardType;
          config.limit = 10;
          break;
      }

      await addWidget({
        dashboardId,
        type: selectedType,
        title,
        config,
      });

      toast.success("Widget added");
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to create widget:", error);
      toast.error("Failed to create widget");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {step === "type" ? "Add Widget" : "Configure Widget"}
          </DialogTitle>
          <DialogDescription>
            {step === "type"
              ? "Choose the type of widget you want to add to your dashboard."
              : "Configure the settings for your new widget."}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && (
          <div className="py-4">
            <WidgetTypeSelector
              selectedType={selectedType}
              onSelect={handleTypeSelect}
            />
          </div>
        )}

        {step === "config" && selectedType && (
          <div className="py-4 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="widget-title">Title *</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter widget title"
              />
            </div>

            {/* Data Source (for most widget types) */}
            {selectedType !== "funnel" && (
              <div className="space-y-2">
                <Label>Data Source *</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
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
            )}

            {/* Type-specific options */}
            {selectedType === "metric" && (
              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select value={metricType} onValueChange={setMetricType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedType === "chart" && (
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger>
                    <SelectValue />
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
            )}

            {selectedType === "leaderboard" && (
              <div className="space-y-2">
                <Label>Leaderboard Type</Label>
                <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deals_won">Deals Won</SelectItem>
                    <SelectItem value="deals_value">Deals Value</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                    <SelectItem value="contacts_added">Contacts Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "type" ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!selectedType}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  isCreating ||
                  !title.trim() ||
                  (selectedType !== "funnel" && !dataSource)
                }
              >
                {isCreating ? "Creating..." : "Add Widget"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
