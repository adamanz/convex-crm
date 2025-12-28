"use client";

import * as React from "react";
import {
  Play,
  Pause,
  X,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckSquare,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { SEQUENCE_STEP_CONFIGS } from "./SequenceStep";

export type EnrollmentStatus = "active" | "paused" | "completed" | "replied" | "bounced" | "unsubscribed";

interface Contact {
  _id: string;
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface Sequence {
  _id: string;
  name: string;
  steps: Array<{
    id: string;
    type: "email" | "sms" | "call" | "wait" | "task";
    delayDays: number;
    delayHours: number;
  }>;
}

export interface EnrollmentData {
  _id: string;
  sequenceId: string;
  contactId: string;
  currentStepIndex: number;
  status: EnrollmentStatus;
  enrolledAt: number;
  completedAt?: number;
  pausedAt?: number;
  nextStepAt?: number;
  contact?: Contact | null;
  sequence?: Sequence | null;
  executions?: Array<{
    stepIndex: number;
    executedAt: number;
    status: string;
  }>;
}

interface EnrollmentListProps {
  enrollments: EnrollmentData[] | undefined;
  isLoading?: boolean;
  onPause: (enrollmentId: string) => void;
  onResume: (enrollmentId: string) => void;
  onRemove: (enrollmentId: string) => void;
  className?: string;
}

const STATUS_BADGES: Record<EnrollmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  replied: { label: "Replied", variant: "default" },
  bounced: { label: "Bounced", variant: "destructive" },
  unsubscribed: { label: "Unsubscribed", variant: "destructive" },
};

export function EnrollmentList({
  enrollments,
  isLoading,
  onPause,
  onResume,
  onRemove,
  className,
}: EnrollmentListProps) {
  const [statusFilter, setStatusFilter] = React.useState<EnrollmentStatus | "all">("all");

  // Filter enrollments
  const filteredEnrollments = React.useMemo(() => {
    if (!enrollments) return [];

    if (statusFilter === "all") return enrollments;
    return enrollments.filter((e) => e.status === statusFilter);
  }, [enrollments, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <EmptyState
        title="No enrollments"
        description="No contacts are enrolled in this sequence yet"
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? "s" : ""}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as EnrollmentStatus | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Next Step</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.map((enrollment) => (
              <EnrollmentRow
                key={enrollment._id}
                enrollment={enrollment}
                onPause={() => onPause(enrollment._id)}
                onResume={() => onResume(enrollment._id)}
                onRemove={() => onRemove(enrollment._id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface EnrollmentRowProps {
  enrollment: EnrollmentData;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}

function EnrollmentRow({
  enrollment,
  onPause,
  onResume,
  onRemove,
}: EnrollmentRowProps) {
  const contact = enrollment.contact;
  const sequence = enrollment.sequence;
  const totalSteps = sequence?.steps.length ?? 0;
  const currentStep = sequence?.steps[enrollment.currentStepIndex];

  const statusBadge = STATUS_BADGES[enrollment.status];

  const fullName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : "Unknown Contact";

  const initials = contact
    ? getInitials(contact.firstName, contact.lastName)
    : "?";

  const getNextStepInfo = () => {
    if (enrollment.status !== "active") return null;
    if (!currentStep) return "Completed";

    const config = SEQUENCE_STEP_CONFIGS[currentStep.type];
    const Icon = config.icon;

    if (enrollment.nextStepAt) {
      const now = Date.now();
      if (enrollment.nextStepAt > now) {
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            <span>in {formatRelativeTime(enrollment.nextStepAt)}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 text-amber-500">
          <Clock className="h-3.5 w-3.5" />
          <span>Due now</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </div>
    );
  };

  return (
    <TableRow>
      {/* Contact */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {contact?.avatarUrl && (
              <AvatarImage src={contact.avatarUrl} alt={fullName} />
            )}
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{fullName}</div>
            {contact?.email && (
              <div className="text-sm text-muted-foreground">{contact.email}</div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </TableCell>

      {/* Progress */}
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: totalSteps > 0
                  ? `${(enrollment.currentStepIndex / totalSteps) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {enrollment.currentStepIndex}/{totalSteps}
          </span>
        </div>
      </TableCell>

      {/* Next Step */}
      <TableCell>
        <div className="text-sm text-muted-foreground">{getNextStepInfo()}</div>
      </TableCell>

      {/* Enrolled */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(enrollment.enrolledAt)}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {enrollment.status === "active" ? (
              <DropdownMenuItem onClick={onPause}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            ) : enrollment.status === "paused" ? (
              <DropdownMenuItem onClick={onResume}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// Compact version for showing in contact details
interface ContactEnrollmentsProps {
  enrollments: EnrollmentData[] | undefined;
  isLoading?: boolean;
  onPause: (enrollmentId: string) => void;
  onResume: (enrollmentId: string) => void;
  onRemove: (enrollmentId: string) => void;
  className?: string;
}

export function ContactEnrollments({
  enrollments,
  isLoading,
  onPause,
  onResume,
  onRemove,
  className,
}: ContactEnrollmentsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground text-center py-4", className)}>
        Not enrolled in any sequences
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {enrollments.map((enrollment) => {
        const sequence = enrollment.sequence;
        const statusBadge = STATUS_BADGES[enrollment.status];
        const totalSteps = sequence?.steps.length ?? 0;

        return (
          <div
            key={enrollment._id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {sequence?.name || "Unknown Sequence"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusBadge.variant} className="text-xs">
                  {statusBadge.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Step {enrollment.currentStepIndex + 1} of {totalSteps}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {enrollment.status === "active" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onPause(enrollment._id)}
                >
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              )}
              {enrollment.status === "paused" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onResume(enrollment._id)}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onRemove(enrollment._id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
