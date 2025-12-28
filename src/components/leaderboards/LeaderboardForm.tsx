"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  DollarSign,
  Activity,
  Phone,
  Mail,
  UserPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface LeaderboardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaderboard?: {
    _id: Id<"leaderboards">;
    name: string;
    description?: string;
    metric: string;
    period: string;
    isActive: boolean;
  };
  userId?: Id<"users">;
}

const metricOptions = [
  { value: "deals_won", label: "Deals Won", icon: Trophy },
  { value: "revenue", label: "Revenue", icon: DollarSign },
  { value: "activities", label: "Activities", icon: Activity },
  { value: "calls", label: "Calls Made", icon: Phone },
  { value: "emails", label: "Emails Sent", icon: Mail },
  { value: "new_contacts", label: "New Contacts", icon: UserPlus },
];

const periodOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "allTime", label: "All Time" },
];

export function LeaderboardForm({
  open,
  onOpenChange,
  leaderboard,
  userId,
}: LeaderboardFormProps) {
  const isEditing = !!leaderboard;

  const [name, setName] = useState(leaderboard?.name || "");
  const [description, setDescription] = useState(leaderboard?.description || "");
  const [metric, setMetric] = useState(leaderboard?.metric || "deals_won");
  const [period, setPeriod] = useState(leaderboard?.period || "monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLeaderboard = useMutation(api.leaderboards.createLeaderboard);
  const updateLeaderboard = useMutation(api.leaderboards.updateLeaderboard);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for the leaderboard");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && leaderboard) {
        await updateLeaderboard({
          id: leaderboard._id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Leaderboard updated successfully");
      } else {
        await createLeaderboard({
          name: name.trim(),
          description: description.trim() || undefined,
          metric: metric as any,
          period: period as any,
          createdBy: userId,
        });
        toast.success("Leaderboard created successfully");
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving leaderboard:", error);
      toast.error("Failed to save leaderboard. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setMetric("deals_won");
    setPeriod("monthly");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Leaderboard" : "Create Leaderboard"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the leaderboard settings."
                : "Create a new competition for your sales team."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Monthly Sales Champions"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Track the top performers for this month..."
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Metric */}
            <div className="grid gap-2">
              <Label>Metric</Label>
              <Select
                value={metric}
                onValueChange={setMetric}
                disabled={isEditing || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-zinc-500" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-zinc-500">
                  Metric cannot be changed after creation
                </p>
              )}
            </div>

            {/* Period */}
            <div className="grid gap-2">
              <Label>Time Period</Label>
              <Select
                value={period}
                onValueChange={setPeriod}
                disabled={isEditing || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-zinc-500">
                  Period cannot be changed after creation
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Leaderboard"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
