"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ListPageLayout, ListItem, ListEmptyState } from "@/components/shared/list-page-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Clock,
  Building2,
  Mail,
  Phone,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { SmartListSidebar, SmartListBuilder } from "@/components/smartLists";
import { toast } from "sonner";

type FilterType = "all" | "my" | "recent";

function ContactsPageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsPageLoading />}>
      <ContactsPageContent />
    </Suspense>
  );
}

function ContactsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const smartListId = searchParams.get("smartList");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showSmartListBuilder, setShowSmartListBuilder] = useState(false);
  const [editSmartListId, setEditSmartListId] = useState<string | undefined>();

  // Handle quick add from URL parameter
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsAddDialogOpen(true);
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  // Mutations
  const refreshCount = useMutation(api.smartLists.refreshCount);
  const duplicateSmartList = useMutation(api.smartLists.duplicateSmartList);
  const deleteSmartList = useMutation(api.smartLists.deleteSmartList);

  // Fetch contacts
  const contactsResult = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 50 },
  });

  const searchResults = useQuery(
    api.contacts.search,
    searchQuery.length > 0 ? { searchTerm: searchQuery, limit: 50 } : "skip"
  );

  // Fetch smart list data
  const smartListMembers = useQuery(
    api.smartLists.getSmartListMembers,
    smartListId ? { id: smartListId as Id<"smartLists">, limit: 100 } : "skip"
  );

  const activeSmartList = useQuery(
    api.smartLists.getSmartList,
    smartListId ? { id: smartListId as Id<"smartLists"> } : "skip"
  );

  // Determine which contacts to display
  const contacts = useMemo(() => {
    if (smartListId && smartListMembers) {
      // Smart list members are typed generically but we know contacts page only shows contact smart lists
      return smartListMembers.members as typeof contactsResult extends { page: infer P } ? P : never;
    }
    if (searchQuery.length > 0 && searchResults) {
      return searchResults;
    }
    if (contactsResult?.page) {
      let filtered = contactsResult.page;
      if (activeFilter === "recent") {
        filtered = [...filtered].sort((a, b) => {
          const aTime = a.lastActivityAt || a.createdAt;
          const bTime = b.lastActivityAt || b.createdAt;
          return bTime - aTime;
        });
      }
      return filtered;
    }
    return [];
  }, [searchQuery, searchResults, contactsResult, activeFilter, smartListId, smartListMembers]);

  const isLoading = smartListId ? smartListMembers === undefined : contactsResult === undefined;

  // Smart list handlers
  const handleCreateSmartList = () => {
    setEditSmartListId(undefined);
    setShowSmartListBuilder(true);
  };

  const handleEditSmartList = (id: string) => {
    setEditSmartListId(id);
    setShowSmartListBuilder(true);
  };

  const handleDuplicateSmartList = async (id: string) => {
    try {
      await duplicateSmartList({ id: id as Id<"smartLists"> });
      toast.success("Smart list duplicated");
    } catch (error) {
      toast.error("Failed to duplicate smart list");
    }
  };

  const handleDeleteSmartList = async (id: string) => {
    try {
      await deleteSmartList({ id: id as Id<"smartLists"> });
      toast.success("Smart list deleted");
      if (id === smartListId) {
        window.history.pushState({}, "", "/contacts");
      }
    } catch (error) {
      toast.error("Failed to delete smart list");
    }
  };

  const handleRefreshSmartList = async (id: string) => {
    try {
      await refreshCount({ id: id as Id<"smartLists"> });
      toast.success("Count refreshed");
    } catch (error) {
      toast.error("Failed to refresh count");
    }
  };

  const clearSmartListFilter = () => {
    window.history.pushState({}, "", "/contacts");
  };

  const filters = [
    { id: "all" as const, label: "All", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "my" as const, label: "My Contacts", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "recent" as const, label: "Recent", icon: <Clock className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      <ListPageLayout
        title={smartListId && activeSmartList ? activeSmartList.name : "Contacts"}
        description={
          smartListId && activeSmartList
            ? activeSmartList.description || `${smartListMembers?.count ?? 0} contacts`
            : "Manage your contacts and relationships"
        }
        icon={<Users className="h-4 w-4 text-zinc-500" />}
        searchPlaceholder="Search contacts..."
        searchValue={searchQuery}
        onSearchChange={!smartListId ? setSearchQuery : undefined}
        filters={!smartListId ? filters : undefined}
        activeFilter={activeFilter}
        onFilterChange={(id) => setActiveFilter(id as FilterType)}
        primaryAction={{
          label: "Add Contact",
          onClick: () => setIsAddDialogOpen(true),
          icon: <Plus className="h-4 w-4 mr-1" />,
        }}
        activeFilterBadge={
          smartListId && activeSmartList
            ? {
                label: activeSmartList.name,
                count: smartListMembers?.count,
                onClear: clearSmartListFilter,
              }
            : undefined
        }
        sidebar={
          <div className="p-4">
            <SmartListSidebar
              entityType="contact"
              onCreateNew={handleCreateSmartList}
              onEdit={handleEditSmartList}
              onDuplicate={handleDuplicateSmartList}
              onDelete={handleDeleteSmartList}
              onRefresh={handleRefreshSmartList}
              selectedListId={smartListId ?? undefined}
            />
          </div>
        }
        isLoading={isLoading}
        isEmpty={contacts.length === 0}
        emptyState={
          <ListEmptyState
            icon={<Users className="h-7 w-7 text-zinc-400" />}
            title="No contacts yet"
            description="Get started by adding your first contact. You can import contacts or add them manually."
            searchQuery={searchQuery}
            action={
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add your first contact
              </Button>
            }
          />
        }
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {contacts.map((contact) => (
            <ContactRow key={contact._id} contact={contact} />
          ))}
        </div>
      </ListPageLayout>

      {/* Add Contact Dialog */}
      <AddContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Smart List Builder Dialog */}
      <SmartListBuilder
        open={showSmartListBuilder}
        onOpenChange={setShowSmartListBuilder}
        entityType="contact"
        editId={editSmartListId}
        onSuccess={() => {
          setShowSmartListBuilder(false);
          setEditSmartListId(undefined);
        }}
      />
    </>
  );
}

interface ContactRowProps {
  contact: {
    _id: string;
    firstName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
    avatarUrl?: string;
    tags: string[];
    lastActivityAt?: number;
    createdAt: number;
    company?: {
      _id: string;
      name: string;
    } | null;
  };
}

function ContactRow({ contact }: ContactRowProps) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  return (
    <Link
      href={`/contacts/${contact._id}`}
      className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={contact.avatarUrl} alt={fullName} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[11px]">
          {getInitials(contact.firstName, contact.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-zinc-900 truncate dark:text-zinc-100">
            {fullName}
          </span>
          {contact.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{contact.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="mt-0.5 text-[12px] text-zinc-500 truncate">
          {contact.title && contact.company && (
            <span>{contact.title} at {contact.company.name}</span>
          )}
          {contact.title && !contact.company && <span>{contact.title}</span>}
          {!contact.title && contact.company && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {contact.company.name}
            </span>
          )}
        </div>
      </div>

      <div className="hidden items-center gap-5 text-[12px] text-zinc-500 md:flex">
        {contact.email && (
          <span className="flex items-center gap-1.5 max-w-[180px] truncate">
            <Mail className="h-3.5 w-3.5 text-zinc-400" />
            {contact.email}
          </span>
        )}
        {contact.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-zinc-400" />
            {contact.phone}
          </span>
        )}
      </div>

      <div className="hidden text-[11px] text-zinc-400 lg:block min-w-[80px] text-right">
        {contact.lastActivityAt
          ? formatRelativeTime(contact.lastActivityAt)
          : formatRelativeTime(contact.createdAt)}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Add to deal</DropdownMenuItem>
          <DropdownMenuItem>Send message</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}
