"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { MeetingTypeCard } from "./MeetingTypeCard";
import { MeetingTypeForm } from "./MeetingTypeForm";
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
import { toast } from "sonner";

interface MeetingTypeListProps {
  userId: Id<"users">;
}

export function MeetingTypeList({ userId }: MeetingTypeListProps) {
  const meetingTypes = useQuery(api.scheduler.listMeetingTypes, {
    createdBy: userId,
  });
  const deleteMeetingType = useMutation(api.scheduler.deleteMeetingType);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeetingType, setEditingMeetingType] = useState<Doc<"meetingTypes"> | null>(null);
  const [deletingMeetingType, setDeletingMeetingType] = useState<Doc<"meetingTypes"> | null>(null);

  const handleEdit = (meetingType: Doc<"meetingTypes">) => {
    setEditingMeetingType(meetingType);
    setIsFormOpen(true);
  };

  const handleDelete = (meetingType: Doc<"meetingTypes">) => {
    setDeletingMeetingType(meetingType);
  };

  const confirmDelete = async () => {
    if (!deletingMeetingType) return;

    try {
      const result = await deleteMeetingType({ id: deletingMeetingType._id });
      if (result.deleted) {
        toast.success("Meeting type deleted successfully");
      } else if (result.deactivated) {
        toast.success("Meeting type deactivated (has existing bookings)");
      }
    } catch (error) {
      toast.error("Failed to delete meeting type");
    } finally {
      setDeletingMeetingType(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingMeetingType(null);
    }
  };

  if (!meetingTypes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meeting Types</h2>
          <p className="text-muted-foreground">
            Create and manage your scheduling links
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Meeting Type
        </Button>
      </div>

      {meetingTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No meeting types yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Create your first meeting type to start accepting bookings.
          </p>
          <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Meeting Type
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetingTypes.map((meetingType) => (
            <MeetingTypeCard
              key={meetingType._id}
              meetingType={meetingType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MeetingTypeForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        meetingType={editingMeetingType}
        userId={userId}
      />

      <AlertDialog
        open={!!deletingMeetingType}
        onOpenChange={(open) => !open && setDeletingMeetingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMeetingType?.name}"? This
              action cannot be undone. If there are existing bookings, the meeting
              type will be deactivated instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
