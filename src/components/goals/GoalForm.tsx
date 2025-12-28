"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const goalFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["revenue", "deals", "activities", "calls"]),
  targetValue: z.number().min(1, "Target must be at least 1"),
  startDate: z.date(),
  endDate: z.date(),
  period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  ownerId: z.string().optional(),
  teamWide: z.boolean(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: {
    _id: Id<"goals">;
    name: string;
    description?: string;
    type: "revenue" | "deals" | "activities" | "calls";
    targetValue: number;
    startDate: number;
    endDate: number;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    ownerId?: Id<"users">;
    teamWide: boolean;
  };
  onSuccess?: () => void;
}

const typeLabels = {
  revenue: "Revenue",
  deals: "Deals Closed",
  activities: "Activities Completed",
  calls: "Calls Made",
};

const periodLabels = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export function GoalForm({ open, onOpenChange, goal, onSuccess }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const users = useQuery(api.users.list, { includeInactive: false });

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal
      ? {
          name: goal.name,
          description: goal.description ?? "",
          type: goal.type,
          targetValue: goal.targetValue,
          startDate: new Date(goal.startDate),
          endDate: new Date(goal.endDate),
          period: goal.period,
          ownerId: goal.ownerId ?? "",
          teamWide: goal.teamWide,
        }
      : {
          name: "",
          description: "",
          type: "revenue",
          targetValue: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          period: "monthly",
          ownerId: "",
          teamWide: false,
        },
  });

  const onSubmit = async (values: GoalFormValues) => {
    setIsSubmitting(true);

    try {
      if (goal) {
        // Update existing goal
        await updateGoal({
          id: goal._id,
          name: values.name,
          description: values.description || undefined,
          type: values.type,
          targetValue: values.targetValue,
          startDate: values.startDate.getTime(),
          endDate: values.endDate.getTime(),
          period: values.period,
          ownerId: values.ownerId ? (values.ownerId as Id<"users">) : undefined,
          teamWide: values.teamWide,
        });
        toast.success("Goal updated successfully");
      } else {
        // Create new goal
        await createGoal({
          name: values.name,
          description: values.description || undefined,
          type: values.type,
          targetValue: values.targetValue,
          startDate: values.startDate.getTime(),
          endDate: values.endDate.getTime(),
          period: values.period,
          ownerId: values.ownerId ? (values.ownerId as Id<"users">) : undefined,
          teamWide: values.teamWide,
        });
        toast.success("Goal created successfully");
      }

      onOpenChange(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      toast.error(goal ? "Failed to update goal" : "Failed to create goal");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {goal
              ? "Update the goal details below."
              : "Set up a new goal to track your sales progress."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q1 Revenue Target" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this goal..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g., 100000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(periodLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamWide"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                  <div className="space-y-0.5">
                    <FormLabel>Team-wide Goal</FormLabel>
                    <FormDescription className="text-xs">
                      Make this goal visible to the entire team
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!form.watch("teamWide") && users && (
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {goal ? "Updating..." : "Creating..."}
                  </>
                ) : goal ? (
                  "Update Goal"
                ) : (
                  "Create Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
