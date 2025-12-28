"use client";

import { useState, useCallback } from "react";
import { format, addMinutes, setHours, setMinutes, startOfDay } from "date-fns";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  CheckSquare,
} from "lucide-react";
import { type EventType } from "./EventCard";

interface QuickScheduleData {
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  duration: number;
  description?: string;
  location?: string;
}

export interface QuickScheduleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (data: {
    title: string;
    type: EventType;
    startTime: number;
    endTime: number;
    description?: string;
    location?: string;
  }) => Promise<void>;
  defaultDate?: Date;
  defaultType?: EventType;
  className?: string;
}

const eventTypes: Array<{
  value: EventType;
  label: string;
  icon: typeof Users;
}> = [
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "call", label: "Call", icon: Phone },
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "reminder", label: "Reminder", icon: Calendar },
];

const durations = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
}

const timeSlots = generateTimeSlots();

export function QuickSchedule({
  open,
  onOpenChange,
  onSchedule,
  defaultDate,
  defaultType = "meeting",
  className,
}: QuickScheduleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuickScheduleData>(() => ({
    title: "",
    type: defaultType,
    date: defaultDate
      ? format(defaultDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    duration: 30,
    description: "",
    location: "",
  }));

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim()) return;

      setIsSubmitting(true);
      try {
        const [hours, minutes] = formData.startTime.split(":").map(Number);
        const startDate = setMinutes(
          setHours(startOfDay(new Date(formData.date)), hours),
          minutes
        );
        const endDate = addMinutes(startDate, formData.duration);

        await onSchedule({
          title: formData.title.trim(),
          type: formData.type,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          description: formData.description?.trim() || undefined,
          location: formData.location?.trim() || undefined,
        });

        // Reset form
        setFormData({
          title: "",
          type: defaultType,
          date: format(new Date(), "yyyy-MM-dd"),
          startTime: "09:00",
          duration: 30,
          description: "",
          location: "",
        });
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to schedule:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSchedule, onOpenChange, defaultType]
  );

  const updateField = useCallback(
    <K extends keyof QuickScheduleData>(
      field: K,
      value: QuickScheduleData[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const SelectedTypeIcon =
    eventTypes.find((t) => t.value === formData.type)?.icon || Users;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Schedule
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: EventType) => updateField("type", value)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <SelectedTypeIcon className="h-4 w-4" />
                    {eventTypes.find((t) => t.value === formData.type)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Time
              </Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => updateField("startTime", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {format(
                        setMinutes(
                          setHours(new Date(), parseInt(slot.split(":")[0])),
                          parseInt(slot.split(":")[1])
                        ),
                        "h:mm a"
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={formData.duration.toString()}
              onValueChange={(value) => updateField("duration", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem
                    key={duration.value}
                    value={duration.value.toString()}
                  >
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Add location (optional)"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details (optional)"
              rows={2}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
