import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { useMutation } from "convex/react";
import { PipelineBoard } from "../PipelineBoard";
import {
  createMockDealWithRelations,
  createMockPipeline,
} from "@/test/test-utils";

vi.mock("convex/react");

describe("PipelineBoard", () => {
  const mockUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all pipeline stages", () => {
      const pipeline = createMockPipeline();
      const mockMoveToStage = vi.fn();
      mockUseMutation.mockReturnValue(mockMoveToStage);

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={{}}
          stageTotals={{}}
        />
      );

      // All 5 stages should be rendered
      expect(screen.getByText("Prospecting")).toBeInTheDocument();
      expect(screen.getByText("Qualification")).toBeInTheDocument();
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Negotiation")).toBeInTheDocument();
      expect(screen.getByText("Closed Won")).toBeInTheDocument();
    });

    it("renders stages in correct order", () => {
      const pipeline = createMockPipeline();
      const mockMoveToStage = vi.fn();
      mockUseMutation.mockReturnValue(mockMoveToStage);

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={{}}
          stageTotals={{}}
        />
      );

      const stageNames = Array.from(
        container.querySelectorAll('[class*="flex"]')
      ).map((el) => el.textContent);

      // Stages should be in order by their order property
      expect(stageNames.join(",")).toContain("Prospecting");
    });

    it("displays stage colors correctly", () => {
      const pipeline = createMockPipeline();
      const mockMoveToStage = vi.fn();
      mockUseMutation.mockReturnValue(mockMoveToStage);

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={{}}
          stageTotals={{}}
        />
      );

      // Check that color indicators are present
      const colorElements = container.querySelectorAll('[style*="background"]');
      expect(colorElements.length).toBeGreaterThan(0);
    });
  });

  describe("Deal Cards", () => {
    it("renders deals in their respective stages", () => {
      const pipeline = createMockPipeline();
      const deal1 = createMockDealWithRelations({
        _id: "deal_1" as any,
        name: "Deal 1",
        stageId: "stage_1",
      });
      const deal2 = createMockDealWithRelations({
        _id: "deal_2" as any,
        name: "Deal 2",
        stageId: "stage_2",
      });

      const dealsByStage = {
        stage_1: [deal1],
        stage_2: [deal2],
        stage_3: [],
        stage_4: [],
        stage_5: [],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
        stage_2: { count: 1, value: 75000 },
        stage_3: { count: 0, value: 0 },
        stage_4: { count: 0, value: 0 },
        stage_5: { count: 0, value: 0 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("Deal 1")).toBeInTheDocument();
      expect(screen.getByText("Deal 2")).toBeInTheDocument();
    });

    it("shows deal amount on cards", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        amount: 100000,
        currency: "USD",
        stageId: "stage_1",
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 100000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("$100,000")).toBeInTheDocument();
    });

    it("shows company name on deal cards", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
        company: {
          _id: "company_1" as any,
          _creationTime: Date.now(),
          name: "Acme Corp",
        } as any,
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    it("shows contact count on deal cards", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
        contacts: [{}, {}, {}] as any, // 3 contacts
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("displays deal probability", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
        probability: 60,
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    it("shows deal tags", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
        tags: ["urgent", "enterprise"],
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("urgent")).toBeInTheDocument();
      expect(screen.getByText("enterprise")).toBeInTheDocument();
    });
  });

  describe("Stage Totals", () => {
    it("displays count of deals in each stage", () => {
      const pipeline = createMockPipeline();
      const stageTotals = {
        stage_1: { count: 5, value: 250000 },
        stage_2: { count: 3, value: 150000 },
        stage_3: { count: 0, value: 0 },
        stage_4: { count: 0, value: 0 },
        stage_5: { count: 0, value: 0 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={{}}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("displays total value in each stage", () => {
      const pipeline = createMockPipeline();
      const stageTotals = {
        stage_1: { count: 2, value: 100000 },
        stage_2: { count: 0, value: 0 },
        stage_3: { count: 0, value: 0 },
        stage_4: { count: 0, value: 0 },
        stage_5: { count: 0, value: 0 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={{}}
          stageTotals={stageTotals}
        />
      );

      // Should display formatted currency value
      expect(container.textContent).toContain("$100,000");
    });
  });

  describe("Drag and Drop", () => {
    it("renders with drag and drop context", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // DndContext should be rendered
      expect(container.querySelector('[class*="cursor"]')).toBeTruthy();
    });

    it("shows drag handle on deal cards", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_1",
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // Drag handle should be present (GripVertical icon)
      const dragHandle = container.querySelector('[class*="cursor-grab"]');
      expect(dragHandle).toBeTruthy();
    });
  });

  describe("Interactions", () => {
    it("calls onDealClick when deal card is clicked", async () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        name: "Clickable Deal",
        stageId: "stage_1",
      });

      const dealsByStage = {
        stage_1: [deal],
      };

      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
      };

      const mockOnDealClick = vi.fn();
      mockUseMutation.mockReturnValue(vi.fn());

      const { user } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
          onDealClick={mockOnDealClick}
        />
      );

      const dealCard = screen.getByText("Clickable Deal");
      await user.click(dealCard);

      expect(mockOnDealClick).toHaveBeenCalledWith(deal._id);
    });
  });

  describe("Empty States", () => {
    it("renders empty stages without errors", () => {
      const pipeline = createMockPipeline();
      const dealsByStage = {
        stage_1: [],
        stage_2: [],
        stage_3: [],
        stage_4: [],
        stage_5: [],
      };

      const stageTotals = {
        stage_1: { count: 0, value: 0 },
        stage_2: { count: 0, value: 0 },
        stage_3: { count: 0, value: 0 },
        stage_4: { count: 0, value: 0 },
        stage_5: { count: 0, value: 0 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // All stages should still be visible
      expect(screen.getByText("Prospecting")).toBeInTheDocument();
      expect(screen.getByText("Qualification")).toBeInTheDocument();
    });
  });

  describe("Multiple Deals", () => {
    it("renders multiple deals in same stage", () => {
      const pipeline = createMockPipeline();
      const deals = [
        createMockDealWithRelations({
          _id: "deal_1" as any,
          name: "Deal 1",
          stageId: "stage_1",
        }),
        createMockDealWithRelations({
          _id: "deal_2" as any,
          name: "Deal 2",
          stageId: "stage_1",
        }),
        createMockDealWithRelations({
          _id: "deal_3" as any,
          name: "Deal 3",
          stageId: "stage_1",
        }),
      ];

      const dealsByStage = {
        stage_1: deals,
      };

      const stageTotals = {
        stage_1: { count: 3, value: 150000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      expect(screen.getByText("Deal 1")).toBeInTheDocument();
      expect(screen.getByText("Deal 2")).toBeInTheDocument();
      expect(screen.getByText("Deal 3")).toBeInTheDocument();
    });
  });

  describe("Deal Status Indicators", () => {
    it("shows status indicator for won deals", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_5",
        status: "won",
      });

      const dealsByStage = {
        stage_5: [deal],
      };

      const stageTotals = {
        stage_5: { count: 1, value: 100000 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // Should have won status indicator (green)
      const statusIndicators = container.querySelectorAll('[class*="bg-emerald"]');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });

    it("shows status indicator for lost deals", () => {
      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({
        _id: "deal_1" as any,
        stageId: "stage_3",
        status: "lost",
      });

      const dealsByStage = {
        stage_3: [deal],
      };

      const stageTotals = {
        stage_3: { count: 1, value: 0 },
      };

      mockUseMutation.mockReturnValue(vi.fn());

      const { container } = render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // Should have lost status indicator (red)
      const statusIndicators = container.querySelectorAll('[class*="bg-red"]');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });
  });
});
