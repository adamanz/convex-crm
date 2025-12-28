"use client";

import Link from "next/link";
import { User, GitBranch, Bell, Shield, Palette, ChevronRight, Users, Mail, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsCards: SettingsCard[] = [
  {
    title: "Profile",
    description: "Update your personal information, avatar, and account details",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Team",
    description: "Manage team members, roles, and permissions",
    href: "/settings/team",
    icon: Users,
  },
  {
    title: "Pipelines",
    description: "Configure sales pipelines, stages, and deal workflows",
    href: "/settings/pipelines",
    icon: GitBranch,
  },
  {
    title: "Email",
    description: "Configure email sending, templates, and tracking settings",
    href: "/settings/email",
    icon: Mail,
  },
  {
    title: "Products",
    description: "Manage product catalog and price books for quotes",
    href: "/settings/products",
    icon: Package,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="group h-full cursor-pointer transition-all hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1 dark:text-zinc-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-1 text-base">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <User className="h-4 w-4 text-zinc-500" />
            Update Profile
          </Link>
          <Link
            href="/settings/team"
            className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <Users className="h-4 w-4 text-zinc-500" />
            Manage Team
          </Link>
          <Link
            href="/settings/pipelines"
            className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <GitBranch className="h-4 w-4 text-zinc-500" />
            Manage Pipelines
          </Link>
          <Link
            href="/settings/email"
            className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <Mail className="h-4 w-4 text-zinc-500" />
            Configure Email
          </Link>
        </div>
      </div>
    </div>
  );
}
