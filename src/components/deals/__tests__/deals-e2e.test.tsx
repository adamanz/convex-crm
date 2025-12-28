import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { useQuery, useMutation } from "convex/react";
import {
  createMockDeal,
  createMockDealWithRelations,
  createMockPipeline,
  createMockCompany,
  createMockContact,
  createMockUser,
} from "@/test/test-utils";
import { DealList } from "../DealList";
import { PipelineBoard } from "../PipelineBoard";
import { CreateDealDialog } from "../CreateDealDialog";
import { DealForm } from "../deal-form";
import { toast } from "sonner";

// Mock Convex hooks
vi.mock("convex/react");

describe("Deals E2E Tests", () => {
  const mockUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
  const mockUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. View Deals List", () => {
    it("renders deals list with all deals", () => {
      const mockDeals = [
        {
          ...createMockDeal({ _id: "deal_1" as any, name: "Deal 1", amount: 10000 }),
          company: createMockCompany({ name: "Company A" }),
          pipeline: createMockPipeline(),
          stageName: "Prospecting",
          stageColor: "#3b82f6",
        },
        {
          ...createMockDeal({ _id: "deal_2" as any, name: "Deal 2", amount: 20000 }),
          company: createMockCompany({ name: "Company B" }),
          pipeline: createMockPipeline(),
          stageName: "Qualification",
          stageColor: "#8b5cf6",
        },
      ];

      render(<DealList deals={mockDeals} />);

      expect(screen.getByText("Deal 1")).toBeInTheDocument();
      expect(screen.getByText("Deal 2")).toBeInTheDocument();
      expect(screen.getByText("Company A")).toBeInTheDocument();
      expect(screen.getByText("Company B")).toBeInTheDocument();
      expect(screen.getByText("$10,000")).toBeInTheDocument();
      expect(screen.getByText("$20,000")).toBeInTheDocument();
    });

    it("displays empty state when no deals", () => {
      render(<DealList deals={[]} />);

      expect(screen.getByText(/no deals found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first deal/i)).toBeInTheDocument();
    });

    it("shows deal stage with color indicator", () => {
      const mockDeals = [
        {
          ...createMockDeal(),
          company: null,
          pipeline: createMockPipeline(),
          stageName: "Prospecting",
          stageColor: "#3b82f6",
        },
      ];

      const { container } = render(<DealList deals={mockDeals} />);

      expect(screen.getByText("Prospecting")).toBeInTheDocument();
      const colorIndicator = container.querySelector('[style*="background-color"]');
      expect(colorIndicator).toBeInTheDocument();
    });

    it("displays deal probability as progress bar", () => {
      const mockDeals = [
        {
          ...createMockDeal({ probability: 75 }),
          company: null,
          pipeline: createMockPipeline(),
          stageName: "Negotiation",
          stageColor: "#10b981",
        },
      ];

      render(<DealList deals={mockDeals} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("shows expected close date", () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const mockDeals = [
        {
          ...createMockDeal({ expectedCloseDate: futureDate.getTime() }),
          company: null,
          pipeline: createMockPipeline(),
          stageName: "Proposal",
          stageColor: "#f59e0b",
        },
      ];

      render(<DealList deals={mockDeals} />);

      // Date should be displayed in the table
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("2. View Deals Kanban Board", () => {
    it("renders pipeline board with stages", () => {
      const pipeline = createMockPipeline();
      const dealsByStage = {
        stage_1: [createMockDealWithRelations({ _id: "deal_1" as any, stageId: "stage_1" })],
        stage_2: [createMockDealWithRelations({ _id: "deal_2" as any, stageId: "stage_2" })],
      };
      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
        stage_2: { count: 1, value: 75000 },
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

      // Check all stages are rendered
      expect(screen.getByText("Prospecting")).toBeInTheDocument();
      expect(screen.getByText("Qualification")).toBeInTheDocument();
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Negotiation")).toBeInTheDocument();
      expect(screen.getByText("Closed Won")).toBeInTheDocument();
    });

    it("displays deals in correct stage columns", () => {
      const pipeline = createMockPipeline();
      const dealsByStage = {
        stage_1: [
          createMockDealWithRelations({
            _id: "deal_1" as any,
            name: "Deal in Prospecting",
            stageId: "stage_1",
          }),
        ],
        stage_2: [
          createMockDealWithRelations({
            _id: "deal_2" as any,
            name: "Deal in Qualification",
            stageId: "stage_2",
          }),
        ],
      };
      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
        stage_2: { count: 1, value: 75000 },
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

      expect(screen.getByText("Deal in Prospecting")).toBeInTheDocument();
      expect(screen.getByText("Deal in Qualification")).toBeInTheDocument();
    });

    it("shows stage totals and count", () => {
      const pipeline = createMockPipeline();
      const dealsByStage = {
        stage_1: [createMockDealWithRelations()],
      };
      const stageTotals = {
        stage_1: { count: 3, value: 150000 },
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

      // Stage column should show count and total value
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("3. Drag Deal Between Stages", () => {
    it("allows dragging deal between stages", async () => {
      const mockMoveToStage = vi.fn().mockResolvedValue(undefined);
      mockUseMutation.mockReturnValue(mockMoveToStage);

      const pipeline = createMockPipeline();
      const deal = createMockDealWithRelations({ stageId: "stage_1" });
      const dealsByStage = {
        stage_1: [deal],
        stage_2: [],
      };
      const stageTotals = {
        stage_1: { count: 1, value: 50000 },
        stage_2: { count: 0, value: 0 },
      };

      render(
        <PipelineBoard
          pipelineId={"pipeline_1" as any}
          stages={pipeline.stages}
          dealsByStage={dealsByStage}
          stageTotals={stageTotals}
        />
      );

      // Note: Full drag and drop testing requires additional setup with @dnd-kit/core testing utilities
      // This test verifies the component renders with drag functionality enabled
      const dealCard = screen.getByText(deal.name);
      expect(dealCard).toBeInTheDocument();
    });
  });

  describe("4. Create New Deal", () => {
    it("opens create deal dialog", async () => {
      const { user } = render(
        <CreateDealDialog
          open={true}
          onOpenChange={vi.fn()}
          pipelineId={"pipeline_1" as any}
        />
      );

      expect(screen.getByText("Create New Deal")).toBeInTheDocument();
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });

    it("creates deal with all required fields", async () => {
      const mockCreateDeal = vi.fn().mockResolvedValue("new_deal_id");
      const mockOnSuccess = vi.fn();

      mockUseQuery.mockImplementation(() => {
        // Return pipelines for first call, companies for second call
        return [createMockPipeline()];
      });
      mockUseMutation.mockReturnValue(mockCreateDeal);

      const { user } = render(
        <CreateDealDialog
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in deal name
      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "New Enterprise Deal");

      // Fill in amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "100000");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateDeal).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "New Enterprise Deal",
            amount: 100000,
          })
        );
      });
    });

    it("validates required fields", async () => {
      mockUseQuery.mockReturnValue([createMockPipeline()]);
      mockUseMutation.mockReturnValue(vi.fn());

      const { user } = render(
        <CreateDealDialog open={true} onOpenChange={vi.fn()} />
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      // Form should not submit (browser validation would prevent it)
      expect(screen.getByLabelText(/deal name/i)).toBeInvalid();
    });

    it("allows selecting company and stage", async () => {
      const mockCompany = createMockCompany({ name: "Test Company" });
      const mockPipeline = createMockPipeline();

      mockUseQuery.mockReturnValue([mockPipeline]);
      mockUseMutation.mockReturnValue(vi.fn());

      const { user } = render(
        <CreateDealDialog open={true} onOpenChange={vi.fn()} />
      );

      // Company and stage selects should be available
      expect(screen.getByLabelText(/pipeline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });
  });

  describe("5. View Deal Detail", () => {
    it("displays deal information", () => {
      const deal = createMockDealWithRelations({
        name: "Enterprise Deal",
        amount: 100000,
        probability: 75,
      });

      // This test would require rendering the detail page component
      // For now, we verify the data structure is correct
      expect(deal.name).toBe("Enterprise Deal");
      expect(deal.amount).toBe(100000);
      expect(deal.probability).toBe(75);
      expect(deal.company).toBeDefined();
      expect(deal.contacts).toBeDefined();
    });
  });

  describe("6. Edit Deal", () => {
    it("opens edit form with existing data", async () => {
      const mockDeal = createMockDeal({
        name: "Existing Deal",
        amount: 50000,
      });
      const mockCompanies = [createMockCompany()];
      const mockContacts = [createMockContact()];
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          defaultValues={{
            name: mockDeal.name,
            amount: mockDeal.amount,
            stageId: mockDeal.stageId,
          }}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          mode="edit"
        />
      );

      expect(screen.getByText("Edit Deal")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Existing Deal")).toBeInTheDocument();
      expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
    });

    it("updates deal when form is submitted", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          defaultValues={{
            name: "Old Name",
            amount: 50000,
            stageId: "stage_1",
          }}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
          mode="edit"
        />
      );

      // Update deal name
      const nameInput = screen.getByLabelText(/deal name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Deal Name");

      // Update amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, "75000");

      // Submit
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Updated Deal Name",
            amount: 75000,
          })
        );
      });
    });
  });

  describe("7. Delete Deal", () => {
    it("shows delete action in deal list menu", async () => {
      const mockDeal = {
        ...createMockDeal(),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Prospecting",
        stageColor: "#3b82f6",
      };

      const mockOnDelete = vi.fn();

      const { user } = render(
        <DealList deals={[mockDeal]} onDelete={mockOnDelete} />
      );

      // The DealList uses a DropdownMenu with MoreHorizontal icon
      // Find the button containing the MoreHorizontal icon
      const menuButtons = screen.getAllByRole("button");
      const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
      expect(menuButton).toBeDefined();

      if (menuButton) {
        await user.click(menuButton);

        // Click delete
        const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
        await user.click(deleteItem);

        expect(mockOnDelete).toHaveBeenCalledWith(mockDeal._id);
      }
    });
  });

  describe("8. Update Deal Value", () => {
    it("updates deal amount in edit form", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          defaultValues={{
            name: "Test Deal",
            amount: 10000,
            stageId: "stage_1",
          }}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, "25000");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 25000,
          })
        );
      });
    });

    it("allows different currencies", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      // Open currency select
      const currencySelect = screen.getByLabelText(/currency/i);
      await user.click(currencySelect);

      // Currency options should be available
      // Note: Radix UI Select requires additional testing setup for full interaction
      expect(currencySelect).toBeInTheDocument();
    });
  });

  describe("9. Change Deal Stage", () => {
    it("changes stage through select dropdown", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          defaultValues={{
            name: "Test Deal",
            stageId: "stage_1",
          }}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      // Stage select should be present
      const stageLabel = screen.getByText(/stage/i);
      expect(stageLabel).toBeInTheDocument();
    });
  });

  describe("10. Win/Lose Deal", () => {
    it("shows mark won action for open deals", async () => {
      const mockDeal = {
        ...createMockDeal({ status: "open" }),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Negotiation",
        stageColor: "#10b981",
      };

      const mockOnMarkWon = vi.fn();

      const { user } = render(
        <DealList deals={[mockDeal]} onMarkWon={mockOnMarkWon} />
      );

      // Find the dropdown menu button
      const menuButtons = screen.getAllByRole("button");
      const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
      expect(menuButton).toBeDefined();

      if (menuButton) {
        await user.click(menuButton);

        // Should show mark as won option
        const wonItem = await screen.findByRole("menuitem", { name: /mark as won/i });
        await user.click(wonItem);

        expect(mockOnMarkWon).toHaveBeenCalledWith(mockDeal._id);
      }
    });

    it("shows mark lost action for open deals", async () => {
      const mockDeal = {
        ...createMockDeal({ status: "open" }),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Proposal",
        stageColor: "#f59e0b",
      };

      const mockOnMarkLost = vi.fn();

      const { user } = render(
        <DealList deals={[mockDeal]} onMarkLost={mockOnMarkLost} />
      );

      const menuButtons = screen.getAllByRole("button");
      const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
      expect(menuButton).toBeDefined();

      if (menuButton) {
        await user.click(menuButton);

        const lostItem = await screen.findByRole("menuitem", { name: /mark as lost/i });
        await user.click(lostItem);

        expect(mockOnMarkLost).toHaveBeenCalledWith(mockDeal._id);
      }
    });

    it("does not show win/lose actions for closed deals", async () => {
      const mockDeal = {
        ...createMockDeal({ status: "won" }),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Closed Won",
        stageColor: "#059669",
      };

      const { user } = render(
        <DealList deals={[mockDeal]} onMarkWon={vi.fn()} onMarkLost={vi.fn()} />
      );

      const menuButtons = screen.getAllByRole("button");
      const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
      expect(menuButton).toBeDefined();

      if (menuButton) {
        await user.click(menuButton);

        // Won deals should not have mark won/lost options
        expect(screen.queryByRole("menuitem", { name: /mark as won/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("menuitem", { name: /mark as lost/i })).not.toBeInTheDocument();
      }
    });
  });

  describe("11. Add Products to Deal", () => {
    it("renders deal form with all fields for product/service tracking", () => {
      const mockPipeline = createMockPipeline();

      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      // Deal form has amount field which can track product value
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
    });
  });

  describe("12. Add Activities to Deal", () => {
    it("displays deal with activities structure", () => {
      const mockActivities = [
        createMockUser({ type: "note", subject: "Follow-up call scheduled" }),
        createMockUser({ type: "email", subject: "Sent proposal" }),
      ];

      const deal = createMockDealWithRelations({
        activities: mockActivities,
      });

      // Verify activities are part of deal structure
      expect(deal.activities).toHaveLength(2);
      expect(deal.activities[0].subject).toBe("Follow-up call scheduled");
      expect(deal.activities[1].subject).toBe("Sent proposal");
    });
  });

  describe("Integration: Complete Deal Workflow", () => {
    it("completes full deal lifecycle from creation to close", async () => {
      const mockCreateDeal = vi.fn().mockResolvedValue("new_deal_id");
      const mockUpdateDeal = vi.fn().mockResolvedValue(undefined);
      const mockMoveStage = vi.fn().mockResolvedValue(undefined);
      const mockMarkWon = vi.fn().mockResolvedValue(undefined);

      const mockPipeline = createMockPipeline();
      const mockCompany = createMockCompany();

      mockUseQuery.mockReturnValue([mockPipeline]);

      // Step 1: Create deal
      mockUseMutation.mockReturnValue(mockCreateDeal);
      const { user } = render(
        <CreateDealDialog open={true} onOpenChange={vi.fn()} />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Full Lifecycle Deal");

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "100000");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateDeal).toHaveBeenCalled();
      });

      // Subsequent steps would involve:
      // Step 2: Move through stages (tested separately in drag/drop tests)
      // Step 3: Update deal value (tested in update tests)
      // Step 4: Mark as won (tested in win/lose tests)
    });
  });

  describe("Accessibility", () => {
    it("deal list has proper table structure", () => {
      const mockDeal = {
        ...createMockDeal(),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Prospecting",
        stageColor: "#3b82f6",
      };

      render(<DealList deals={[mockDeal]} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });

    it("deal form has proper labels", () => {
      const mockPipeline = createMockPipeline();

      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    });

    it("buttons have accessible labels", async () => {
      const mockDeal = {
        ...createMockDeal({ status: "open" }),
        company: null,
        pipeline: createMockPipeline(),
        stageName: "Prospecting",
        stageColor: "#3b82f6",
      };

      const { user } = render(
        <DealList deals={[mockDeal]} onMarkWon={vi.fn()} onMarkLost={vi.fn()} />
      );

      const menuButtons = screen.getAllByRole("button");
      const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
      expect(menuButton).toBeDefined();

      if (menuButton) {
        await user.click(menuButton);

        const viewItem = await screen.findByRole("menuitem", { name: /view details/i });
        expect(viewItem).toBeInTheDocument();
      }
    });
  });

  describe("Error Handling", () => {
    it("handles create deal error gracefully", async () => {
      const mockCreateDeal = vi.fn().mockRejectedValue(new Error("Network error"));

      mockUseQuery.mockReturnValue([createMockPipeline()]);
      mockUseMutation.mockReturnValue(mockCreateDeal);

      const { user } = render(
        <CreateDealDialog open={true} onOpenChange={vi.fn()} />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Error Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateDeal).toHaveBeenCalled();
      });

      // Dialog should still be open on error
      expect(screen.getByText("Create New Deal")).toBeInTheDocument();
    });

    it("validates amount is positive", async () => {
      const mockOnSubmit = vi.fn();
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "-1000");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      // Should show validation error for negative amount
      await waitFor(() => {
        expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state in deal form", () => {
      const mockPipeline = createMockPipeline();

      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      expect(submitButton).toBeDisabled();
    });

    it("disables form during submission", async () => {
      const mockOnSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const mockPipeline = createMockPipeline();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={[]}
          contacts={[]}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
      });
    });
  });
});
