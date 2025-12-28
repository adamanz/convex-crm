"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { PipelineBoard } from "./pipeline-board";
import { DealForm, DealFormData } from "./deal-form";
import { DealCardData } from "./deal-card";
import { toast } from "sonner";

export function DealsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedStageId, setSelectedStageId] = React.useState<string | null>(
    null
  );
  const [selectedDealId, setSelectedDealId] = React.useState<Id<"deals"> | null>(
    null
  );

  // Fetch pipelines - use default
  const defaultPipeline = useQuery(api.pipelines.getDefault);

  // Fetch deals for the pipeline
  const dealsData = useQuery(
    api.deals.byPipeline,
    defaultPipeline?._id ? { pipelineId: defaultPipeline._id } : "skip"
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
  const updateStage = useMutation(api.deals.moveToStage);

  // Transform deals data for the board
  const deals: DealCardData[] = React.useMemo(() => {
    if (!dealsData?.dealsByStage) return [];
    // Flatten all deals from dealsByStage object
    const allDeals = Object.values(dealsData.dealsByStage).flat();
    return allDeals.map((deal) => ({
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
    }));
  }, [dealsData]);

  const stages = React.useMemo(() => {
    if (!defaultPipeline?.stages) return [];
    return defaultPipeline.stages;
  }, [defaultPipeline]);

  const companies = React.useMemo(() => {
    if (!companiesData?.page) return [];
    return companiesData.page.map((c) => ({
      _id: c._id,
      name: c.name,
      logoUrl: c.logoUrl,
    }));
  }, [companiesData]);

  const contacts = React.useMemo(() => {
    if (!contactsData?.page) return [];
    return contactsData.page.map((c) => ({
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
    }));
  }, [contactsData]);

  const handleDealMove = async (dealId: Id<"deals">, newStageId: string) => {
    try {
      await updateStage({ id: dealId, stageId: newStageId });
      toast.success("Deal moved successfully");
    } catch (error) {
      toast.error("Failed to move deal");
      console.error("Failed to move deal:", error);
    }
  };

  const handleDealClick = (dealId: Id<"deals">) => {
    setSelectedDealId(dealId);
    // Could open a deal detail panel/modal here
    console.log("Deal clicked:", dealId);
  };

  const handleAddDeal = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: DealFormData) => {
    if (!defaultPipeline?._id) return;

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
        pipelineId: defaultPipeline._id,
      });
      toast.success("Deal created successfully");
    } catch (error) {
      toast.error("Failed to create deal");
      throw error;
    }
  };

  // Loading state
  if (defaultPipeline === undefined || dealsData === undefined) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No pipeline found
  if (!defaultPipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <p className="text-muted-foreground">No pipeline found.</p>
        <p className="text-sm text-muted-foreground">
          Please create a pipeline first or seed the default data.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">{defaultPipeline.name}</h1>
          {defaultPipeline.description && (
            <p className="text-sm text-muted-foreground">
              {defaultPipeline.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {deals.length} deals
          </span>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-hidden p-4">
        <PipelineBoard
          stages={stages}
          deals={deals}
          onDealMove={handleDealMove}
          onDealClick={handleDealClick}
          onAddDeal={handleAddDeal}
          isLoading={dealsData === undefined}
        />
      </div>

      {/* Deal Form Modal */}
      <DealForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedStageId ? { stageId: selectedStageId } : undefined}
        stages={stages}
        companies={companies}
        contacts={contacts}
        mode="create"
      />
    </div>
  );
}
