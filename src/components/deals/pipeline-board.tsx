"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealCard, DealCardData, DealCardOverlay } from "./deal-card";

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability?: number;
}

interface PipelineBoardProps {
  stages: Stage[];
  deals: DealCardData[];
  onDealMove: (dealId: Id<"deals">, newStageId: string) => Promise<void>;
  onDealClick?: (dealId: Id<"deals">) => void;
  onAddDeal?: (stageId: string) => void;
  isLoading?: boolean;
}

export function PipelineBoard({
  stages,
  deals,
  onDealMove,
  onDealClick,
  onAddDeal,
  isLoading = false,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);
  const [activeStageIndex, setActiveStageIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Use both pointer and touch sensors for mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Sort stages by order
  const sortedStages = React.useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages]
  );

  // Group deals by stage
  const dealsByStage = React.useMemo(() => {
    const grouped: Record<string, DealCardData[]> = {};
    sortedStages.forEach((stage) => {
      grouped[stage.id] = [];
    });
    deals.forEach((deal) => {
      if (grouped[deal.stageId]) {
        grouped[deal.stageId].push(deal);
      }
    });
    return grouped;
  }, [deals, sortedStages]);

  // Find the active deal for drag overlay
  const activeDeal = React.useMemo(
    () => deals.find((deal) => deal._id === activeId),
    [deals, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const dealId = active.id as Id<"deals">;
    const deal = deals.find((d) => d._id === dealId);

    if (!deal) return;

    // Determine the target stage
    let targetStageId: string | null = null;

    // Check if dropped on a stage column
    if (sortedStages.some((stage) => stage.id === over.id)) {
      targetStageId = over.id as string;
    } else {
      // Check if dropped on another deal - use that deal's stage
      const targetDeal = deals.find((d) => d._id === over.id);
      if (targetDeal) {
        targetStageId = targetDeal.stageId;
      }
    }

    // Only move if stage changed
    if (targetStageId && targetStageId !== deal.stageId) {
      await onDealMove(dealId, targetStageId);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Mobile stage navigation
  const canGoNext = activeStageIndex < sortedStages.length - 1;
  const canGoPrev = activeStageIndex > 0;

  const goToNextStage = () => {
    if (canGoNext) {
      setActiveStageIndex((prev) => prev + 1);
    }
  };

  const goToPrevStage = () => {
    if (canGoPrev) {
      setActiveStageIndex((prev) => prev - 1);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Mobile Stage Selector */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <button
          onClick={goToPrevStage}
          disabled={!canGoPrev}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            "touch-manipulation transition-colors",
            canGoPrev
              ? "bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              : "text-zinc-300 dark:text-zinc-600"
          )}
          aria-label="Previous stage"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: sortedStages[activeStageIndex]?.color }}
            />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {sortedStages[activeStageIndex]?.name}
            </span>
            <span className="text-sm text-zinc-500">
              ({dealsByStage[sortedStages[activeStageIndex]?.id]?.length || 0})
            </span>
          </div>
          {/* Stage dots indicator */}
          <div className="mt-2 flex justify-center gap-1.5">
            {sortedStages.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => setActiveStageIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all touch-manipulation",
                  index === activeStageIndex
                    ? "w-4 bg-zinc-900 dark:bg-zinc-100"
                    : "w-2 bg-zinc-300 dark:bg-zinc-600"
                )}
                aria-label={`Go to ${stage.name} stage`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={goToNextStage}
          disabled={!canGoNext}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            "touch-manipulation transition-colors",
            canGoNext
              ? "bg-zinc-100 text-zinc-700 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              : "text-zinc-300 dark:text-zinc-600"
          )}
          aria-label="Next stage"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Single Stage View */}
      <div className="md:hidden">
        {sortedStages[activeStageIndex] && (
          <StageColumn
            key={sortedStages[activeStageIndex].id}
            stage={sortedStages[activeStageIndex]}
            deals={dealsByStage[sortedStages[activeStageIndex].id] || []}
            onDealClick={onDealClick}
            onAddDeal={onAddDeal}
            isOver={overId === sortedStages[activeStageIndex].id}
            isLoading={isLoading}
            isMobile
          />
        )}
      </div>

      {/* Desktop Multi-Column View */}
      <div
        ref={scrollContainerRef}
        className="hidden h-full gap-4 overflow-x-auto pb-4 md:flex"
      >
        {sortedStages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            onDealClick={onDealClick}
            onAddDeal={onAddDeal}
            isOver={overId === stage.id}
            isLoading={isLoading}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface StageColumnProps {
  stage: Stage;
  deals: DealCardData[];
  onDealClick?: (dealId: Id<"deals">) => void;
  onAddDeal?: (stageId: string) => void;
  isOver?: boolean;
  isLoading?: boolean;
  isMobile?: boolean;
}

function StageColumn({
  stage,
  deals,
  onDealClick,
  onAddDeal,
  isOver,
  isLoading,
  isMobile = false,
}: StageColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: stage.id,
    data: {
      type: "stage",
      stageId: stage.id,
    },
  });

  // Calculate totals
  const dealCount = deals.length;
  const totalValue = deals.reduce(
    (sum, deal) => sum + (deal.amount || 0),
    0
  );

  const isHighlighted = isOver || isDroppableOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border bg-muted/30",
        "transition-all duration-200",
        isHighlighted && "ring-2 ring-primary/50 bg-primary/5",
        isMobile ? "w-full min-w-0" : "w-[300px] min-w-[300px]"
      )}
    >
      {/* Stage Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-sm">{stage.name}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {dealCount}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {totalValue > 0 && (
          <div className="text-sm font-medium text-muted-foreground">
            {formatCurrency(totalValue, "USD")}
          </div>
        )}
      </div>

      {/* Deals List */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext
          items={deals.map((d) => d._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {deals.map((deal) => (
              <DealCard
                key={deal._id}
                deal={deal}
                onClick={() => onDealClick?.(deal._id)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty State */}
        {deals.length === 0 && !isLoading && (
          <div
            className={cn(
              "flex items-center justify-center h-24 rounded-lg border-2 border-dashed",
              "text-sm text-muted-foreground",
              isHighlighted && "border-primary bg-primary/5"
            )}
          >
            {isHighlighted ? "Drop here" : "No deals"}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && deals.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Quick Add Button */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddDeal?.(stage.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add deal
        </Button>
      </div>
    </div>
  );
}

// Export a wrapped version with sample data for testing
export function PipelineBoardDemo() {
  const sampleStages: Stage[] = [
    { id: "lead", name: "Lead", color: "#6366f1", order: 0 },
    { id: "qualified", name: "Qualified", color: "#8b5cf6", order: 1 },
    { id: "proposal", name: "Proposal", color: "#a855f7", order: 2 },
    { id: "negotiation", name: "Negotiation", color: "#f59e0b", order: 3 },
    { id: "closed", name: "Closed Won", color: "#22c55e", order: 4 },
  ];

  const [deals, setDeals] = React.useState<DealCardData[]>([
    {
      _id: "deal1" as Id<"deals">,
      name: "Enterprise Software License",
      amount: 50000,
      currency: "USD",
      stageId: "lead",
      expectedCloseDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      company: {
        _id: "company1" as Id<"companies">,
        name: "Acme Corp",
      },
    },
    {
      _id: "deal2" as Id<"deals">,
      name: "Annual Support Contract",
      amount: 25000,
      currency: "USD",
      stageId: "qualified",
      company: {
        _id: "company2" as Id<"companies">,
        name: "TechStart Inc",
      },
    },
    {
      _id: "deal3" as Id<"deals">,
      name: "Platform Migration",
      amount: 75000,
      currency: "USD",
      stageId: "proposal",
      expectedCloseDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    {
      _id: "deal4" as Id<"deals">,
      name: "Custom Integration",
      amount: 15000,
      currency: "USD",
      stageId: "negotiation",
      company: {
        _id: "company3" as Id<"companies">,
        name: "Global Systems",
      },
    },
  ]);

  const handleDealMove = async (dealId: Id<"deals">, newStageId: string) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal._id === dealId ? { ...deal, stageId: newStageId } : deal
      )
    );
  };

  const handleDealClick = (dealId: Id<"deals">) => {
    console.log("Deal clicked:", dealId);
  };

  const handleAddDeal = (stageId: string) => {
    console.log("Add deal to stage:", stageId);
  };

  return (
    <div className="h-[600px] p-4">
      <PipelineBoard
        stages={sampleStages}
        deals={deals}
        onDealMove={handleDealMove}
        onDealClick={handleDealClick}
        onAddDeal={handleAddDeal}
      />
    </div>
  );
}
