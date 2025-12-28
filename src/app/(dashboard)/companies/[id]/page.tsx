"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { CompanyForm } from "@/components/companies/company-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  MapPin,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Clock,
} from "lucide-react";
import { cn, formatCurrency, formatDate, getRelativeTime } from "@/lib/utils";
import { CommentThread } from "@/components/comments";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatAddress(address?: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string | null {
  if (!address) return null;
  const parts = [
    address.street,
    address.city,
    address.state && address.postalCode
      ? `${address.state} ${address.postalCode}`
      : address.state || address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as Id<"companies">;

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const company = useQuery(api.companies.get, { id: companyId });
  const deleteCompany = useMutation(api.companies.delete_);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCompany({ id: companyId });
      router.push("/companies");
    } catch (error) {
      console.error("Error deleting company:", error);
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
  };

  if (company === undefined) {
    return <CompanyDetailSkeleton />;
  }

  if (company === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Building2 className="h-8 w-8 text-zinc-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Company not found
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          The company you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Button asChild className="mt-4">
          <Link href="/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }

  const addressString = formatAddress(company.address);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Link>

      {/* Company Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Company Info */}
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-zinc-600 dark:text-zinc-300">
                {getInitials(company.name)}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {company.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {company.industry && (
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {company.industry}
                </span>
              )}
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <Globe className="h-4 w-4" />
                  {company.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditForm(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Total Deals"
          value={company.dealStats.total}
        />
        <StatCard
          icon={DollarSign}
          label="Total Value"
          value={formatCurrency(company.dealStats.totalValue)}
        />
        <StatCard
          icon={TrendingUp}
          label="Won Deals"
          value={company.dealStats.won}
          subtitle={
            company.dealStats.wonValue > 0
              ? formatCurrency(company.dealStats.wonValue)
              : undefined
          }
        />
        <StatCard
          icon={Users}
          label="Contacts"
          value={company.contactCount}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({company.contacts.length})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals ({company.deals.length})
          </TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Details */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Company Details
              </h3>

              <div className="mt-4 space-y-4">
                {company.description && (
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                      {company.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {company.website && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Website
                      </p>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-sm text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                      >
                        <Globe className="h-4 w-4 text-zinc-400" />
                        {company.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3 text-zinc-400" />
                      </a>
                    </div>
                  )}

                  {company.phone && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Phone
                      </p>
                      <a
                        href={`tel:${company.phone}`}
                        className="mt-1 flex items-center gap-1 text-sm text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                      >
                        <Phone className="h-4 w-4 text-zinc-400" />
                        {company.phone}
                      </a>
                    </div>
                  )}

                  {addressString && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Address
                      </p>
                      <p className="mt-1 flex items-start gap-1 text-sm text-zinc-900 dark:text-zinc-50">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        {addressString}
                      </p>
                    </div>
                  )}

                  {company.size && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Company Size
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-50">
                        <Users className="h-4 w-4 text-zinc-400" />
                        {company.size} employees
                      </p>
                    </div>
                  )}

                  {company.annualRevenue && (
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Annual Revenue
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-50">
                        <DollarSign className="h-4 w-4 text-zinc-400" />
                        {formatCurrency(company.annualRevenue)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Activity
              </h3>

              {company.recentActivities.length === 0 ? (
                <div className="mt-4 text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {company.recentActivities.map((activity) => (
                    <ActivityItem key={activity._id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {company.contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No contacts yet
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Add contacts to this company to track relationships.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/contacts">Go to Contacts</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {company.contacts.map((contact) => (
                  <ContactRow key={contact._id} contact={contact} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {company.deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Briefcase className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No deals yet
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Create a deal to start tracking opportunities.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/deals">Go to Deals</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {company.deals.map((deal) => (
                  <DealRow key={deal._id} deal={deal} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {company.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Clock className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No activities yet
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Activities will appear here as you interact with this
                  company.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {company.recentActivities.map((activity) => (
                  <div key={activity._id} className="p-4">
                    <ActivityItem activity={activity} showFull />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <CompanyCommentsSection companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Modal */}
      {showEditForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowEditForm(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-zinc-900">
            <div className="p-6">
              <CompanyForm
                company={company}
                onSuccess={handleEditSuccess}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete Company
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {company.name}
              </span>
              ? This action cannot be undone.
            </p>
            {(company.contacts.length > 0 || company.deals.length > 0) && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                This company has {company.contacts.length} contacts and{" "}
                {company.deals.length} deals associated with it. They will need
                to be reassigned before deletion.
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Sub-components

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ icon: Icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  contact,
}: {
  contact: {
    _id: Id<"contacts">;
    firstName?: string;
    lastName: string;
    email?: string;
    title?: string;
    phone?: string;
  };
}) {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = getInitials(fullName);

  return (
    <Link
      href={`/contacts/${contact._id}`}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
          {fullName}
        </p>
        {contact.title && (
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {contact.title}
          </p>
        )}
      </div>
      {contact.email && (
        <div className="hidden items-center gap-1 text-sm text-zinc-500 sm:flex dark:text-zinc-400">
          <Mail className="h-4 w-4" />
          <span className="truncate max-w-[200px]">{contact.email}</span>
        </div>
      )}
    </Link>
  );
}

function DealRow({
  deal,
}: {
  deal: {
    _id: Id<"deals">;
    name: string;
    amount?: number;
    currency: string;
    status: "open" | "won" | "lost";
    stageId: string;
    createdAt: number;
  };
}) {
  const statusColors = {
    open: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    won: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    lost: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <Link
      href={`/deals/${deal._id}`}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Briefcase className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
          {deal.name}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDate(deal.createdAt)}
        </p>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          statusColors[deal.status]
        )}
      >
        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
      </span>
      {deal.amount && (
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {formatCurrency(deal.amount, deal.currency)}
        </span>
      )}
    </Link>
  );
}

function ActivityItem({
  activity,
  showFull = false,
}: {
  activity: {
    _id: Id<"activities">;
    type: "task" | "call" | "email" | "meeting" | "note";
    subject: string;
    description?: string;
    createdAt: number;
  };
  showFull?: boolean;
}) {
  const typeIcons = {
    task: Calendar,
    call: Phone,
    email: Mail,
    meeting: Users,
    note: MoreHorizontal,
  };
  const Icon = typeIcons[activity.type];

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {activity.subject}
        </p>
        {showFull && activity.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {activity.description}
          </p>
        )}
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {getRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
          />
        ))}
      </div>
      <div className="h-10 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

function CompanyCommentsSection({ companyId }: { companyId: Id<"companies"> }) {
  const users = useQuery(api.users.list, { includeInactive: false });
  const currentUserId = users?.[0]?._id;

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <CommentThread
      entityType="company"
      entityId={companyId}
      currentUserId={currentUserId}
      title="Team Comments"
    />
  );
}
