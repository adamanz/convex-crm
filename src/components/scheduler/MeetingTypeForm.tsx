"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
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
import { AvailabilityEditor } from "./AvailabilityEditor";
import { toast } from "sonner";

interface MeetingTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingType?: Doc<"meetingTypes"> | null;
  userId: Id<"users">;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

type LocationType = "custom" | "phone" | "zoom" | "meet" | "inPerson";

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#84cc16", label: "Lime" },
];

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true },
];

export function MeetingTypeForm({
  open,
  onOpenChange,
  meetingType,
  userId,
}: MeetingTypeFormProps) {
  const createMeetingType = useMutation(api.scheduler.createMeetingType);
  const updateMeetingType = useMutation(api.scheduler.updateMeetingType);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: meetingType?.name || "",
    description: meetingType?.description || "",
    duration: meetingType?.duration || 30,
    color: meetingType?.color || "#3b82f6",
    location: meetingType?.location || "meet",
    locationDetails: meetingType?.locationDetails || "",
    buffer: meetingType?.buffer || 0,
    minNotice: meetingType?.minNotice || 24,
    maxFuture: meetingType?.maxFuture || 60,
    bookingLink: meetingType?.bookingLink || "",
    availability: meetingType?.availability || DEFAULT_AVAILABILITY,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (meetingType) {
        await updateMeetingType({
          id: meetingType._id,
          ...formData,
        });
        toast.success("Meeting type updated successfully");
      } else {
        await createMeetingType({
          ...formData,
          createdBy: userId,
          location: formData.location as "zoom" | "meet" | "phone" | "inPerson" | "custom",
        });
        toast.success("Meeting type created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        meetingType
          ? "Failed to update meeting type"
          : "Failed to create meeting type"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meetingType ? "Edit Meeting Type" : "Create Meeting Type"}
          </DialogTitle>
          <DialogDescription>
            {meetingType
              ? "Update the meeting type settings."
              : "Create a new meeting type with a unique booking link."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Discovery Call"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the meeting"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formData.color === color.value
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: color.value }))
                      }
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, location: value as LocationType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="inPerson">In Person</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="locationDetails">Location Details</Label>
                <Input
                  id="locationDetails"
                  value={formData.locationDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      locationDetails: e.target.value,
                    }))
                  }
                  placeholder="Meeting link or address"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buffer">Buffer (minutes)</Label>
                <Input
                  id="buffer"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.buffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      buffer: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minNotice">Min Notice (hours)</Label>
                <Input
                  id="minNotice"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.minNotice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minNotice: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxFuture">Max Future (days)</Label>
                <Input
                  id="maxFuture"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.maxFuture}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxFuture: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
            </div>

            {!meetingType && (
              <div className="grid gap-2">
                <Label htmlFor="bookingLink">Custom Booking Link (optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/book/</span>
                  <Input
                    id="bookingLink"
                    value={formData.bookingLink}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bookingLink: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    placeholder="auto-generated-if-empty"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Availability</Label>
              <AvailabilityEditor
                value={formData.availability}
                onChange={(availability) =>
                  setFormData((prev) => ({ ...prev, availability }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : meetingType
                ? "Save Changes"
                : "Create Meeting Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
