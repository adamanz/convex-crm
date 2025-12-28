"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, GitBranch, Sparkles, Mail, ShieldCheck, CheckSquare, Lock, Webhook, Target, Filter, Package, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    label: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    label: "Pipelines",
    href: "/settings/pipelines",
    icon: GitBranch,
    description: "Configure sales pipelines and stages",
  },
  {
    label: "Goals & Quotas",
    href: "/settings/goals",
    icon: Target,
    description: "Set and track sales goals",
  },
  {
    label: "Smart Lists",
    href: "/settings/smart-lists",
    icon: Filter,
    description: "Create dynamic segments",
  },
  {
    label: "Products",
    href: "/settings/products",
    icon: Package,
    description: "Manage product catalog and price books",
  },
  {
    label: "Email",
    href: "/settings/email",
    icon: Mail,
    description: "Configure email sending and templates",
  },
  {
    label: "AI Settings",
    href: "/settings/ai",
    icon: Sparkles,
    description: "Configure AI-powered features",
  },
  {
    label: "Integrations",
    href: "/settings/integrations",
    icon: Plug,
    description: "Connect third-party services",
  },
  {
    label: "Approvals",
    href: "/settings/approvals",
    icon: CheckSquare,
    description: "Configure approval workflows",
  },
  {
    label: "Permissions",
    href: "/settings/permissions",
    icon: Lock,
    description: "Manage field-level access control",
  },
  {
    label: "Data Validation",
    href: "/settings/validation",
    icon: ShieldCheck,
    description: "Set up data quality rules",
  },
  {
    label: "Webhooks",
    href: "/settings/webhooks",
    icon: Webhook,
    description: "Configure outbound webhook subscriptions",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-6">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Settings
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your preferences
          </p>

          <nav className="space-y-1">
            {settingsNavItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-8">{children}</div>
      </main>
    </div>
  );
}
