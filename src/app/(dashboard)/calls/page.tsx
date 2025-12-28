"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ListPageLayout, ListEmptyState } from "@/components/shared/list-page-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  MoreHorizontal,
  PhoneCall,
  FileText,
  Calendar,
  Mic,
  Upload,
  Play,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { AddCallDialog } from "@/components/calls/add-call-dialog";
import { CallRecordingPlayer } from "@/components/calls/CallRecordingPlayer";
import { CallUploader } from "@/components/calls/CallUploader";
import { TranscriptionView } from "@/components/calls/TranscriptionView";
import { CallSummary } from "@/components/calls/CallSummary";
import { SentimentIndicator } from "@/components/calls/SentimentIndicator";
import { toast } from "sonner";

type FilterType = "all" | "incoming" | "outgoing" | "missed";
type DateFilter = "all" | "today" | "week" | "month";

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recordingDialogCall, setRecordingDialogCall] = useState<{
    id: Id<"activities">;
    subject: string;
  } | null>(null);

  // Fetch all call activities
  const activitiesResult = useQuery(api.activities.feed, {
    type: "call",
    limit: 100,
  });

  // Fetch recording for selected call
  const selectedRecording = useQuery(
    api.callRecordings.getByActivity,
    recordingDialogCall ? { activityId: recordingDialogCall.id } : "skip"
  );

  const deleteActivity = useMutation(api.activities.delete_);

  // Filter and search calls
  const calls = useMemo(() => {
    if (!activitiesResult?.items) return [];

    let filtered = activitiesResult.items;

    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((call) => {
        const outcome = call.outcome?.toLowerCase() || "";
        if (activeFilter === "incoming") return outcome.includes("inbound") || outcome.includes("incoming");
        if (activeFilter === "outgoing") return outcome.includes("outbound") || outcome.includes("outgoing");
        if (activeFilter === "missed") return outcome.includes("missed") || outcome.includes("no answer");
        return true;
      });
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      filtered = filtered.filter((call) => {
        if (dateFilter === "today") return now - call.createdAt < dayMs;
        if (dateFilter === "week") return now - call.createdAt < 7 * dayMs;
        if (dateFilter === "month") return now - call.createdAt < 30 * dayMs;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((call) => {
        const contactName = call.relatedEntity
          ? `${(call.relatedEntity as any).firstName || ""} ${(call.relatedEntity as any).lastName || ""}`.toLowerCase()
          : "";
        const subject = call.subject?.toLowerCase() || "";
        const description = call.description?.toLowerCase() || "";
        return contactName.includes(query) || subject.includes(query) || description.includes(query);
      });
    }

    return filtered;
  }, [activitiesResult, activeFilter, dateFilter, searchQuery]);

  const handleDeleteCall = async (id: Id<"activities">) => {
    try {
      await deleteActivity({ id });
      toast.success("Call deleted");
    } catch (error) {
      toast.error("Failed to delete call");
    }
  };

  const filters = [
    { id: "all" as const, label: "All Calls", icon: <Phone className="h-3.5 w-3.5" /> },
    { id: "incoming" as const, label: "Incoming", icon: <PhoneIncoming className="h-3.5 w-3.5" /> },
    { id: "outgoing" as const, label: "Outgoing", icon: <PhoneOutgoing className="h-3.5 w-3.5" /> },
    { id: "missed" as const, label: "Missed", icon: <PhoneMissed className="h-3.5 w-3.5" /> },
  ];

  const dateFilters = [
    { id: "all" as const, label: "All Time" },
    { id: "today" as const, label: "Today" },
    { id: "week" as const, label: "This Week" },
    { id: "month" as const, label: "This Month" },
  ];

  const customFilters = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[12px]">
          <Calendar className="h-3.5 w-3.5" />
          {dateFilters.find(f => f.id === dateFilter)?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {dateFilters.map((filter) => (
          <DropdownMenuItem
            key={filter.id}
            onClick={() => setDateFilter(filter.id)}
            className={cn(dateFilter === filter.id && "bg-zinc-100 dark:bg-zinc-800")}
          >
            {filter.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ListPageLayout
        title="Calls"
        description={`${calls.length} call${calls.length !== 1 ? 's' : ''} logged`}
        icon={<PhoneCall className="h-4 w-4 text-zinc-500" />}
        searchPlaceholder="Search calls..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={(id) => setActiveFilter(id as FilterType)}
        customFilters={customFilters}
        primaryAction={{
          label: "Log Call",
          onClick: () => setIsAddDialogOpen(true),
          icon: <Plus className="h-4 w-4 mr-1" />,
        }}
        isLoading={activitiesResult === undefined}
        isEmpty={calls.length === 0}
        emptyState={
          <ListEmptyState
            icon={<PhoneCall className="h-7 w-7 text-zinc-400" />}
            title="No calls logged"
            description="Start tracking your calls by logging your first call activity."
            searchQuery={searchQuery}
            action={
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Log your first call
              </Button>
            }
          />
        }
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {calls.map((call) => (
            <CallRow
              key={call._id}
              call={call}
              onDelete={handleDeleteCall}
              onOpenRecording={(id, subject) => setRecordingDialogCall({ id, subject })}
            />
          ))}
        </div>
      </ListPageLayout>

      {/* Add Call Dialog */}
      <AddCallDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Recording Dialog */}
      <Dialog
        open={!!recordingDialogCall}
        onOpenChange={(open) => !open && setRecordingDialogCall(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              {recordingDialogCall?.subject || "Call Recording"}
            </DialogTitle>
            <DialogDescription>
              View or upload recording for this call
            </DialogDescription>
          </DialogHeader>

          {recordingDialogCall && (
            <Tabs defaultValue={selectedRecording ? "player" : "upload"} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player" disabled={!selectedRecording}>
                  <Play className="h-4 w-4 mr-2" />
                  Recording
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="player" className="mt-4 space-y-4">
                {selectedRecording ? (
                  <>
                    {/* Audio Player */}
                    <CallRecordingPlayer
                      audioUrl={selectedRecording.recordingUrl || null}
                      duration={selectedRecording.duration || 0}
                    />

                    {/* Sentiment */}
                    {selectedRecording.sentiment && (
                      <div className="pt-4 border-t border-zinc-800">
                        <h4 className="text-sm font-medium mb-2">Sentiment Analysis</h4>
                        <SentimentIndicator
                          sentiment={selectedRecording.sentiment as "positive" | "neutral" | "negative"}
                        />
                      </div>
                    )}

                    {/* Summary */}
                    {selectedRecording.summary && (
                      <div className="pt-4 border-t border-zinc-800">
                        <CallSummary
                          summary={selectedRecording.summary}
                          topics={selectedRecording.keyTopics || []}
                          actionItems={selectedRecording.actionItems || []}
                          analysisStatus="completed"
                        />
                      </div>
                    )}

                    {/* Transcription */}
                    {selectedRecording.transcription && (
                      <div className="pt-4 border-t border-zinc-800">
                        <h4 className="text-sm font-medium mb-2">Transcription</h4>
                        <TranscriptionView
                          transcription={selectedRecording.transcription as string}
                          status={selectedRecording.transcriptionStatus as "pending" | "processing" | "completed" | "failed" || "completed"}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recording available</p>
                    <p className="text-sm">Upload a recording to view it here</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <CallUploader
                  activityId={recordingDialogCall.id}
                  onUploadComplete={() => {
                    toast.success("Recording uploaded successfully");
                  }}
                  onCancel={() => setRecordingDialogCall(null)}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CallRowProps {
  call: {
    _id: Id<"activities">;
    subject: string;
    description?: string;
    duration?: number;
    outcome?: string;
    createdAt: number;
    relatedEntity?: {
      _id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string;
    } | null;
    relatedToType: "contact" | "company" | "deal";
    owner?: {
      firstName?: string;
      lastName?: string;
    } | null;
  };
  onDelete: (id: Id<"activities">) => void;
  onOpenRecording: (id: Id<"activities">, subject: string) => void;
}

function CallRow({ call, onDelete, onOpenRecording }: CallRowProps) {
  const getCallIcon = () => {
    const outcome = call.outcome?.toLowerCase() || "";
    if (outcome.includes("missed") || outcome.includes("no answer")) {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    if (outcome.includes("inbound") || outcome.includes("incoming")) {
      return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
    }
    if (outcome.includes("outbound") || outcome.includes("outgoing")) {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <Phone className="h-4 w-4 text-zinc-500" />;
  };

  const getCallBadge = () => {
    const outcome = call.outcome?.toLowerCase() || "";
    if (outcome.includes("missed") || outcome.includes("no answer")) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Missed</Badge>;
    }
    if (outcome.includes("inbound") || outcome.includes("incoming")) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Incoming</Badge>;
    }
    if (outcome.includes("outbound") || outcome.includes("outgoing")) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Outgoing</Badge>;
    }
    return null;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "No duration";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const contactName = call.relatedEntity
    ? `${call.relatedEntity.firstName || ""} ${call.relatedEntity.lastName || ""}`.trim() || "Unknown Contact"
    : "No Contact";

  const linkHref = call.relatedToType === "contact"
    ? `/contacts/${call.relatedEntity?._id}`
    : call.relatedToType === "company"
    ? `/companies/${call.relatedEntity?._id}`
    : `/deals/${call.relatedEntity?._id}`;

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {getCallIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
            {call.subject}
          </span>
          {getCallBadge()}
        </div>

        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-zinc-500">
          {call.relatedEntity && (
            <>
              <Link href={linkHref} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                {contactName}
              </Link>
              <span>•</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(call.duration)}
          </span>
          {call.description && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]">{call.description}</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden text-[11px] text-zinc-400 lg:block min-w-[80px] text-right">
        {formatRelativeTime(call.createdAt)}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {call.relatedEntity && (
            <DropdownMenuItem asChild>
              <Link href={linkHref}>
                View {call.relatedToType}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onOpenRecording(call._id, call.subject)}>
            <Mic className="h-3.5 w-3.5 mr-2" />
            Recording
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PhoneCall className="h-3.5 w-3.5 mr-2" />
            Call back
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="h-3.5 w-3.5 mr-2" />
            Add notes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(call._id);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
