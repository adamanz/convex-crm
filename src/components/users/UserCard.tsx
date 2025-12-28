"use client";

import * as React from "react";
import {
  Mail,
  Clock,
  Users,
  Briefcase,
  DollarSign,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials, formatRelativeTime, formatCurrency } from "@/lib/utils";
import type { UserWithStats, UserRole } from "@/types/users";

interface UserCardProps {
  user: UserWithStats;
  onClick?: () => void;
  onEdit?: (user: UserWithStats) => void;
  onDeactivate?: (user: UserWithStats) => void;
  onReactivate?: (user: UserWithStats) => void;
  className?: string;
}

const ROLE_BADGE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  member: "outline",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export function UserCard({
  user,
  onClick,
  onEdit,
  onDeactivate,
  onReactivate,
  className,
}: UserCardProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const displayName = fullName || user.email;
  const initials = getInitials(user.firstName, user.lastName);

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer",
        !user.isActive && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Avatar and Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-12 w-12">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Active indicator */}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                  user.isActive ? "bg-emerald-500" : "bg-zinc-400"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Name and Role */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {displayName}
                </h3>
                <Badge variant={ROLE_BADGE_VARIANT[user.role]} className="text-xs">
                  {ROLE_LABELS[user.role]}
                </Badge>
                {!user.isActive && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Email */}
              <a
                href={`mailto:${user.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </a>

              {/* Stats */}
              {user.stats && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{user.stats.contactsOwned} contacts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{user.stats.dealsOwned} deals</span>
                  </div>
                  {user.stats.totalDealValue > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{formatCurrency(user.stats.totalDealValue)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Last Active */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last active {formatRelativeTime(user.lastActiveAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {(onEdit || onDeactivate || onReactivate) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(user);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {user.isActive && onDeactivate && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeactivate(user);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                )}
                {!user.isActive && onReactivate && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactivate(user);
                    }}
                    className="text-emerald-600 focus:text-emerald-600"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UserCard;
