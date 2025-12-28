"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { DealCard, DealCardData } from "./DealCard";
import { StageColumn } from "./StageColumn";
import { formatCurrency } from "@/lib/utils";

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability?: number;
}

export interface DealWithRelations extends Doc<"deals"> {
  company: Doc<"companies"> | null;
  contacts: Doc<"contacts">[];
  owner?: Doc<"users"> | null;
}

interface PipelineBoardProps {
  pipelineId: Id<"pipelines">;
  stages: Stage[];
  dealsByStage: Record<string, DealWithRelations[]>;
  stageTotals: Record<string, { count: number; value: number }>;
  onDealClick?: (dealId: Id<"deals">) => void;
}

export function PipelineBoard({
  pipelineId,
  stages,
  dealsByStage,
  stageTotals,
  onDealClick,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null);

  const moveToStage = useMutation(api.deals.moveToStage);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const findDeal = useCallback(
    (dealId: string): DealWithRelations | null => {
      for (const stageId of Object.keys(dealsByStage)) {
        const deal = dealsByStage[stageId].find((d) => d._id === dealId);
        if (deal) return deal;
      }
      return null;
    },
    [dealsByStage]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);
      const deal = findDeal(active.id as string);
      setActiveDeal(deal);
    },
    [findDeal]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveDeal(null);

      if (!over) return;

      const dealId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on a stage column
      const isStageColumn = stages.some((s) => s.id === overId);

      if (isStageColumn) {
        const newStageId = overId;
        const deal = findDeal(dealId);

        if (deal && deal.stageId !== newStageId) {
          try {
            await moveToStage({
              id: deal._id,
              stageId: newStageId,
            });
          } catch (error) {
            console.error("Failed to move deal:", error);
          }
        }
      } else {
        // Dropped on another deal - find its stage
        const targetDeal = findDeal(overId);
        if (targetDeal) {
          const deal = findDeal(dealId);
          if (deal && deal.stageId !== targetDeal.stageId) {
            try {
              await moveToStage({
                id: deal._id,
                stageId: targetDeal.stageId,
              });
            } catch (error) {
              console.error("Failed to move deal:", error);
            }
          }
        }
      }
    },
    [findDeal, moveToStage, stages]
  );

  const transformDealForCard = (deal: DealWithRelations): DealCardData => ({
    id: deal._id,
    name: deal.name,
    amount: deal.amount,
    currency: deal.currency,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate,
    status: deal.status,
    companyName: deal.company?.name,
    contactCount: deal.contacts.length,
    tags: deal.tags,
    stageChangedAt: deal.stageChangedAt,
  });

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {sortedStages.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || [];
          const totals = stageTotals[stage.id] || { count: 0, value: 0 };

          return (
            <StageColumn
              key={stage.id}
              id={stage.id}
              name={stage.name}
              color={stage.color}
              count={totals.count}
              totalValue={totals.value}
            >
              <SortableContext
                items={stageDeals.map((d) => d._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal._id}
                      deal={transformDealForCard(deal)}
                      onClick={() => onDealClick?.(deal._id)}
                      isDragging={activeId === deal._id}
                    />
                  ))}
                </div>
              </SortableContext>
            </StageColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <DealCard
            deal={transformDealForCard(activeDeal)}
            isDragging
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
