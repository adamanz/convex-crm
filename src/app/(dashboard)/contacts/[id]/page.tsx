"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  RecordPageLayout,
  RecordCard,
  RecordField,
  EmptyTabState,
} from "@/components/shared/record-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  Phone,
  MessageSquare,
  Building2,
  MapPin,
  ExternalLink,
  Pencil,
  Tag,
  Linkedin,
  Twitter,
  Calendar,
  Clock,
  CheckCircle2,
  PhoneCall,
  FileText,
  Users,
  DollarSign,
  Trash2,
} from "lucide-react";
import { cn, getInitials, formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils";
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog";
import {
  ConnectedLeadScoreCard,
  ConnectedContactEnrichment,
  ConnectedActivitySuggestion,
} from "@/components/ai";
import { CommentThread } from "@/components/comments";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as Id<"contacts">;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const contact = useQuery(api.contacts.get, { id: contactId });
  const activities = useQuery(api.activities.byRelated, {
    relatedToType: "contact",
    relatedToId: contactId,
    limit: 20,
  });
  const users = useQuery(api.users.list, { includeInactive: false });

  if (contact === undefined) {
    return <RecordPageLayout title="" isLoading={true} />;
  }

  if (contact === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Users className="h-7 w-7 text-zinc-400" />
        </div>
        <h2 className="text-lg font-semibold">Contact not found</h2>
        <p className="text-sm text-zinc-500">This contact doesn&apos;t exist or has been deleted.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const fallbackUserId = users?.[0]?._id;
  const effectiveUserId = contact.owner?._id as Id<"users"> | undefined ?? fallbackUserId;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab contact={contact} />,
    },
    {
      id: "activities",
      label: "Activities",
      content: <ActivitiesTab activities={activities} />,
    },
    {
      id: "deals",
      label: "Deals",
      content: <DealsTab deals={contact.deals} />,
    },
    {
      id: "messages",
      label: "Messages",
      content: <MessagesTab contactId={contactId} />,
    },
    {
      id: "comments",
      label: "Comments",
      content: effectiveUserId ? (
        <CommentsTab contactId={contactId} currentUserId={effectiveUserId} />
      ) : (
        <EmptyTabState
          icon={<MessageSquare className="h-6 w-6 text-zinc-400" />}
          title="Loading..."
          description=""
        />
      ),
    },
  ];

  return (
    <>
      <RecordPageLayout
        title={fullName}
        subtitle={
          contact.title && contact.company
            ? `${contact.title} at ${contact.company.name}`
            : contact.title || contact.company?.name
        }
        avatarUrl={contact.avatarUrl}
        avatarFallback={getInitials(contact.firstName, contact.lastName)}
        avatarColor="from-blue-500 to-indigo-600"
        badges={contact.tags.map((tag) => ({ label: tag }))}
        backHref="/contacts"
        quickActions={
          <>
            {contact.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="h-4 w-4 mr-1.5" />
                  Email
                </a>
              </Button>
            )}
            {contact.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4 mr-1.5" />
                  Call
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Message
            </Button>
          </>
        }
        menuActions={[
          {
            label: "Edit contact",
            onClick: () => setIsEditDialogOpen(true),
            icon: <Pencil className="h-4 w-4" />,
          },
          {
            label: "Add tags",
            onClick: () => {},
            icon: <Tag className="h-4 w-4" />,
          },
          {
            label: "Delete contact",
            onClick: () => {},
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            separator: true,
          },
        ]}
        tabs={tabs}
        defaultTab="overview"
      />

      <EditContactDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        contact={contact}
      />
    </>
  );
}

// Overview Tab
function OverviewTab({ contact }: { contact: any }) {
  const addressParts = [
    contact.address?.street,
    contact.address?.city,
    contact.address?.state,
    contact.address?.postalCode,
    contact.address?.country,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-5 p-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-5">
          <RecordCard title="Contact Information">
            <div className="grid gap-5 sm:grid-cols-2">
              <RecordField
                label="Email"
                icon={<Mail className="h-3 w-3" />}
                value={
                  contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  )
                }
              />
              <RecordField
                label="Phone"
                icon={<Phone className="h-3 w-3" />}
                value={
                  contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  )
                }
              />
              <RecordField
                label="Company"
                icon={<Building2 className="h-3 w-3" />}
                value={contact.company?.name}
                href={contact.company ? `/companies/${contact.company._id}` : undefined}
              />
              <RecordField
                label="Title"
                icon={<Users className="h-3 w-3" />}
                value={contact.title}
              />
              {fullAddress && (
                <div className="sm:col-span-2">
                  <RecordField
                    label="Address"
                    icon={<MapPin className="h-3 w-3" />}
                    value={fullAddress}
                  />
                </div>
              )}
              <RecordField
                label="LinkedIn"
                icon={<Linkedin className="h-3 w-3" />}
                value={
                  contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      View Profile <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                }
              />
              <RecordField
                label="Twitter"
                icon={<Twitter className="h-3 w-3" />}
                value={
                  contact.twitterHandle && (
                    <a
                      href={`https://twitter.com/${contact.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      @{contact.twitterHandle} <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                }
              />
            </div>
          </RecordCard>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-5">
          <ConnectedLeadScoreCard contactId={contact._id} />
          <ConnectedContactEnrichment contactId={contact._id} />
          <ConnectedActivitySuggestion
            contactId={contact._id}
            contactName={[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
          />

          {contact.tags.length > 0 && (
            <RecordCard title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </RecordCard>
          )}

          <RecordCard title="Details">
            <div className="space-y-4">
              <RecordField label="Source" value={contact.source} />
              <RecordField
                label="Owner"
                value={
                  contact.owner
                    ? [contact.owner.firstName, contact.owner.lastName].filter(Boolean).join(" ") ||
                      contact.owner.email
                    : undefined
                }
              />
              <RecordField label="Created" value={formatDate(contact.createdAt)} />
              <RecordField label="Last Updated" value={formatRelativeTime(contact.updatedAt)} />
              {contact.lastActivityAt && (
                <RecordField label="Last Activity" value={formatRelativeTime(contact.lastActivityAt)} />
              )}
            </div>
          </RecordCard>
        </div>
      </div>
    </ScrollArea>
  );
}

// Activities Tab
function ActivitiesTab({ activities }: { activities: any }) {
  if (!activities || activities.items.length === 0) {
    return (
      <EmptyTabState
        icon={<Clock className="h-6 w-6 text-zinc-400" />}
        title="No activities yet"
        description="Activities will appear here when you interact with this contact."
        action={<Button size="sm">Log an activity</Button>}
      />
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task": return CheckCircle2;
      case "call": return PhoneCall;
      case "email": return Mail;
      case "meeting": return Users;
      case "note": return FileText;
      default: return Clock;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-3">
        {activities.items.map((activity: any) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div
              key={activity._id}
              className="flex gap-4 rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/50 dark:bg-zinc-900"
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                activity.type === "task" && activity.completed
                  ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
                    {activity.subject}
                  </h4>
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                {activity.description && (
                  <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">
                    {activity.description}
                  </p>
                )}
                {activity.owner && (
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    by {[activity.owner.firstName, activity.owner.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Deals Tab
function DealsTab({ deals }: { deals: any[] }) {
  if (!deals || deals.length === 0) {
    return (
      <EmptyTabState
        icon={<DollarSign className="h-6 w-6 text-zinc-400" />}
        title="No deals yet"
        description="This contact isn't associated with any deals."
        action={<Button size="sm">Create a deal</Button>}
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-3">
        {deals.map((deal) => (
          <Link
            key={deal._id}
            href={`/deals/${deal._id}`}
            className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
          >
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              deal.status === "won"
                ? "bg-green-500"
                : deal.status === "lost"
                ? "bg-red-500"
                : "bg-violet-500"
            )}>
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
                  {deal.name}
                </h4>
                <Badge
                  variant={deal.status === "won" ? "default" : deal.status === "lost" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {deal.status}
                </Badge>
              </div>
              {deal.expectedCloseDate && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(deal.expectedCloseDate)}
                </p>
              )}
            </div>
            {deal.amount && (
              <span className="text-[13px] font-semibold text-emerald-600">
                {formatCurrency(deal.amount, deal.currency)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}

// Messages Tab
function MessagesTab({ contactId }: { contactId: Id<"contacts"> }) {
  return (
    <EmptyTabState
      icon={<MessageSquare className="h-6 w-6 text-zinc-400" />}
      title="No messages yet"
      description="Start a conversation with this contact."
      action={
        <Button size="sm">
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Send message
        </Button>
      }
    />
  );
}

// Comments Tab
function CommentsTab({ contactId, currentUserId }: { contactId: Id<"contacts">; currentUserId: Id<"users"> }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <CommentThread
          entityType="contact"
          entityId={contactId}
          currentUserId={currentUserId}
          title="Team Comments"
        />
      </div>
    </ScrollArea>
  );
}
