"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserList } from "@/components/users/UserList";
import { TeamStats } from "@/components/users/TeamStats";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { toast } from "sonner";
import type { UserWithStats } from "@/types/users";

export default function TeamSettingsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Fetch users with stats
  const users = useQuery(api.users.list, { includeStats: true, includeInactive: true });
  const teamStats = useQuery(api.users.getTeamStats, {});

  // Mutations
  const deactivateUser = useMutation(api.users.deactivate);
  const reactivateUser = useMutation(api.users.reactivate);

  const handleDeactivate = async (user: UserWithStats) => {
    try {
      await deactivateUser({ id: user._id as Id<"users"> });
      toast.success(`${user.firstName || user.email} has been deactivated`);
    } catch (error) {
      toast.error("Failed to deactivate user");
    }
  };

  const handleReactivate = async (user: UserWithStats) => {
    try {
      await reactivateUser({ id: user._id as Id<"users"> });
      toast.success(`${user.firstName || user.email} has been reactivated`);
    } catch (error) {
      toast.error("Failed to reactivate user");
    }
  };

  const handleEdit = (user: UserWithStats) => {
    // TODO: Implement edit user dialog
    console.log("Edit user:", user);
  };

  // Loading state
  if (users === undefined || teamStats === undefined) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Cast users to the expected type
  const typedUsers = users as UserWithStats[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Team Management
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Manage team members, roles, and permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <TeamStats stats={teamStats} />

      {/* Team Members Table */}
      <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Team Members
        </h2>
        <UserList
          users={typedUsers}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      </div>

      {/* Invite Dialog */}
      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
