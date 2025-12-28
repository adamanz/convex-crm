"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/components/activities/activity-item";
import { TaskForm } from "@/components/activities/task-form";
import { NoteForm } from "@/components/activities/note-form";
import {
  Plus,
  Calendar,
  Filter,
  CheckSquare,
  Phone,
  Mail,
  Users,
  FileText,
  ListTodo,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type ActivityType = "task" | "call" | "email" | "meeting" | "note" | "all";

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ActivityType>("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Handle quick add from URL parameter
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      const type = searchParams.get("type") || "task";
      if (type === "note") {
        setIsNoteDialogOpen(true);
      } else {
        setIsTaskDialogOpen(true);
      }
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  // Fetch activities based on filters
  const activitiesData = useQuery(api.activities.feed, {
    type: activeTab === "all" ? undefined : activeTab,
    limit: 50,
  });

  // Fetch upcoming tasks for sidebar
  const upcomingTasks = useQuery(api.activities.upcoming, {
    limit: 5,
    includeOverdue: true,
  });

  // Mutations
  const completeTask = useMutation(api.activities.complete);
  const reopenTask = useMutation(api.activities.reopen);
  const deleteActivity = useMutation(api.activities.delete_);

  const handleTaskComplete = useCallback(
    async (id: string, completed: boolean) => {
      try {
        if (completed) {
          await completeTask({ id: id as Id<"activities"> });
        } else {
          await reopenTask({ id: id as Id<"activities"> });
        }
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [completeTask, reopenTask]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteActivity({ id: id as Id<"activities"> });
      } catch (error) {
        console.error("Failed to delete activity:", error);
      }
    },
    [deleteActivity]
  );

  // Apply date filtering in memory
  const filteredActivities = useMemo(() => {
    if (!activitiesData?.items) return [];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    return activitiesData.items.filter((activity) => {
      if (dateFilter === "all") return true;
      if (dateFilter === "today") {
        return now - activity.createdAt < oneDay;
      }
      if (dateFilter === "week") {
        return now - activity.createdAt < oneWeek;
      }
      if (dateFilter === "month") {
        return now - activity.createdAt < oneMonth;
      }
      return true;
    });
  }, [activitiesData?.items, dateFilter]);

  const activityTabs = [
    { value: "all", label: "All", icon: ListTodo },
    { value: "task", label: "Tasks", icon: CheckSquare },
    { value: "call", label: "Calls", icon: Phone },
    { value: "email", label: "Emails", icon: Mail },
    { value: "meeting", label: "Meetings", icon: Users },
    { value: "note", label: "Notes", icon: FileText },
  ] as const;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Activities
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Track tasks, calls, emails, meetings, and notes across your CRM
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Note</span>
                    <span className="sm:hidden">Note</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Quick Note</DialogTitle>
                  </DialogHeader>
                  <NoteForm onSuccess={() => setIsNoteDialogOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Task</span>
                    <span className="sm:hidden">Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm onSuccess={() => setIsTaskDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters Row */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Filters:
              </span>
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>

            {filteredActivities.length > 0 && (
              <div className="ml-auto flex items-center gap-2 text-sm text-zinc-500">
                <span>
                  {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"}
                </span>
              </div>
            )}
          </div>

          {/* Activity Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as ActivityType);
            }}
            className="w-full"
          >
            <TabsList className="mb-6 grid w-full grid-cols-6 bg-zinc-100 dark:bg-zinc-800">
              {activityTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center justify-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {activityTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                {/* Activity Timeline */}
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[19px] top-0 h-full w-px bg-zinc-200 dark:bg-zinc-700" />

                  {/* Loading State */}
                  {!activitiesData && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                  )}

                  {/* Empty State */}
                  {activitiesData && filteredActivities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <ListTodo className="h-8 w-8 text-zinc-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        No activities found
                      </h3>
                      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                        {activeTab === "all"
                          ? "Get started by creating a task or adding a note."
                          : `No ${activeTab}s found. Try adjusting your filters.`}
                      </p>
                      {activeTab === "all" && (
                        <Button
                          className="mt-4"
                          onClick={() => setIsTaskDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first task
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Activity Items */}
                  <div className="space-y-1">
                    {filteredActivities.map((activity, index) => (
                      <ActivityItem
                        key={activity._id}
                        activity={activity}
                        onTaskComplete={handleTaskComplete}
                        onDelete={handleDelete}
                        isLast={index === filteredActivities.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Sidebar - Upcoming Tasks */}
      <div className="hidden w-80 border-l border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50 lg:block">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4 text-zinc-500" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingTasks && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            )}

            {upcomingTasks && upcomingTasks.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">
                No upcoming tasks
              </p>
            )}

            {upcomingTasks?.map((task) => (
              <div
                key={task._id}
                className={cn(
                  "rounded-lg border p-3 transition-colors hover:bg-white dark:hover:bg-zinc-800",
                  task.isOverdue
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {task.subject}
                    </p>
                    {task.relatedEntity && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {"name" in task.relatedEntity
                          ? task.relatedEntity.name
                          : `${(task.relatedEntity as any).firstName || ""} ${(task.relatedEntity as any).lastName || ""}`.trim()}
                      </p>
                    )}
                  </div>
                  {task.priority && (
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                        task.priority === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : task.priority === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-zinc-400" />
                  <span
                    className={cn(
                      task.isOverdue
                        ? "font-medium text-red-600 dark:text-red-400"
                        : "text-zinc-500"
                    )}
                  >
                    {task.isOverdue ? "Overdue - " : ""}
                    {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                  </span>
                </div>
              </div>
            ))}

            <Button
              variant="ghost"
              className="w-full justify-center text-sm"
              onClick={() => {
                setActiveTab("task");
              }}
            >
              View all tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
