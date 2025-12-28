"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Plus,
  DollarSign,
  Handshake,
  Activity,
  Phone,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProgressEntry {
  _id: string;
  date: number;
  value: number;
  notes?: string;
  createdAt: number;
}

interface GoalProgressProps {
  goalId: Id<"goals">;
  goalName: string;
  goalType: "revenue" | "deals" | "activities" | "calls";
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  progressHistory?: ProgressEntry[];
  className?: string;
}

const typeIcons = {
  revenue: DollarSign,
  deals: Handshake,
  activities: Activity,
  calls: Phone,
};

function formatValue(value: number, type: string): string {
  if (type === "revenue") {
    return formatCurrency(value);
  }
  return formatNumber(value);
}

export function GoalProgress({
  goalId,
  goalName,
  goalType,
  currentValue,
  targetValue,
  progressPercent,
  progressHistory = [],
  className,
}: GoalProgressProps) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProgress = useMutation(api.goals.updateProgress);
  const Icon = typeIcons[goalType];

  const handleAddProgress = async () => {
    const value = parseFloat(progressValue);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProgress({
        goalId,
        value,
        notes: progressNotes || undefined,
      });
      toast.success("Progress updated successfully");
      setIsAddingProgress(false);
      setProgressValue("");
      setProgressNotes("");
    } catch (error) {
      toast.error("Failed to update progress");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = Math.max(0, targetValue - currentValue);
  const isCompleted = progressPercent >= 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isCompleted
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-zinc-600 dark:text-zinc-400"
                )}
              />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {goalName}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isCompleted ? "Goal completed!" : `${formatValue(remaining, goalType)} to go`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingProgress(true)}
            disabled={isCompleted}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Progress
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                isCompleted ? "bg-green-500" : "bg-indigo-500"
              )}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatValue(currentValue, goalType)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {progressPercent.toFixed(0)}% of {formatValue(targetValue, goalType)}
          </span>
        </div>
      </div>

      {/* Progress History */}
      {progressHistory.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recent Progress
            </h4>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {progressHistory.slice(0, 5).map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      +{formatValue(entry.value, goalType)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {format(new Date(entry.date), "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Progress Dialog */}
      <Dialog open={isAddingProgress} onOpenChange={setIsAddingProgress}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
            <DialogDescription>
              Record progress towards your goal: {goalName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progress-value">
                {goalType === "revenue" ? "Amount ($)" : "Count"}
              </Label>
              <Input
                id="progress-value"
                type="number"
                min={0}
                step={goalType === "revenue" ? "0.01" : "1"}
                placeholder={
                  goalType === "revenue" ? "e.g., 5000" : "e.g., 10"
                }
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-notes">Notes (optional)</Label>
              <Textarea
                id="progress-notes"
                placeholder="Add any notes about this progress..."
                rows={2}
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingProgress(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProgress} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Progress"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
