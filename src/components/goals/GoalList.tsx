"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { GoalCard, GoalType, GoalPeriod } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Target, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface GoalListProps {
  showTeamGoals?: boolean;
  showPersonalGoals?: boolean;
  userId?: Id<"users">;
  className?: string;
}

export function GoalList({
  showTeamGoals = true,
  showPersonalGoals = true,
  userId,
  className,
}: GoalListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<GoalType | "all">("all");
  const [periodFilter, setPeriodFilter] = useState<GoalPeriod | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Parameters<typeof GoalForm>[0]["goal"] | undefined>();
  const [deletingGoalId, setDeletingGoalId] = useState<Id<"goals"> | null>(null);

  const goals = useQuery(api.goals.list, {
    filter: {
      isActive: true,
      ...(typeFilter !== "all" && { type: typeFilter }),
      ...(periodFilter !== "all" && { period: periodFilter }),
    },
  });

  const deleteGoal = useMutation(api.goals.delete_);

  const handleEdit = (id: string) => {
    const goal = goals?.find((g) => g._id === id);
    if (goal) {
      setEditingGoal({
        _id: goal._id,
        name: goal.name,
        description: goal.description,
        type: goal.type,
        targetValue: goal.targetValue,
        startDate: goal.startDate,
        endDate: goal.endDate,
        period: goal.period,
        ownerId: goal.ownerId,
        teamWide: goal.teamWide,
      });
      setIsFormOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!deletingGoalId) return;

    try {
      await deleteGoal({ id: deletingGoalId });
      toast.success("Goal deleted successfully");
      setDeletingGoalId(null);
    } catch (error) {
      toast.error("Failed to delete goal");
      console.error(error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingGoal(undefined);
  };

  // Filter goals based on search and display preferences
  const filteredGoals = goals?.filter((goal) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !goal.name.toLowerCase().includes(searchLower) &&
        !goal.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Team/personal filter
    if (!showTeamGoals && goal.teamWide) return false;
    if (!showPersonalGoals && !goal.teamWide) return false;
    if (userId && !goal.teamWide && goal.ownerId !== userId) return false;

    return true;
  });

  if (goals === undefined) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as GoalType | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
              <SelectItem value="activities">Activities</SelectItem>
              <SelectItem value="calls">Calls</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={periodFilter}
            onValueChange={(value) => setPeriodFilter(value as GoalPeriod | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {filteredGoals && filteredGoals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              id={goal._id}
              name={goal.name}
              description={goal.description}
              type={goal.type}
              targetValue={goal.targetValue}
              currentValue={goal.currentValue}
              progressPercent={goal.progressPercent}
              startDate={goal.startDate}
              endDate={goal.endDate}
              period={goal.period}
              teamWide={goal.teamWide}
              owner={goal.owner}
              onEdit={handleEdit}
              onDelete={(id) => setDeletingGoalId(id as Id<"goals">)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-900">
          <Target className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            No goals found
          </h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {searchTerm || typeFilter !== "all" || periodFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first goal to start tracking progress"}
          </p>
          {!searchTerm && typeFilter === "all" && periodFilter === "all" && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          )}
        </div>
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        goal={editingGoal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingGoalId}
        onOpenChange={() => setDeletingGoalId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be
              undone and will also delete all progress history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
