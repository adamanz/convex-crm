"use client";

import { Suspense } from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Plus,
  LayoutGrid,
  List,
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  Loader2,
  ChevronDown,
  Filter,
  X,
  User,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineBoard } from "@/components/deals/pipeline-board";
import { DealForm, DealFormData } from "@/components/deals/deal-form";
import { DealCardData } from "@/components/deals/deal-card";
import { toast } from "sonner";

type DealStatus = "open" | "won" | "lost";

function DealsPageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsPageLoading />}>
      <DealsPageContent />
    </Suspense>
  );
}

function DealsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedPipelineId, setSelectedPipelineId] = useState<Id<"pipelines"> | null>(null);

  // Handle quick add from URL parameter
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsFormOpen(true);
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname]);

  // Quick filter states
  const [selectedOwnerId, setSelectedOwnerId] = useState<Id<"users"> | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DealStatus | null>(null);

  // Fetch pipelines
  const pipelines = useQuery(api.pipelines.list, {});
  const defaultPipeline = useQuery(api.pipelines.getDefault);

  // Fetch users for owner filter
  const users = useQuery(api.users.list, {});

  // Use selected pipeline or default
  const activePipelineId = selectedPipelineId || defaultPipeline?._id;
  const activePipeline = pipelines?.find((p) => p._id === activePipelineId) || defaultPipeline;

  // Fetch deals for the active pipeline with filters
  const dealsData = useQuery(
    api.deals.byPipeline,
    activePipelineId
      ? {
          pipelineId: activePipelineId,
          ownerId: selectedOwnerId ?? undefined,
          status: selectedStatus ?? undefined,
        }
      : "skip"
  );

  // Fetch pipeline stats
  const pipelineStats = useQuery(
    api.deals.getPipelineStats,
    activePipelineId ? { pipelineId: activePipelineId } : "skip"
  );

  // Fetch companies and contacts for the form
  const companiesData = useQuery(api.companies.list, {
    paginationOpts: { numItems: 100 },
  });
  const contactsData = useQuery(api.contacts.list, {
    paginationOpts: { numItems: 100 },
  });

  // Mutations
  const createDeal = useMutation(api.deals.create);
  const moveDeal = useMutation(api.deals.moveToStage);
  const markWon = useMutation(api.deals.markWon);
  const markLost = useMutation(api.deals.markLost);

  // Transform deals data for the board
  const deals: DealCardData[] = useMemo(() => {
    if (!dealsData?.dealsByStage) return [];

    const allDeals: DealCardData[] = [];
    for (const stageId of Object.keys(dealsData.dealsByStage)) {
      for (const deal of dealsData.dealsByStage[stageId]) {
        allDeals.push({
          _id: deal._id,
          name: deal.name,
          amount: deal.amount,
          currency: deal.currency,
          expectedCloseDate: deal.expectedCloseDate,
          stageId: deal.stageId,
          company: deal.company
            ? {
                _id: deal.company._id,
                name: deal.company.name,
                logoUrl: deal.company.logoUrl,
              }
            : null,
        });
      }
    }
    return allDeals;
  }, [dealsData]);

  const stages = useMemo(() => {
    return activePipeline?.stages || [];
  }, [activePipeline]);

  const companies = useMemo(() => {
    if (!companiesData?.page) return [];
    return companiesData.page.map((c) => ({
      _id: c._id,
      name: c.name,
      logoUrl: c.logoUrl,
    }));
  }, [companiesData]);

  const contacts = useMemo(() => {
    if (!contactsData?.page) return [];
    return contactsData.page.map((c) => ({
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
    }));
  }, [contactsData]);

  const teamMembers = useMemo(() => {
    if (!users) return [];
    return users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));
  }, [users]);

  const handleDealMove = async (dealId: Id<"deals">, newStageId: string) => {
    try {
      await moveDeal({ id: dealId, stageId: newStageId });
      toast.success("Deal moved successfully");
    } catch (error) {
      toast.error("Failed to move deal");
      console.error("Failed to move deal:", error);
    }
  };

  const handleDealClick = (dealId: Id<"deals">) => {
    router.push(`/deals/${dealId}`);
  };

  const handleAddDeal = (stageId?: string) => {
    if (stageId) {
      setSelectedStageId(stageId);
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: DealFormData) => {
    if (!activePipelineId) return;

    try {
      await createDeal({
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        companyId: data.companyId as Id<"companies"> | undefined,
        contactIds: data.contactIds as Id<"contacts">[],
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate).getTime()
          : undefined,
        stageId: data.stageId,
        pipelineId: activePipelineId,
        ownerId: data.ownerId as Id<"users"> | undefined,
      });
      toast.success("Deal created successfully");
      setIsFormOpen(false);
      setSelectedStageId(null);
    } catch (error) {
      toast.error("Failed to create deal");
      throw error;
    }
  };

  const handleMarkWon = async (dealId: Id<"deals">) => {
    try {
      await markWon({ id: dealId });
      toast.success("Deal marked as won!");
    } catch (error) {
      toast.error("Failed to update deal");
    }
  };

  const handleMarkLost = async (dealId: Id<"deals">) => {
    try {
      await markLost({ id: dealId });
      toast.success("Deal marked as lost");
    } catch (error) {
      toast.error("Failed to update deal");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedOwnerId(null);
    setSelectedStatus(null);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedOwnerId !== null || selectedStatus !== null;

  // Get selected owner name for display
  const selectedOwner = useMemo(() => {
    if (!selectedOwnerId || !users) return null;
    return users.find((u) => u._id === selectedOwnerId);
  }, [selectedOwnerId, users]);

  // Loading state
  const isLoading = pipelines === undefined || defaultPipeline === undefined;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No pipeline found
  if (!activePipeline) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <TrendingUp className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No pipeline found
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create a pipeline to start tracking deals
        </p>
        <Button onClick={() => router.push("/settings/pipelines")}>
          Create Pipeline
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Deals
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Pipeline Selector */}
          {pipelines && pipelines.length > 1 && (
            <Select
              value={activePipelineId || ""}
              onValueChange={(value) => setSelectedPipelineId(value as Id<"pipelines">)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline._id} value={pipeline._id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-zinc-100 p-1 dark:bg-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                view === "kanban" && "bg-white shadow-sm dark:bg-zinc-700"
              )}
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                view === "list" && "bg-white shadow-sm dark:bg-zinc-700"
              )}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Deal Button */}
          <Button onClick={() => handleAddDeal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Owner Filter */}
        <Select
          value={selectedOwnerId ?? "all"}
          onValueChange={(value) =>
            setSelectedOwnerId(value === "all" ? null : (value as Id<"users">))
          }
        >
          <SelectTrigger className="w-[180px]">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {users?.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.firstName || user.lastName
                  ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                  : user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={selectedStatus ?? "all"}
          onValueChange={(value) =>
            setSelectedStatus(value === "all" ? null : (value as DealStatus))
          }
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Open
              </div>
            </SelectItem>
            <SelectItem value="won">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Won
              </div>
            </SelectItem>
            <SelectItem value="lost">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Lost
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            {selectedOwner && (
              <Badge variant="secondary" className="gap-1">
                Owner: {selectedOwner.firstName ?? selectedOwner.email}
                <button
                  onClick={() => setSelectedOwnerId(null)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="secondary" className="gap-1">
                Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                <button
                  onClick={() => setSelectedStatus(null)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {deals.length} {deals.length === 1 ? "deal" : "deals"}
          {hasActiveFilters && " (filtered)"}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pipeline Value"
          value={formatCurrency(pipelineStats?.openValue ?? 0)}
          icon={DollarSign}
          description={`${pipelineStats?.openDeals ?? 0} open deals`}
        />
        <StatCard
          title="Weighted Value"
          value={formatCurrency(
            deals.reduce(
              (sum, deal) =>
                sum + (deal.amount ?? 0) * ((stages.find(s => s.id === deal.stageId)?.probability ?? 0) / 100),
              0
            )
          )}
          icon={Target}
          description="Probability adjusted"
        />
        <StatCard
          title="Won This Period"
          value={formatCurrency(pipelineStats?.wonValue ?? 0)}
          icon={TrendingUp}
          description={`${pipelineStats?.wonDeals ?? 0} deals won`}
          positive
        />
        <StatCard
          title="Win Rate"
          value={`${(pipelineStats?.winRate ?? 0).toFixed(1)}%`}
          icon={Percent}
          description="Based on closed deals"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
        {view === "kanban" ? (
          <div className="h-[calc(100vh-400px)] overflow-hidden p-4">
            <PipelineBoard
              stages={stages}
              deals={deals}
              onDealMove={handleDealMove}
              onDealClick={handleDealClick}
              onAddDeal={handleAddDeal}
              isLoading={dealsData === undefined}
            />
          </div>
        ) : (
          <DealsListView
            deals={deals}
            stages={stages}
            onDealClick={handleDealClick}
            onMarkWon={handleMarkWon}
            onMarkLost={handleMarkLost}
          />
        )}
      </div>

      {/* Deal Form Modal */}
      <DealForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={
          selectedStageId ? { stageId: selectedStageId } : { stageId: stages[0]?.id }
        }
        stages={stages}
        companies={companies}
        contacts={contacts}
        users={teamMembers}
        mode="create"
      />
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  positive?: boolean;
}

function StatCard({ title, value, icon: Icon, description, positive }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                positive && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {value}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {description}
            </p>
          </div>
          <div
            className={cn(
              "rounded-full p-2",
              positive
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 dark:text-zinc-400"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Deals List View Component
interface DealsListViewProps {
  deals: DealCardData[];
  stages: Array<{ id: string; name: string; color: string }>;
  onDealClick: (dealId: Id<"deals">) => void;
  onMarkWon: (dealId: Id<"deals">) => void;
  onMarkLost: (dealId: Id<"deals">) => void;
}

function DealsListView({
  deals,
  stages,
  onDealClick,
  onMarkWon,
  onMarkLost,
}: DealsListViewProps) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <TrendingUp className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No deals yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create your first deal to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Deal
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Stage
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Close Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {deals.map((deal) => {
            const stage = stages.find((s) => s.id === deal.stageId);
            return (
              <tr
                key={deal._id}
                className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                onClick={() => onDealClick(deal._id)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {deal.name}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {deal.company?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage?.color }}
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {stage?.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {deal.amount ? formatCurrency(deal.amount, deal.currency) : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkWon(deal._id);
                      }}
                    >
                      Won
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkLost(deal._id);
                      }}
                    >
                      Lost
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
