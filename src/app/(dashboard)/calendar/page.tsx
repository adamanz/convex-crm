"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskForm } from "@/components/activities/task-form";
import { NoteForm } from "@/components/activities/note-form";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type CalendarView = "day" | "week" | "month";
type ActivityType = "task" | "call" | "email" | "meeting" | "note" | "all";

interface CalendarActivity {
  _id: string;
  type: "task" | "call" | "email" | "meeting" | "note";
  subject: string;
  description?: string;
  dueDate?: number;
  createdAt: number;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  duration?: number;
  relatedEntity?: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const activityTypeConfig = {
  task: {
    icon: CheckSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-900",
    label: "Task",
  },
  call: {
    icon: Phone,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-200 dark:border-amber-900",
    label: "Call",
  },
  email: {
    icon: Mail,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
    borderColor: "border-cyan-200 dark:border-cyan-900",
    label: "Email",
  },
  meeting: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    borderColor: "border-purple-200 dark:border-purple-900",
    label: "Meeting",
  },
  note: {
    icon: FileText,
    color: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    borderColor: "border-zinc-200 dark:border-zinc-700",
    label: "Note",
  },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [typeFilter, setTypeFilter] = useState<ActivityType>("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch all activities
  const activitiesData = useQuery(api.activities.feed, {
    limit: 500,
  });

  // Mutations
  const completeTask = useMutation(api.activities.complete);
  const reopenTask = useMutation(api.activities.reopen);

  const handleTaskComplete = useCallback(
    async (id: string, completed: boolean) => {
      try {
        if (completed) {
          await completeTask({ id: id as Id<"activities"> });
          toast.success("Task completed");
        } else {
          await reopenTask({ id: id as Id<"activities"> });
          toast.success("Task reopened");
        }
      } catch (error) {
        toast.error("Failed to update task");
      }
    },
    [completeTask, reopenTask]
  );

  // Helper functions
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getDaysInMonth = (date: Date) => {
    return getEndOfMonth(date).getDate();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Get activities for display based on view and filters
  const filteredActivities = useMemo(() => {
    if (!activitiesData?.items) return [];

    let filtered = activitiesData.items as CalendarActivity[];

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Filter by date range based on view
    const viewStart = view === "month"
      ? getStartOfMonth(currentDate)
      : view === "week"
      ? getStartOfWeek(currentDate)
      : new Date(currentDate.setHours(0, 0, 0, 0));

    const viewEnd = view === "month"
      ? getEndOfMonth(currentDate)
      : view === "week"
      ? new Date(getStartOfWeek(currentDate).getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(currentDate.setHours(23, 59, 59, 999));

    filtered = filtered.filter((activity) => {
      const activityDate = activity.dueDate || activity.createdAt;
      return activityDate >= viewStart.getTime() && activityDate <= viewEnd.getTime();
    });

    return filtered;
  }, [activitiesData?.items, typeFilter, currentDate, view]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarActivity[]>();

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.dueDate || activity.createdAt);
      const dateKey = date.toISOString().split("T")[0];

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(activity);
    });

    // Sort activities within each date
    grouped.forEach((activities) => {
      activities.sort((a, b) => {
        const aTime = a.dueDate || a.createdAt;
        const bTime = b.dueDate || b.createdAt;
        return aTime - bTime;
      });
    });

    return grouped;
  }, [filteredActivities]);

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getViewTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (view === "week") {
      const weekStart = getStartOfWeek(currentDate);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const isLoading = !activitiesData;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-100 bg-white px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <CalendarIcon className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Calendar
              </h1>
              <p className="text-[13px] text-zinc-500">
                View and manage activities by date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteDialogOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Note
            </Button>
            <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToday}
              className="h-8"
            >
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={navigatePrevious}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="min-w-[200px] text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {getViewTitle()}
            </span>
          </div>

          {/* View & Filters */}
          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as ActivityType)}
              >
                <SelectTrigger className="h-8 w-[120px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="call">Calls</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Selector */}
            <Select
              value={view}
              onValueChange={(value) => setView(value as CalendarView)}
            >
              <SelectTrigger className="h-8 w-[100px] text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-zinc-900/50">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="h-full p-6">
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                activitiesByDate={activitiesByDate}
                onTaskComplete={handleTaskComplete}
                onDateClick={setSelectedDate}
              />
            )}
            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                activitiesByDate={activitiesByDate}
                onTaskComplete={handleTaskComplete}
              />
            )}
            {view === "day" && (
              <DayView
                currentDate={currentDate}
                activitiesByDate={activitiesByDate}
                onTaskComplete={handleTaskComplete}
              />
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSuccess={() => setIsTaskDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Quick Note</DialogTitle>
          </DialogHeader>
          <NoteForm onSuccess={() => setIsNoteDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  currentDate: Date;
  activitiesByDate: Map<string, CalendarActivity[]>;
  onTaskComplete: (id: string, completed: boolean) => void;
  onDateClick: (date: Date) => void;
}

function MonthView({
  currentDate,
  activitiesByDate,
  onTaskComplete,
  onDateClick,
}: MonthViewProps) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = [];
  const today = new Date();

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px]" />);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split("T")[0];
    const dayActivities = activitiesByDate.get(dateKey) || [];
    const isCurrentDay =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    days.push(
      <div
        key={day}
        className={cn(
          "min-h-[120px] border border-zinc-200 bg-white p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50",
          isCurrentDay && "ring-2 ring-blue-500 ring-inset"
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
              isCurrentDay
                ? "bg-blue-600 text-white"
                : "text-zinc-700 dark:text-zinc-300"
            )}
          >
            {day}
          </span>
          {dayActivities.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {dayActivities.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayActivities.slice(0, 3).map((activity) => {
            const config = activityTypeConfig[activity.type];
            const Icon = config.icon;
            return (
              <TooltipProvider key={activity._id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded border px-1.5 py-1 text-[11px] transition-colors hover:shadow-sm",
                        config.borderColor,
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-3 w-3 shrink-0", config.color)} />
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {activity.subject}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{activity.subject}</p>
                    {activity.description && (
                      <p className="mt-1 text-xs text-zinc-400">
                        {activity.description}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {dayActivities.length > 3 && (
            <div className="text-center text-[10px] text-zinc-500">
              +{dayActivities.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-zinc-50 p-3 text-center text-xs font-semibold text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">{days}</div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  activitiesByDate: Map<string, CalendarActivity[]>;
  onTaskComplete: (id: string, completed: boolean) => void;
}

function WeekView({ currentDate, activitiesByDate, onTaskComplete }: WeekViewProps) {
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDays.push(date);
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-7">
        {weekDays.map((date, index) => {
          const dateKey = date.toISOString().split("T")[0];
          const dayActivities = activitiesByDate.get(dateKey) || [];
          const isCurrentDay =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <div
              key={index}
              className={cn(
                "border-r border-zinc-200 last:border-r-0 dark:border-zinc-800",
                isCurrentDay && "bg-blue-50/50 dark:bg-blue-950/20"
              )}
            >
              {/* Day header */}
              <div className="border-b border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="text-[11px] font-semibold uppercase text-zinc-500">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    isCurrentDay
                      ? "bg-blue-600 text-white"
                      : "text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>

              {/* Activities */}
              <div className="min-h-[400px] space-y-1.5 p-2">
                {dayActivities.map((activity) => (
                  <ActivityCard
                    key={activity._id}
                    activity={activity}
                    onTaskComplete={onTaskComplete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
interface DayViewProps {
  currentDate: Date;
  activitiesByDate: Map<string, CalendarActivity[]>;
  onTaskComplete: (id: string, completed: boolean) => void;
}

function DayView({ currentDate, activitiesByDate, onTaskComplete }: DayViewProps) {
  const dateKey = currentDate.toISOString().split("T")[0];
  const dayActivities = activitiesByDate.get(dateKey) || [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <Badge variant="secondary">
            {dayActivities.length} {dayActivities.length === 1 ? "activity" : "activities"}
          </Badge>
        </div>

        {dayActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <CalendarIcon className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              No activities scheduled
            </h3>
            <p className="text-sm text-zinc-500">
              Add tasks, meetings, or notes to organize your day
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayActivities.map((activity) => (
              <ActivityCard
                key={activity._id}
                activity={activity}
                onTaskComplete={onTaskComplete}
                expanded
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Card Component
interface ActivityCardProps {
  activity: CalendarActivity;
  onTaskComplete: (id: string, completed: boolean) => void;
  expanded?: boolean;
}

function ActivityCard({ activity, onTaskComplete, expanded = false }: ActivityCardProps) {
  const config = activityTypeConfig[activity.type];
  const Icon = config.icon;
  const isTask = activity.type === "task";
  const isCompleted = isTask && activity.completed;

  const getRelatedEntityName = (entity: CalendarActivity["relatedEntity"]): string => {
    if (!entity) return "Unknown";
    if ("name" in entity && entity.name) return entity.name;
    if ("firstName" in entity || "lastName" in entity) {
      return `${entity.firstName || ""} ${entity.lastName || ""}`.trim() || "Unknown";
    }
    return "Unknown";
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors hover:shadow-sm",
        config.borderColor,
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            config.bgColor
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium text-zinc-900 dark:text-zinc-50",
                  isCompleted && "line-through text-zinc-500"
                )}
              >
                {activity.subject}
              </p>
              {expanded && activity.description && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {activity.description}
                </p>
              )}
            </div>

            {/* Priority badge */}
            {isTask && activity.priority && (
              <Badge
                variant={
                  activity.priority === "high"
                    ? "destructive"
                    : activity.priority === "medium"
                    ? "default"
                    : "secondary"
                }
                className="shrink-0 text-[10px]"
              >
                {activity.priority}
              </Badge>
            )}
          </div>

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            {activity.relatedEntity && (
              <span className="truncate">
                {getRelatedEntityName(activity.relatedEntity)}
              </span>
            )}
            {activity.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activity.duration}m
              </span>
            )}
            {activity.assignedTo && (
              <span>
                {activity.assignedTo.firstName} {activity.assignedTo.lastName}
              </span>
            )}
          </div>
        </div>

        {/* Task checkbox */}
        {isTask && (
          <button
            onClick={() => onTaskComplete(activity._id, !isCompleted)}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
              isCompleted
                ? "border-emerald-500 bg-emerald-500"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600"
            )}
          >
            {isCompleted && <CheckSquare className="h-3 w-3 text-white" />}
          </button>
        )}
      </div>
    </div>
  );
}
