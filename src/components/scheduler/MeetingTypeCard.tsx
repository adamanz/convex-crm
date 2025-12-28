"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Clock, MapPin, Link2, MoreVertical, Copy, ExternalLink, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MeetingTypeCardProps {
  meetingType: Doc<"meetingTypes">;
  onEdit?: (meetingType: Doc<"meetingTypes">) => void;
  onDelete?: (meetingType: Doc<"meetingTypes">) => void;
  baseUrl?: string;
}

const locationLabels: Record<string, string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  phone: "Phone Call",
  inPerson: "In Person",
  custom: "Custom",
};

const locationIcons: Record<string, string> = {
  zoom: "video",
  meet: "video",
  phone: "phone",
  inPerson: "building",
  custom: "map-pin",
};

export function MeetingTypeCard({
  meetingType,
  onEdit,
  onDelete,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: MeetingTypeCardProps) {
  const bookingUrl = `${baseUrl}/book/${meetingType.bookingLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success("Booking link copied to clipboard");
  };

  const handleOpenLink = () => {
    window.open(bookingUrl, "_blank");
  };

  return (
    <div
      className="group relative rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: meetingType.color, borderLeftWidth: "4px" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{meetingType.name}</h3>
            {!meetingType.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>

          {meetingType.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {meetingType.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{meetingType.duration} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{locationLabels[meetingType.location]}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <Link2 className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">/book/{meetingType.bookingLink}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenLink}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenLink}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Booking Page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(meetingType)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(meetingType)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
