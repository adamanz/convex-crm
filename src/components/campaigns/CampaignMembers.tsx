"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  Building2,
  ArrowUpRight,
  Filter,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";

type MemberStatus = "sent" | "responded" | "converted";

const statusConfig = {
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Send,
  },
  responded: {
    label: "Responded",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: MessageSquare,
  },
  converted: {
    label: "Converted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
};

interface CampaignMembersProps {
  campaignId: Id<"campaigns">;
  onAddMembers?: () => void;
}

export function CampaignMembers({ campaignId, onAddMembers }: CampaignMembersProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<MemberStatus | "all">("all");

  const membersData = useQuery(api.campaigns.getMembers, {
    campaignId,
    status: statusFilter === "all" ? undefined : statusFilter,
    paginationOpts: { numItems: 50 },
  });

  const updateMemberStatus = useMutation(api.campaigns.updateMemberStatus);
  const removeMember = useMutation(api.campaigns.removeMember);

  const filteredMembers = React.useMemo(() => {
    if (!membersData?.page) return [];
    if (!searchQuery) return membersData.page;

    const query = searchQuery.toLowerCase();
    return membersData.page.filter((member) => {
      const contact = member.contact;
      if (!contact) return false;
      const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        contact.email?.toLowerCase().includes(query)
      );
    });
  }, [membersData?.page, searchQuery]);

  const handleStatusChange = async (contactId: Id<"contacts">, newStatus: MemberStatus) => {
    try {
      await updateMemberStatus({ campaignId, contactId, status: newStatus });
      toast.success(`Member status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleRemoveMember = async (contactId: Id<"contacts">) => {
    try {
      await removeMember({ campaignId, contactId });
      toast.success("Member removed from campaign");
    } catch (error) {
      toast.error("Failed to remove member");
      console.error(error);
    }
  };

  if (membersData === undefined) {
    return <CampaignMembersSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Campaign Members</CardTitle>
            <CardDescription>
              {membersData.page.length} contacts in this campaign
            </CardDescription>
          </div>
          {onAddMembers && (
            <Button onClick={onAddMembers}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MemberStatus | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Members Table */}
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No members found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Add contacts to this campaign to get started."}
            </p>
            {onAddMembers && !searchQuery && statusFilter === "all" && (
              <Button onClick={onAddMembers} className="mt-4">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Responded</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const contact = member.contact;
                  const StatusIcon = statusConfig[member.status].icon;

                  return (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {contact ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown Contact" : "Unknown Contact"}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {contact?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                            {contact?.companyId && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Company
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig[member.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[member.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(member.addedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.firstResponseAt
                          ? format(new Date(member.firstResponseAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.convertedAt
                          ? format(new Date(member.convertedAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {member.attributedRevenue
                          ? formatCurrency(member.attributedRevenue, "USD")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member.contactId, "sent")}
                              disabled={member.status === "sent"}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member.contactId, "responded")}
                              disabled={member.status === "responded"}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Mark as Responded
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(member.contactId, "converted")}
                              disabled={member.status === "converted"}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Converted
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.contactId)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!membersData.isDone && filteredMembers.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button variant="outline">Load more</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignMembersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignMembers;
