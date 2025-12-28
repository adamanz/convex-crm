"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Map,
  Plus,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  MapPin,
  Edit,
  Trash2,
  MoreHorizontal,
  Filter,
  Grid,
  List as ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "grid" | "list" | "map";

export default function TerritoriesPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Fetch data
  const territories = useQuery(api.territories.list, {});
  const regionStats = useQuery(api.territories.getStatsByRegion, {});
  const users = useQuery(api.users.list, {});

  // Mutations
  const createTerritory = useMutation(api.territories.create);
  const updateTerritory = useMutation(api.territories.update);
  const deleteTerritory = useMutation(api.territories.remove);

  // Filter territories by region
  const filteredTerritories = useMemo(() => {
    if (!territories) return [];
    if (selectedRegion === "all") return territories;

    return territories.filter((t) => {
      const regionRule = t.rules.find((r) => r.field === "region");
      return regionRule && regionRule.value === selectedRegion;
    });
  }, [territories, selectedRegion]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!territories) return null;

    return {
      totalTerritories: territories.length,
      totalContacts: territories.reduce((sum, t) => sum + t.assignedContacts, 0),
      totalCompanies: territories.reduce((sum, t) => sum + t.assignedCompanies, 0),
      totalValue: territories.reduce((sum, t) => sum + t.totalDealValue, 0),
    };
  }, [territories]);

  // Get unique regions
  const regions = useMemo(() => {
    if (!territories) return [];
    const uniqueRegions = new Set<string>();

    territories.forEach((t) => {
      const regionRule = t.rules.find((r) => r.field === "region");
      if (regionRule && regionRule.value) {
        uniqueRegions.add(String(regionRule.value));
      }
    });

    return Array.from(uniqueRegions).sort();
  }, [territories]);

  const handleCreateTerritory = async (data: any) => {
    try {
      await createTerritory(data);
      toast.success("Territory created successfully");
      setIsFormOpen(false);
    } catch (error) {
      toast.error("Failed to create territory");
      console.error(error);
    }
  };

  const handleUpdateTerritory = async (id: Id<"territories">, data: any) => {
    try {
      await updateTerritory({ id, ...data });
      toast.success("Territory updated successfully");
      setEditingTerritory(null);
      setIsFormOpen(false);
    } catch (error) {
      toast.error("Failed to update territory");
      console.error(error);
    }
  };

  const handleDeleteTerritory = async (id: Id<"territories">) => {
    if (!confirm("Are you sure you want to delete this territory?")) return;

    try {
      await deleteTerritory({ id });
      toast.success("Territory deleted successfully");
    } catch (error) {
      toast.error("Failed to delete territory");
      console.error(error);
    }
  };

  const openEditDialog = (territory: any) => {
    setEditingTerritory(territory);
    setIsFormOpen(true);
  };

  if (territories === undefined) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Territories
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage sales territories and rep assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-zinc-100 p-1 dark:bg-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                view === "grid" && "bg-white shadow-sm dark:bg-zinc-700"
              )}
              onClick={() => setView("grid")}
            >
              <Grid className="h-4 w-4" />
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
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                view === "map" && "bg-white shadow-sm dark:bg-zinc-700"
              )}
              onClick={() => setView("map")}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Territory Button */}
          <Button
            onClick={() => {
              setEditingTerritory(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Territory
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Territories"
            value={summaryStats.totalTerritories.toString()}
            icon={MapPin}
            description="Active territories"
          />
          <StatCard
            title="Total Companies"
            value={summaryStats.totalCompanies.toString()}
            icon={Building2}
            description="Assigned companies"
          />
          <StatCard
            title="Total Contacts"
            value={summaryStats.totalContacts.toString()}
            icon={Users}
            description="Assigned contacts"
          />
          <StatCard
            title="Total Pipeline Value"
            value={formatCurrency(summaryStats.totalValue)}
            icon={DollarSign}
            description="Across all territories"
            positive
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredTerritories.length} {filteredTerritories.length === 1 ? "territory" : "territories"}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {view === "grid" && (
          <TerritoryGridView
            territories={filteredTerritories}
            onEdit={openEditDialog}
            onDelete={handleDeleteTerritory}
          />
        )}
        {view === "list" && (
          <TerritoryListView
            territories={filteredTerritories}
            onEdit={openEditDialog}
            onDelete={handleDeleteTerritory}
          />
        )}
        {view === "map" && (
          <TerritoryMapView
            territories={filteredTerritories}
            regionStats={regionStats ?? []}
          />
        )}
      </div>

      {/* Territory Form Dialog */}
      <TerritoryFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTerritory(null);
        }}
        territory={editingTerritory}
        users={users ?? []}
        onCreate={handleCreateTerritory}
        onUpdate={handleUpdateTerritory}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  positive,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  positive?: boolean;
}) {
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

function TerritoryGridView({
  territories,
  onEdit,
  onDelete,
}: {
  territories: any[];
  onEdit: (territory: any) => void;
  onDelete: (id: Id<"territories">) => void;
}) {
  if (territories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <MapPin className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No territories yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create your first territory to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {territories.map((territory) => (
        <TerritoryCard
          key={territory._id}
          territory={territory}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function TerritoryCard({
  territory,
  onEdit,
  onDelete,
}: {
  territory: any;
  onEdit: (territory: any) => void;
  onDelete: (id: Id<"territories">) => void;
}) {
  const regionRule = territory.rules.find((r: any) => r.field === "region");
  const region = regionRule ? regionRule.value : "Unassigned";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg"
              style={{ backgroundColor: territory.color }}
            />
            <div>
              <CardTitle className="text-base">{territory.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{region}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(territory)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(territory._id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {territory.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {territory.description}
          </p>
        )}

        {territory.owner && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={territory.owner.avatarUrl} />
              <AvatarFallback className="text-xs">
                {territory.owner.firstName?.[0]}
                {territory.owner.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {territory.owner.firstName} {territory.owner.lastName}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {territory.assignedCompanies}
            </p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {territory.assignedContacts}
            </p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {territory.assignedDeals}
            </p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(territory.totalDealValue)}
          </p>
        </div>

        <Badge variant={territory.isActive ? "default" : "secondary"}>
          {territory.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardContent>
    </Card>
  );
}

function TerritoryListView({
  territories,
  onEdit,
  onDelete,
}: {
  territories: any[];
  onEdit: (territory: any) => void;
  onDelete: (id: Id<"territories">) => void;
}) {
  if (territories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <MapPin className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No territories yet
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create your first territory to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Territory
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Owner
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Companies
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Contacts
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Pipeline Value
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {territories.map((territory) => {
            const regionRule = territory.rules.find((r: any) => r.field === "region");
            const region = regionRule ? regionRule.value : "Unassigned";

            return (
              <tr
                key={territory._id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: territory.color }}
                    />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {territory.name}
                      </p>
                      {territory.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {territory.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {region}
                </td>
                <td className="px-4 py-3">
                  {territory.owner ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={territory.owner.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {territory.owner.firstName?.[0]}
                          {territory.owner.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {territory.owner.firstName} {territory.owner.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {territory.assignedCompanies}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {territory.assignedContacts}
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(territory.totalDealValue)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={territory.isActive ? "default" : "secondary"}>
                    {territory.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(territory)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(territory._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TerritoryMapView({
  territories,
  regionStats,
}: {
  territories: any[];
  regionStats: any[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Regional Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regionStats.map((stat) => (
              <div
                key={stat.region}
                className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{stat.region}</h4>
                  <Badge>{stat.territories} territories</Badge>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Companies</p>
                    <p className="text-xl font-semibold">{stat.totalCompanies}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                    <p className="text-xl font-semibold">{stat.totalContacts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deals</p>
                    <p className="text-xl font-semibold">{stat.totalDeals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pipeline Value</p>
                    <p className="text-xl font-semibold text-emerald-600">
                      {formatCurrency(stat.totalValue)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TerritoryFormDialog({
  open,
  onOpenChange,
  territory,
  users,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  territory: any;
  users: any[];
  onCreate: (data: any) => void;
  onUpdate: (id: Id<"territories">, data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    ownerId: "",
    region: "",
    isActive: true,
  });

  // Update form when territory changes
  useMemo(() => {
    if (territory) {
      const regionRule = territory.rules.find((r: any) => r.field === "region");
      setFormData({
        name: territory.name,
        description: territory.description || "",
        color: territory.color,
        ownerId: territory.ownerId || "",
        region: regionRule?.value || "",
        isActive: territory.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
        ownerId: "",
        region: "",
        isActive: true,
      });
    }
  }, [territory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rules = [];
    if (formData.region) {
      rules.push({
        id: "region-rule",
        field: "region" as const,
        operator: "equals" as const,
        value: formData.region,
      });
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      ownerId: formData.ownerId ? (formData.ownerId as Id<"users">) : undefined,
      rules,
      isActive: formData.isActive,
    };

    if (territory) {
      onUpdate(territory._id, data);
    } else {
      onCreate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {territory ? "Edit Territory" : "Create Territory"}
            </DialogTitle>
            <DialogDescription>
              {territory
                ? "Update territory details and assignments"
                : "Create a new sales territory"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Territory Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="North America"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  placeholder="West Coast"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner">Assigned Rep</Label>
              <Select
                value={formData.ownerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, ownerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No owner</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName || user.lastName
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {territory ? "Update" : "Create"} Territory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
