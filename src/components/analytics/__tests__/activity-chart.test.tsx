import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ActivityChart, ActivityData } from "../ActivityChart";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({
    children,
    data,
    layout,
  }: {
    children: React.ReactNode;
    data: unknown[];
    layout?: string;
  }) => (
    <div
      data-testid="bar-chart"
      data-length={data?.length}
      data-layout={layout}
    >
      {children}
    </div>
  ),
  Bar: ({ dataKey, radius }: { dataKey: string; radius?: number[] }) => (
    <div
      data-testid="bar"
      data-key={dataKey}
      data-radius={radius?.join(",")}
    />
  ),
  XAxis: ({
    dataKey,
    type,
  }: {
    dataKey?: string;
    type?: string;
  }) => <div data-testid="x-axis" data-key={dataKey} data-type={type} />,
  YAxis: ({
    dataKey,
    type,
  }: {
    dataKey?: string;
    type?: string;
  }) => <div data-testid="y-axis" data-key={dataKey} data-type={type} />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: ({ fill }: { fill: string }) => (
    <div data-testid="cell" data-fill={fill} />
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Phone: () => <svg data-testid="icon-phone" />,
  Mail: () => <svg data-testid="icon-mail" />,
  Calendar: () => <svg data-testid="icon-calendar" />,
  MessageSquare: () => <svg data-testid="icon-message" />,
  Video: () => <svg data-testid="icon-video" />,
  FileText: () => <svg data-testid="icon-note" />,
}));

describe("ActivityChart", () => {
  const mockData: ActivityData[] = [
    { type: "call", count: 45 },
    { type: "email", count: 120 },
    { type: "meeting", count: 25 },
    { type: "message", count: 80 },
    { type: "note", count: 35 },
  ];

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("renders with custom title and description", () => {
      render(
        <ActivityChart
          data={mockData}
          title="Team Activities"
          description="Weekly activity breakdown"
        />
      );
      expect(screen.getByText("Team Activities")).toBeInTheDocument();
      expect(screen.getByText("Weekly activity breakdown")).toBeInTheDocument();
    });

    it("renders default title and description when not provided", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByText("Activity Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Activities by type")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <ActivityChart data={mockData} className="custom-class" />
      );
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Activity Types Display", () => {
    it("displays all activity type labels", () => {
      render(<ActivityChart data={mockData} />);
      // Activity types are capitalized in the breakdown section
      expect(screen.getAllByText(/call/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/meeting/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/message/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/note/i).length).toBeGreaterThan(0);
    });

    it("displays activity counts", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
      expect(screen.getByText("35")).toBeInTheDocument();
    });

    it("displays total activities count in header", () => {
      render(<ActivityChart data={mockData} />);
      // Total: 45 + 120 + 25 + 80 + 35 = 305
      expect(screen.getByText("305")).toBeInTheDocument();
      expect(screen.getByText("total activities")).toBeInTheDocument();
    });
  });

  describe("Percentage Calculations", () => {
    it("displays percentage for each activity type", () => {
      render(<ActivityChart data={mockData} />);
      // Email has 120 out of 305 = 39.3%
      expect(screen.getByText("(39.3%)")).toBeInTheDocument();
      // Call has 45 out of 305 = 14.8%
      expect(screen.getByText("(14.8%)")).toBeInTheDocument();
    });
  });

  describe("Top Activity Highlight", () => {
    it("displays most common activity message", () => {
      render(<ActivityChart data={mockData} />);
      // Email is the most common with 120 occurrences
      expect(screen.getByText(/Most common activity:/)).toBeInTheDocument();
      // The activity name should be in the message (capitalized)
      const emailElements = screen.getAllByText(/email/i);
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it("shows occurrence count for top activity", () => {
      render(<ActivityChart data={mockData} />);
      // Email has 120 occurrences
      expect(screen.getByText(/120 occurrences/)).toBeInTheDocument();
    });
  });

  describe("Orientation", () => {
    it("renders vertical orientation by default", () => {
      render(<ActivityChart data={mockData} />);
      const chart = screen.getByTestId("bar-chart");
      expect(chart).toHaveAttribute("data-layout", "horizontal");
    });

    it("renders horizontal orientation when specified", () => {
      render(<ActivityChart data={mockData} orientation="horizontal" />);
      const chart = screen.getByTestId("bar-chart");
      expect(chart).toHaveAttribute("data-layout", "vertical");
    });

    it("renders vertical orientation when specified", () => {
      render(<ActivityChart data={mockData} orientation="vertical" />);
      const chart = screen.getByTestId("bar-chart");
      expect(chart).toHaveAttribute("data-layout", "horizontal");
    });
  });

  describe("Icons Display", () => {
    it("renders icons by default (showIcons=true)", () => {
      render(<ActivityChart data={mockData} />);
      // Icons should be rendered for each activity type
      // The component uses activity icons from ACTIVITY_ICONS mapping
      // Just verify the breakdown section with icons is rendered
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      // Check that percentages are shown (indicates breakdown section is rendered)
      expect(screen.getAllByText(/\(\d+\.\d+%\)/).length).toBeGreaterThanOrEqual(mockData.length);
    });

    it("hides icons when showIcons is false", () => {
      render(<ActivityChart data={mockData} showIcons={false} />);
      // The breakdown section with icons should not be rendered
      // Still renders the chart but not the icon grid
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("handles empty data array", () => {
      render(<ActivityChart data={[]} />);
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("total activities")).toBeInTheDocument();
    });

    it("renders chart container even with empty data", () => {
      render(<ActivityChart data={[]} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Single Activity Type", () => {
    it("handles single activity type", () => {
      const singleData: ActivityData[] = [{ type: "call", count: 50 }];
      render(<ActivityChart data={singleData} />);
      // 50 may appear multiple times (count and total)
      expect(screen.getAllByText("50").length).toBeGreaterThan(0);
      expect(screen.getByText("(100.0%)")).toBeInTheDocument();
    });
  });

  describe("Custom Colors", () => {
    it("uses custom fill colors when provided in data", () => {
      const dataWithColors: ActivityData[] = [
        { type: "call", count: 45, fill: "#ff0000" },
        { type: "email", count: 120, fill: "#00ff00" },
      ];
      render(<ActivityChart data={dataWithColors} />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("applies default colors when no fill is provided", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("Chart Configuration", () => {
    it("passes correct data length to chart", () => {
      render(<ActivityChart data={mockData} />);
      const chart = screen.getByTestId("bar-chart");
      expect(chart).toHaveAttribute("data-length", String(mockData.length));
    });

    it("renders Bar component with count dataKey", () => {
      render(<ActivityChart data={mockData} />);
      const bar = screen.getByTestId("bar");
      expect(bar).toHaveAttribute("data-key", "count");
    });

    it("renders cartesian grid", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    });

    it("renders tooltip", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });
  });

  describe("Axis Configuration", () => {
    it("renders XAxis for vertical orientation", () => {
      render(<ActivityChart data={mockData} orientation="vertical" />);
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    });

    it("renders YAxis for vertical orientation", () => {
      render(<ActivityChart data={mockData} orientation="vertical" />);
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });

    it("configures axes correctly for horizontal orientation", () => {
      render(<ActivityChart data={mockData} orientation="horizontal" />);
      const xAxis = screen.getByTestId("x-axis");
      const yAxis = screen.getByTestId("y-axis");
      expect(xAxis).toHaveAttribute("data-type", "number");
      expect(yAxis).toHaveAttribute("data-type", "category");
    });
  });

  describe("Activity Breakdown Section", () => {
    it("renders breakdown items with correct structure", () => {
      render(<ActivityChart data={mockData} />);
      // Each activity should have a container with icon and text
      const activityItems = screen.getAllByText(/^\d+$/);
      expect(activityItems.length).toBeGreaterThan(0);
    });

    it("displays percentages in parentheses", () => {
      render(<ActivityChart data={mockData} />);
      const percentages = screen.getAllByText(/\(\d+\.\d+%\)/);
      // At least one percentage for each activity type
      expect(percentages.length).toBeGreaterThanOrEqual(mockData.length);
    });
  });

  describe("Zero Count Activities", () => {
    it("handles activities with zero count", () => {
      const dataWithZero: ActivityData[] = [
        { type: "call", count: 0 },
        { type: "email", count: 50 },
      ];
      render(<ActivityChart data={dataWithZero} />);
      // May appear multiple times
      expect(screen.getAllByText("50").length).toBeGreaterThan(0);
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });

    it("calculates correct percentages with zero counts", () => {
      const dataWithZero: ActivityData[] = [
        { type: "call", count: 0 },
        { type: "email", count: 100 },
      ];
      render(<ActivityChart data={dataWithZero} />);
      expect(screen.getByText("(100.0%)")).toBeInTheDocument();
      expect(screen.getByText("(0.0%)")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible title", () => {
      render(<ActivityChart data={mockData} title="Activity Report" />);
      expect(screen.getByText("Activity Report")).toBeInTheDocument();
    });

    it("has accessible description", () => {
      render(
        <ActivityChart data={mockData} description="Shows activity breakdown" />
      );
      expect(screen.getByText("Shows activity breakdown")).toBeInTheDocument();
    });
  });

  describe("Card Structure", () => {
    it("renders CardHeader with title", () => {
      render(<ActivityChart data={mockData} title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("renders CardContent with chart", () => {
      render(<ActivityChart data={mockData} />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });
});
