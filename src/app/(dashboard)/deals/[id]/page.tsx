"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Target,
  Trash2,
  User,
  Users,
  X,
  FileText,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { ApprovalHistory, ApprovalStatus } from "@/components/approvals";
import { CommentThread } from "@/components/comments";
import { cn, formatCurrency, formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.id as Id<"deals">;
  const router = useRouter();

  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  // Fetch deal data
  const deal = useQuery(api.deals.get, { id: dealId });

  // Mutations
  const markWon = useMutation(api.deals.markWon);
  const markLost = useMutation(api.deals.markLost);
  const reopenDeal = useMutation(api.deals.reopen);
  const deleteDeal = useMutation(api.deals.delete_);
  const moveToStage = useMutation(api.deals.moveToStage);
  const createActivity = useMutation(api.activities.create);

  const handleMarkWon = async () => {
    try {
      await markWon({ id: dealId });
      toast.success("Deal marked as won!");
    } catch (error) {
      toast.error("Failed to mark deal as won");
    }
  };

  const handleMarkLost = async () => {
    try {
      await markLost({ id: dealId, reason: lostReason || undefined });
      toast.success("Deal marked as lost");
      setShowLostDialog(false);
      setLostReason("");
    } catch (error) {
      toast.error("Failed to mark deal as lost");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenDeal({ id: dealId });
      toast.success("Deal reopened");
    } catch (error) {
      toast.error("Failed to reopen deal");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal({ id: dealId });
      toast.success("Deal deleted");
      router.push("/deals");
    } catch (error) {
      toast.error("Failed to delete deal");
    }
  };

  const handleStageChange = async (stageId: string) => {
    try {
      await moveToStage({ id: dealId, stageId });
      toast.success("Stage updated");
    } catch (error) {
      toast.error("Failed to update stage");
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      await createActivity({
        type: "note",
        subject: "Note added",
        description: noteContent,
        relatedToType: "deal",
        relatedToId: dealId,
      });
      toast.success("Note added");
      setShowNoteDialog(false);
      setNoteContent("");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  // Loading state
  if (deal === undefined) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found
  if (deal === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <Target className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Deal not found
        </h3>
        <p className="text-sm text-zinc-500">
          This deal may have been deleted or you don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const stages = deal.pipeline?.stages || [];
  const currentStageIndex = stages.findIndex((s) => s.id === deal.stageId);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/deals" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Deals
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-zinc-900 dark:text-zinc-100">{deal.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {deal.status === "open" ? (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push(`/deals/${dealId}?edit=true`)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleMarkWon}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark Won
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowLostDialog(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Mark Lost
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleReopen}>
              Reopen Deal
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Deal Header */}
      <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {deal.name}
              </h1>
              <Badge
                variant={
                  deal.status === "won"
                    ? "success"
                    : deal.status === "lost"
                      ? "destructive"
                      : "secondary"
                }
              >
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              {deal.company && (
                <Link
                  href={`/companies/${deal.company._id}`}
                  className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Building2 className="h-4 w-4" />
                  {deal.company.name}
                </Link>
              )}
              {deal.expectedCloseDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Expected: {formatDate(deal.expectedCloseDate)}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created {formatRelativeTime(deal.createdAt)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {deal.amount !== undefined ? formatCurrency(deal.amount, deal.currency) : "-"}
            </p>
            {deal.probability !== undefined && (
              <p className="text-sm text-zinc-500">
                {deal.probability}% probability
              </p>
            )}
          </div>
        </div>

        {/* Stage Progress */}
        {deal.status === "open" && stages.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>Pipeline Progress</span>
              <span>
                {deal.stageName} ({currentStageIndex + 1}/{stages.length})
              </span>
            </div>
            <div className="flex gap-1">
              {stages.map((stage, index) => (
                <button
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id)}
                  className={cn(
                    "group relative h-2 flex-1 rounded-full transition-all",
                    index <= currentStageIndex
                      ? "cursor-pointer"
                      : "cursor-pointer opacity-50 hover:opacity-75"
                  )}
                  style={{
                    backgroundColor:
                      index <= currentStageIndex ? stage.color : "#e4e4e7",
                  }}
                  title={stage.name}
                >
                  <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                    {stage.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Related Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Related Contacts</CardTitle>
                <CardDescription>
                  {deal.contacts.length} contact{deal.contacts.length !== 1 && "s"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              {deal.contacts.length > 0 ? (
                <div className="space-y-3">
                  {deal.contacts.map((contact) => (
                    <Link
                      key={contact._id}
                      href={`/contacts/${contact._id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl} />
                        <AvatarFallback>
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          {contact.title || contact.email}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {contact.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {contact.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm text-zinc-500">No contacts linked</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Activity</CardTitle>
                <CardDescription>Recent activity on this deal</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {deal.activities && deal.activities.length > 0 ? (
                <div className="relative space-y-4">
                  <div className="absolute left-4 top-0 h-full w-px bg-zinc-200 dark:bg-zinc-800" />
                  {deal.activities.map((activity) => (
                    <div key={activity._id} className="relative flex gap-3 pl-10">
                      <div
                        className={cn(
                          "absolute left-2.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900",
                          activity.type === "note" && "bg-zinc-400",
                          activity.type === "email" && "bg-blue-500",
                          activity.type === "call" && "bg-amber-500",
                          activity.type === "meeting" && "bg-purple-500",
                          activity.type === "task" && "bg-emerald-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {activity.subject}
                          </p>
                          <span className="text-xs text-zinc-400">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm text-zinc-500">No activity yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowNoteDialog(true)}
                  >
                    Add a note to get started
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {deal.history && deal.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">History</CardTitle>
                <CardDescription>Changes to this deal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.history.slice(0, 10).map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-zinc-400">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Comments */}
          <DealCommentsSection dealId={dealId} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Company Card */}
          {deal.company && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/companies/${deal.company._id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {deal.company.logoUrl ? (
                      <img
                        src={deal.company.logoUrl}
                        alt={deal.company.name}
                        className="h-8 w-8 rounded"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {deal.company.name}
                    </p>
                    {deal.company.industry && (
                      <p className="text-sm text-zinc-500">
                        {deal.company.industry}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Deal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Pipeline</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.pipeline?.name || "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Stage</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: deal.stageColor }}
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {deal.stageName}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Amount</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.amount !== undefined
                    ? formatCurrency(deal.amount, deal.currency)
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Probability</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.probability !== undefined ? `${deal.probability}%` : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Expected Close</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.expectedCloseDate
                    ? formatDate(deal.expectedCloseDate)
                    : "-"}
                </span>
              </div>
              {deal.actualCloseDate && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Closed On</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatDate(deal.actualCloseDate)}
                    </span>
                  </div>
                </>
              )}
              {deal.lostReason && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-zinc-500">Lost Reason</span>
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                      {deal.lostReason}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {deal.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner */}
          {deal.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={deal.owner.avatarUrl} />
                    <AvatarFallback>
                      {getInitials(deal.owner.firstName, deal.owner.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {deal.owner.firstName} {deal.owner.lastName}
                    </p>
                    <p className="text-sm text-zinc-500">{deal.owner.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalHistory
                entityType="deal"
                entityId={dealId}
                maxItems={3}
                showTitle={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark Lost Dialog */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
            <DialogDescription>
              This will mark the deal as lost. You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">Reason (optional)</Label>
              <Textarea
                id="lostReason"
                placeholder="Why was this deal lost?"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLostDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMarkLost}>
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to this deal for your records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DealCommentsSection({ dealId }: { dealId: Id<"deals"> }) {
  const users = useQuery(api.users.list, { includeInactive: false });
  const currentUserId = users?.[0]?._id;

  if (!currentUserId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Team Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CommentThread
      entityType="deal"
      entityId={dealId}
      currentUserId={currentUserId}
      title="Team Comments"
    />
  );
}
