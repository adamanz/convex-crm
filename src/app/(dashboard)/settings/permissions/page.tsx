"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ArrowLeft, Shield, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionMatrix } from "@/components/permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PermissionsSettingsPage() {
  // Fetch team stats for context
  const teamStats = useQuery(api.users.getTeamStats, {});

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
              Field Permissions
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Control which fields each role can view and edit
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Field permissions control what data each role can access. Changes are applied
                immediately after saving and affect all users with that role.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <CardTitle className="text-base">Admin</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full access to all fields by default. Can manage permissions for other roles.
            </p>
            {teamStats && (
              <p className="text-sm font-medium mt-2">
                {teamStats.admins} user{teamStats.admins !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-base">Manager</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Write access to most fields by default. Can be customized per field.
            </p>
            {teamStats && (
              <p className="text-sm font-medium mt-2">
                {teamStats.managers} user{teamStats.managers !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Shield className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
              </div>
              <CardTitle className="text-base">Member</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Read-only access by default. Permissions must be explicitly granted.
            </p>
            {teamStats && (
              <p className="text-sm font-medium mt-2">
                {teamStats.members} user{teamStats.members !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permission Matrix */}
      <PermissionMatrix />
    </div>
  );
}
