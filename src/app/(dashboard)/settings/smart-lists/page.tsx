"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartListBuilder, SmartListCard } from "@/components/smartLists";
import { Plus, Users, Building2, Handshake, Filter } from "lucide-react";

type EntityType = "contact" | "company" | "deal";

export default function SmartListsSettingsPage() {
  const [activeTab, setActiveTab] = useState<EntityType>("contact");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();

  // Fetch smart lists for each entity type
  const contactLists = useQuery(api.smartLists.listSmartLists, {
    entityType: "contact",
  });
  const companyLists = useQuery(api.smartLists.listSmartLists, {
    entityType: "company",
  });
  const dealLists = useQuery(api.smartLists.listSmartLists, {
    entityType: "deal",
  });

  const getListsForTab = () => {
    switch (activeTab) {
      case "contact":
        return contactLists;
      case "company":
        return companyLists;
      case "deal":
        return dealLists;
      default:
        return [];
    }
  };

  const lists = getListsForTab();
  const isLoading = lists === undefined;

  const handleCreateNew = () => {
    setEditId(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setShowBuilder(true);
  };

  const handleView = (id: string) => {
    // Navigate to the entity list with the smart list filter applied
    const baseUrl = {
      contact: "/contacts",
      company: "/companies",
      deal: "/deals",
    }[activeTab];
    window.location.href = `${baseUrl}?smartList=${id}`;
  };

  const getTabCount = (type: EntityType) => {
    switch (type) {
      case "contact":
        return contactLists?.length ?? 0;
      case "company":
        return companyLists?.length ?? 0;
      case "deal":
        return dealLists?.length ?? 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Smart Lists"
        description="Create and manage dynamic segments for your contacts, companies, and deals"
        actions={
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Smart List
          </Button>
        }
      />

      {/* Entity Type Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as EntityType)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
            <span className="ml-1 text-xs text-muted-foreground">
              ({getTabCount("contact")})
            </span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Companies
            <span className="ml-1 text-xs text-muted-foreground">
              ({getTabCount("company")})
            </span>
          </TabsTrigger>
          <TabsTrigger value="deal" className="flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Deals
            <span className="ml-1 text-xs text-muted-foreground">
              ({getTabCount("deal")})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-6">
          <SmartListGrid
            lists={contactLists ?? []}
            isLoading={contactLists === undefined}
            entityType="contact"
            onEdit={handleEdit}
            onView={handleView}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <SmartListGrid
            lists={companyLists ?? []}
            isLoading={companyLists === undefined}
            entityType="company"
            onEdit={handleEdit}
            onView={handleView}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        <TabsContent value="deal" className="mt-6">
          <SmartListGrid
            lists={dealLists ?? []}
            isLoading={dealLists === undefined}
            entityType="deal"
            onEdit={handleEdit}
            onView={handleView}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>
      </Tabs>

      {/* Smart List Builder Dialog */}
      <SmartListBuilder
        open={showBuilder}
        onOpenChange={setShowBuilder}
        entityType={activeTab}
        editId={editId}
        onSuccess={() => {
          setShowBuilder(false);
          setEditId(undefined);
        }}
      />
    </div>
  );
}

// ============================================================================
// Smart List Grid Component
// ============================================================================

interface SmartListGridProps {
  lists: Array<{
    _id: string;
    name: string;
    description?: string;
    entityType: EntityType;
    filters: unknown[];
    cachedCount?: number;
    isPublic: boolean;
    lastRefreshedAt?: number;
    createdAt: number;
  }>;
  isLoading: boolean;
  entityType: EntityType;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onCreateNew: () => void;
}

function SmartListGrid({
  lists,
  isLoading,
  entityType,
  onEdit,
  onView,
  onCreateNew,
}: SmartListGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (lists.length === 0) {
    const entityLabel = {
      contact: "contacts",
      company: "companies",
      deal: "deals",
    }[entityType];

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">
          No smart lists for {entityLabel}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Create a smart list to automatically segment your {entityLabel} based
          on dynamic filter criteria.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create your first smart list
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <SmartListCard
          key={list._id}
          id={list._id}
          name={list.name}
          description={list.description}
          entityType={list.entityType as EntityType}
          filterCount={list.filters.length}
          cachedCount={list.cachedCount ?? 0}
          isPublic={list.isPublic}
          lastRefreshedAt={list.lastRefreshedAt}
          createdAt={list.createdAt}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}
