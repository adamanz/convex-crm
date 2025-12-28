"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DashboardGrid } from "./DashboardGrid";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { AddWidgetDialog } from "./AddWidgetDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Settings,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Save,
  X,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardBuilderProps {
  dashboardId?: Id<"dashboards">;
  onDashboardChange?: (id: Id<"dashboards">) => void;
}

export function DashboardBuilder({ dashboardId, onDashboardChange }: DashboardBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<Id<"dashboardWidgets"> | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [isRenameDashboardOpen, setIsRenameDashboardOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");

  // Queries
  const dashboards = useQuery(api.dashboards.listDashboards);
  const currentDashboard = useQuery(
    api.dashboards.getDashboard,
    dashboardId ? { id: dashboardId } : "skip"
  );
  const defaultDashboard = useQuery(api.dashboards.getDefaultDashboard);

  // Mutations
  const createDashboard = useMutation(api.dashboards.createDashboard);
  const updateDashboard = useMutation(api.dashboards.updateDashboard);
  const deleteDashboard = useMutation(api.dashboards.deleteDashboard);
  const duplicateDashboard = useMutation(api.dashboards.duplicateDashboard);
  const updateLayout = useMutation(api.dashboards.updateLayout);
  const removeWidget = useMutation(api.dashboards.removeWidget);

  // Get the active dashboard (selected or default)
  const activeDashboard = dashboardId ? currentDashboard : defaultDashboard;
  const activeDashboardId = dashboardId ?? defaultDashboard?._id;

  // Handle layout changes from the grid
  const handleLayoutChange = useCallback(
    async (
      layout: Array<{
        widgetId: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>
    ) => {
      if (!activeDashboardId || !isEditing) return;

      try {
        await updateLayout({
          dashboardId: activeDashboardId,
          layout,
        });
      } catch (error) {
        console.error("Failed to update layout:", error);
        toast.error("Failed to save layout");
      }
    },
    [activeDashboardId, isEditing, updateLayout]
  );

  // Handle widget selection
  const handleWidgetSelect = (widgetId: Id<"dashboardWidgets"> | null) => {
    if (isEditing) {
      setSelectedWidgetId(widgetId);
    }
  };

  // Handle widget removal
  const handleRemoveWidget = async (widgetId: Id<"dashboardWidgets">) => {
    try {
      await removeWidget({ widgetId });
      if (selectedWidgetId === widgetId) {
        setSelectedWidgetId(null);
      }
      toast.success("Widget removed");
    } catch (error) {
      console.error("Failed to remove widget:", error);
      toast.error("Failed to remove widget");
    }
  };

  // Handle creating a new dashboard
  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast.error("Dashboard name is required");
      return;
    }

    try {
      const id = await createDashboard({
        name: newDashboardName,
        description: newDashboardDescription || undefined,
      });
      setIsCreateDashboardOpen(false);
      setNewDashboardName("");
      setNewDashboardDescription("");
      onDashboardChange?.(id);
      toast.success("Dashboard created");
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      toast.error("Failed to create dashboard");
    }
  };

  // Handle renaming dashboard
  const handleRenameDashboard = async () => {
    if (!activeDashboardId || !newDashboardName.trim()) return;

    try {
      await updateDashboard({
        id: activeDashboardId,
        name: newDashboardName,
        description: newDashboardDescription || undefined,
      });
      setIsRenameDashboardOpen(false);
      toast.success("Dashboard renamed");
    } catch (error) {
      console.error("Failed to rename dashboard:", error);
      toast.error("Failed to rename dashboard");
    }
  };

  // Handle duplicating dashboard
  const handleDuplicateDashboard = async () => {
    if (!activeDashboardId) return;

    try {
      const id = await duplicateDashboard({ id: activeDashboardId });
      onDashboardChange?.(id);
      toast.success("Dashboard duplicated");
    } catch (error) {
      console.error("Failed to duplicate dashboard:", error);
      toast.error("Failed to duplicate dashboard");
    }
  };

  // Handle deleting dashboard
  const handleDeleteDashboard = async () => {
    if (!activeDashboardId) return;

    try {
      await deleteDashboard({ id: activeDashboardId });
      onDashboardChange?.(undefined as unknown as Id<"dashboards">);
      toast.success("Dashboard deleted");
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      toast.error("Failed to delete dashboard");
    }
  };

  // Loading state
  if (dashboards === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-3 h-32" />
          <Skeleton className="col-span-3 h-32" />
          <Skeleton className="col-span-3 h-32" />
          <Skeleton className="col-span-3 h-32" />
          <Skeleton className="col-span-6 h-64" />
          <Skeleton className="col-span-6 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-4">
          {/* Dashboard Selector */}
          <Select
            value={activeDashboardId ?? ""}
            onValueChange={(value) =>
              onDashboardChange?.(value as Id<"dashboards">)
            }
          >
            <SelectTrigger className="w-[240px]">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <SelectValue placeholder="Select a dashboard" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((dashboard) => (
                <SelectItem key={dashboard._id} value={dashboard._id}>
                  <div className="flex items-center gap-2">
                    <span>{dashboard.name}</span>
                    {dashboard.isDefault && (
                      <span className="text-xs text-zinc-500">(Default)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dashboard Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  if (activeDashboard) {
                    setNewDashboardName(activeDashboard.name);
                    setNewDashboardDescription(activeDashboard.description ?? "");
                    setIsRenameDashboardOpen(true);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateDashboard}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteDashboard}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create New Dashboard */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDashboardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddWidgetOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedWidgetId(null);
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Done Editing
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Dashboard Grid */}
        <div className={`flex-1 overflow-auto ${selectedWidgetId && isEditing ? "pr-80" : ""}`}>
          {activeDashboard ? (
            <DashboardGrid
              dashboard={activeDashboard}
              isEditing={isEditing}
              selectedWidgetId={selectedWidgetId}
              onLayoutChange={handleLayoutChange}
              onWidgetSelect={handleWidgetSelect}
              onRemoveWidget={handleRemoveWidget}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LayoutDashboard className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                No Dashboard Selected
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Select a dashboard or create a new one to get started.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDashboardOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Widget Config Panel */}
        {selectedWidgetId && isEditing && activeDashboard && (
          <WidgetConfigPanel
            widgetId={selectedWidgetId}
            widget={activeDashboard.widgets.find((w) => w._id === selectedWidgetId)!}
            onClose={() => setSelectedWidgetId(null)}
          />
        )}
      </div>

      {/* Add Widget Dialog */}
      {activeDashboardId && (
        <AddWidgetDialog
          open={isAddWidgetOpen}
          onOpenChange={setIsAddWidgetOpen}
          dashboardId={activeDashboardId}
        />
      )}

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreateDashboardOpen} onOpenChange={setIsCreateDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Create a new custom dashboard to organize your widgets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Name</Label>
              <Input
                id="dashboard-name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="My Dashboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-description">Description (optional)</Label>
              <Input
                id="dashboard-description"
                value={newDashboardDescription}
                onChange={(e) => setNewDashboardDescription(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDashboardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dashboard Dialog */}
      <Dialog open={isRenameDashboardOpen} onOpenChange={setIsRenameDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
            <DialogDescription>
              Update the name and description of this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name">Name</Label>
              <Input
                id="rename-name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="My Dashboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rename-description">Description (optional)</Label>
              <Input
                id="rename-description"
                value={newDashboardDescription}
                onChange={(e) => setNewDashboardDescription(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDashboardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameDashboard}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
