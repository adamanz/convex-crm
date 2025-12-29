"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Users,
  Building2,
  Handshake,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangeSelector, DateRange } from "@/components/analytics/DateRangeSelector";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  const isPositive = change && change >= 0;

  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? "text-green-500" : "text-red-500"}>
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span>{changeLabel}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Activity Item Component
function ActivityItem({
  type,
  subject,
  relatedName,
  time,
  completed,
}: {
  type: string;
  subject: string;
  relatedName: string;
  time: number;
  completed?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div
        className={`mt-1 h-2 w-2 rounded-full ${
          completed ? "bg-green-500" : "bg-blue-500"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{subject}</p>
        <p className="text-xs text-muted-foreground">
          {type} • {relatedName}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(time)}
      </span>
    </div>
  );
}

// Deal Card Component
function DealCard({
  name,
  company,
  amount,
  stage,
  stageColor,
}: {
  name: string;
  company?: string;
  amount?: number;
  stage: string;
  stageColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {company && (
          <p className="text-xs text-muted-foreground truncate">{company}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {amount !== undefined && (
          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
        )}
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: stageColor, color: stageColor }}
        >
          {stage}
        </Badge>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Fetch real data from Convex
  const contacts = useQuery(api.contacts.list, { paginationOpts: { numPage: 100 } }) || [];
  const companies = useQuery(api.companies.list, { paginationOpts: { numPage: 100 } }) || [];
  const deals = useQuery(api.deals.list, { paginationOpts: { numPage: 100 } }) || [];
  const activities = useQuery(api.activities.list, { paginationOpts: { numPage: 100 } }) || [];

  // Calculate real statistics
  const contactsCount = contacts?.page?.length || 0;
  const companiesCount = companies?.page?.length || 0;
  const openDealsCount = deals?.page?.filter((d: any) => d.stage !== "won" && d.stage !== "lost").length || 0;
  const activitiesCount = activities?.page?.length || 0;

  // Calculate pipeline value by stage
  const pipelineByStage = useMemo(() => {
    if (!deals?.page) return {};
    return (deals.page as any[]).reduce((acc: Record<string, number>, deal: any) => {
      const stage = deal.stage || "lead";
      acc[stage] = (acc[stage] || 0) + (deal.value || 0);
      return acc;
    }, {});
  }, [deals]);

  const totalPipelineValue = Object.values(pipelineByStage).reduce((sum: number, val: any) => sum + val, 0);

  const handleQuickAdd = (href: string) => {
    router.push(href);
    setIsQuickAddOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s an overview of your CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            showPresets={true}
            align="end"
          />
          <DropdownMenu open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickAdd("/contacts/new")}>
                <Users className="h-4 w-4 mr-2" />
                Add Contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("/companies/new")}>
                <Building2 className="h-4 w-4 mr-2" />
                Add Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("/deals/new")}>
                <Handshake className="h-4 w-4 mr-2" />
                Create Deal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAdd("/activities/new")}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Add Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={contactsCount}
          icon={Users}
          href="/contacts"
        />
        <StatCard
          title="Companies"
          value={companiesCount}
          icon={Building2}
          href="/companies"
        />
        <StatCard
          title="Open Deals"
          value={openDealsCount}
          icon={Handshake}
          href="/deals"
        />
        <StatCard
          title="Activities"
          value={activitiesCount}
          icon={MessageSquare}
          href="/activities"
        />
      </div>

      {/* Pipeline Value Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold">{formatCurrency(totalPipelineValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Total value across all stages
                </p>
              </div>
              <div className="space-y-2">
                {Object.entries(pipelineByStage).map(([stage, value]) => (
                  <div key={stage} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{stage}</span>
                    <span className="font-medium">{formatCurrency(value as number)}</span>
                  </div>
                ))}
              </div>
              <Link href="/deals">
                <Button variant="outline" size="sm" className="w-full">
                  View Pipeline
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Recent Activity
            </CardTitle>
            <Link href="/activities">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {activities?.page && activities.page.length > 0 ? (
                activities.page.slice(0, 5).map((activity: any) => (
                  <ActivityItem
                    key={activity._id}
                    type={activity.type || "Activity"}
                    subject={activity.subject || "No subject"}
                    relatedName={activity.relatedTo || ""}
                    time={activity._creationTime || Date.now()}
                    completed={activity.completed}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4">No activities yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals and Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Recent Deals
            </CardTitle>
            <Link href="/deals">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {deals?.page && deals.page.length > 0 ? (
                deals.page.slice(0, 4).map((deal: any) => (
                  <DealCard
                    key={deal._id}
                    name={deal.name || "Untitled Deal"}
                    company={deal.company?.name}
                    amount={deal.value}
                    stage={deal.stage || "lead"}
                    stageColor="#6B7280"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4">No deals yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              Upcoming Tasks
            </CardTitle>
            <Link href="/activities">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities?.page && activities.page.length > 0 ? (
                activities.page
                  .filter((act: any) => act.type === "Task" && !act.completed)
                  .slice(0, 4)
                  .map((task: any) => (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                    >
                      <button className="h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.subject || "Task"}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(task._creationTime)}</p>
                      </div>
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {task.priority || "medium"}
                      </Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground py-4">No pending tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/contacts/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Users className="h-5 w-5 mb-2" />
                <span className="text-sm">Add Contact</span>
              </Button>
            </Link>
            <Link href="/companies/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Building2 className="h-5 w-5 mb-2" />
                <span className="text-sm">Add Company</span>
              </Button>
            </Link>
            <Link href="/deals/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Handshake className="h-5 w-5 mb-2" />
                <span className="text-sm">Create Deal</span>
              </Button>
            </Link>
            <Link href="/activities/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <CheckCircle2 className="h-5 w-5 mb-2" />
                <span className="text-sm">Add Task</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
