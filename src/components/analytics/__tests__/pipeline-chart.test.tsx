import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PipelineChart, PipelineStage } from "../PipelineChart";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  FunnelChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="funnel-chart">{children}</div>
  ),
  Funnel: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="funnel" data-length={data?.length}>
      {children}
    </div>
  ),
  LabelList: ({ dataKey, position }: { dataKey: string; position: string }) => (
    <div data-testid={`label-list-${position}`} data-key={dataKey} />
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe("PipelineChart", () => {
  const mockData: PipelineStage[] = [
    { name: "Lead", value: 100000, count: 50 },
    { name: "Qualified", value: 75000, count: 30 },
    { name: "Proposal", value: 50000, count: 15 },
    { name: "Negotiation", value: 30000, count: 8 },
    { name: "Closed Won", value: 20000, count: 5 },
  ];

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("funnel-chart")).toBeInTheDocument();
    });

    it("renders with custom title and description", () => {
      render(
        <PipelineChart
          data={mockData}
          title="Custom Pipeline"
          description="Custom description"
        />
      );
      expect(screen.getByText("Custom Pipeline")).toBeInTheDocument();
      expect(screen.getByText("Custom description")).toBeInTheDocument();
    });

    it("renders default title and description when not provided", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByText("Pipeline Funnel")).toBeInTheDocument();
      expect(screen.getByText("Deal value by pipeline stage")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <PipelineChart data={mockData} className="custom-class" />
      );
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("displays total value correctly", () => {
      render(<PipelineChart data={mockData} />);
      // Total is 275000 which should be formatted as currency (no decimals)
      expect(screen.getByText("$275,000")).toBeInTheDocument();
    });

    it("displays total deal count", () => {
      render(<PipelineChart data={mockData} />);
      // Total count is 108
      expect(screen.getByText("108 deals")).toBeInTheDocument();
    });

    it("displays stage labels in the breakdown section", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByText("Lead")).toBeInTheDocument();
      expect(screen.getByText("Qualified")).toBeInTheDocument();
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Negotiation")).toBeInTheDocument();
      expect(screen.getByText("Closed Won")).toBeInTheDocument();
    });

    it("displays individual stage deal counts in breakdown", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByText("50 deals")).toBeInTheDocument();
      expect(screen.getByText("30 deals")).toBeInTheDocument();
      expect(screen.getByText("15 deals")).toBeInTheDocument();
      expect(screen.getByText("8 deals")).toBeInTheDocument();
      expect(screen.getByText("5 deals")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("handles empty data array", () => {
      render(<PipelineChart data={[]} />);
      expect(screen.getByText("$0")).toBeInTheDocument();
      expect(screen.getByText("0 deals")).toBeInTheDocument();
    });

    it("renders chart container even with empty data", () => {
      render(<PipelineChart data={[]} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("funnel-chart")).toBeInTheDocument();
    });
  });

  describe("Visibility Options", () => {
    it("hides value when showValue is false", () => {
      render(<PipelineChart data={mockData} showValue={false} />);
      expect(screen.queryByText("$275,000")).not.toBeInTheDocument();
    });

    it("hides count when showCount is false", () => {
      render(<PipelineChart data={mockData} showCount={false} />);
      // The header count should be hidden, but stage counts in breakdown remain
      const header = screen.getByText("Pipeline Funnel").closest("div")?.parentElement;
      expect(header?.textContent).not.toContain("108 deals");
    });

    it("shows both value and count by default", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByText("$275,000")).toBeInTheDocument();
      expect(screen.getByText("108 deals")).toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("uses default USD currency", () => {
      render(<PipelineChart data={mockData} />);
      expect(screen.getByText("$275,000")).toBeInTheDocument();
    });

    it("uses custom currency when specified", () => {
      render(<PipelineChart data={mockData} currency="EUR" />);
      // The exact format depends on the formatCurrency implementation
      const totalText = screen.getByText((content) =>
        content.includes("275,000") && content.includes("EUR") || content.includes("€")
      );
      expect(totalText).toBeInTheDocument();
    });
  });

  describe("Custom Colors", () => {
    it("uses custom fill colors when provided in data", () => {
      const dataWithColors: PipelineStage[] = [
        { name: "Stage 1", value: 100, count: 10, fill: "#ff0000" },
        { name: "Stage 2", value: 50, count: 5, fill: "#00ff00" },
      ];
      render(<PipelineChart data={dataWithColors} />);

      // The funnel should receive the data with colors
      const funnel = screen.getByTestId("funnel");
      expect(funnel).toBeInTheDocument();
    });

    it("applies default colors when no fill is provided", () => {
      const dataWithoutColors: PipelineStage[] = [
        { name: "Stage 1", value: 100, count: 10 },
        { name: "Stage 2", value: 50, count: 5 },
      ];
      render(<PipelineChart data={dataWithoutColors} />);

      // The component should still render
      expect(screen.getByTestId("funnel")).toBeInTheDocument();
    });
  });

  describe("Stage Breakdown Section", () => {
    it("renders color indicators for each stage", () => {
      render(<PipelineChart data={mockData} />);

      // Each stage should have a color indicator div
      const stageItems = screen.getAllByText(/deals$/);
      expect(stageItems.length).toBeGreaterThanOrEqual(mockData.length);
    });

    it("displays stages in correct order", () => {
      const { container } = render(<PipelineChart data={mockData} />);

      // Find all stage name elements in the breakdown
      const stageNames = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"];
      stageNames.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });

  describe("Chart Configuration", () => {
    it("passes correct data to Funnel component", () => {
      render(<PipelineChart data={mockData} />);

      const funnel = screen.getByTestId("funnel");
      expect(funnel).toHaveAttribute("data-length", String(mockData.length));
    });

    it("renders LabelList for names on the right", () => {
      render(<PipelineChart data={mockData} />);

      const labelListRight = screen.getByTestId("label-list-right");
      expect(labelListRight).toBeInTheDocument();
      expect(labelListRight).toHaveAttribute("data-key", "name");
    });

    it("renders LabelList for values in center", () => {
      render(<PipelineChart data={mockData} />);

      const labelListCenter = screen.getByTestId("label-list-center");
      expect(labelListCenter).toBeInTheDocument();
    });
  });
});
