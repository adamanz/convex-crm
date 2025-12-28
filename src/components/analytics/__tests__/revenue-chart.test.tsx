import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { RevenueChart, RevenueDataPoint } from "../RevenueChart";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  Area: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`area-${dataKey}`} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("RevenueChart", () => {
  const mockData: RevenueDataPoint[] = [
    { date: "Jan", revenue: 10000 },
    { date: "Feb", revenue: 15000 },
    { date: "Mar", revenue: 12000 },
    { date: "Apr", revenue: 20000 },
    { date: "May", revenue: 25000 },
  ];

  const mockDataWithTarget: RevenueDataPoint[] = [
    { date: "Jan", revenue: 10000, target: 12000 },
    { date: "Feb", revenue: 15000, target: 14000 },
    { date: "Mar", revenue: 12000, target: 13000 },
  ];

  const mockDataWithPreviousPeriod: RevenueDataPoint[] = [
    { date: "Jan", revenue: 10000, previousPeriod: 8000 },
    { date: "Feb", revenue: 15000, previousPeriod: 12000 },
    { date: "Mar", revenue: 12000, previousPeriod: 11000 },
  ];

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders area chart by default", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    });

    it("renders line chart when variant is line", () => {
      render(<RevenueChart data={mockData} variant="line" />);
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("renders with custom title and description", () => {
      render(
        <RevenueChart
          data={mockData}
          title="Monthly Revenue"
          description="Revenue trends over time"
        />
      );
      expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
      expect(screen.getByText("Revenue trends over time")).toBeInTheDocument();
    });

    it("renders default title and description when not provided", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText("Revenue Trend")).toBeInTheDocument();
      expect(screen.getByText("Revenue over time")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <RevenueChart data={mockData} className="custom-class" />
      );
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Revenue Data Display", () => {
    it("displays latest revenue value", () => {
      render(<RevenueChart data={mockData} />);
      // Latest revenue is 25000 - may appear multiple times (header + peak stat)
      expect(screen.getAllByText("$25,000").length).toBeGreaterThan(0);
    });

    it("displays growth rate compared to previous period", () => {
      render(<RevenueChart data={mockData} />);
      // Growth from 20000 to 25000 is +25%
      expect(screen.getByText("+25.0% vs previous")).toBeInTheDocument();
    });

    it("displays negative growth rate when revenue decreases", () => {
      const decreasingData: RevenueDataPoint[] = [
        { date: "Jan", revenue: 20000 },
        { date: "Feb", revenue: 15000 },
      ];
      render(<RevenueChart data={decreasingData} />);
      // Growth from 20000 to 15000 is -25%
      expect(screen.getByText("-25.0% vs previous")).toBeInTheDocument();
    });

    it("displays total revenue in summary stats", () => {
      render(<RevenueChart data={mockData} />);
      // Total is 82000
      expect(screen.getByText("$82,000")).toBeInTheDocument();
    });

    it("displays average revenue in summary stats", () => {
      render(<RevenueChart data={mockData} />);
      // Average is 82000 / 5 = 16400
      expect(screen.getByText("$16,400")).toBeInTheDocument();
    });

    it("displays peak revenue in summary stats", () => {
      render(<RevenueChart data={mockData} />);
      // Peak is 25000 - appears at least twice (header + stats)
      expect(screen.getAllByText("$25,000").length).toBeGreaterThan(0);
    });
  });

  describe("Summary Stats Section", () => {
    it("renders total revenue stat", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    });

    it("renders average stat", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText("Average")).toBeInTheDocument();
    });

    it("renders peak stat", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText("Peak")).toBeInTheDocument();
    });
  });

  describe("Target Line", () => {
    it("renders target line when showTarget is true", () => {
      render(<RevenueChart data={mockDataWithTarget} showTarget />);
      expect(screen.getByTestId("area-target")).toBeInTheDocument();
    });

    it("does not render target line by default", () => {
      render(<RevenueChart data={mockDataWithTarget} />);
      expect(screen.queryByTestId("area-target")).not.toBeInTheDocument();
    });

    it("renders target as Line when variant is line", () => {
      render(
        <RevenueChart data={mockDataWithTarget} showTarget variant="line" />
      );
      expect(screen.getByTestId("line-target")).toBeInTheDocument();
    });
  });

  describe("Previous Period Comparison", () => {
    it("renders previous period line when showPreviousPeriod is true", () => {
      render(
        <RevenueChart data={mockDataWithPreviousPeriod} showPreviousPeriod />
      );
      expect(screen.getByTestId("area-previousPeriod")).toBeInTheDocument();
    });

    it("does not render previous period line by default", () => {
      render(<RevenueChart data={mockDataWithPreviousPeriod} />);
      expect(screen.queryByTestId("area-previousPeriod")).not.toBeInTheDocument();
    });

    it("renders previous period as Line when variant is line", () => {
      render(
        <RevenueChart
          data={mockDataWithPreviousPeriod}
          showPreviousPeriod
          variant="line"
        />
      );
      expect(screen.getByTestId("line-previousPeriod")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("handles empty data array", () => {
      render(<RevenueChart data={[]} />);
      // $0 may appear multiple times in different stats
      expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
    });

    it("handles zero growth rate when only one data point", () => {
      const singlePoint: RevenueDataPoint[] = [{ date: "Jan", revenue: 10000 }];
      render(<RevenueChart data={singlePoint} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders chart container even with empty data", () => {
      render(<RevenueChart data={[]} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("uses default USD currency", () => {
      render(<RevenueChart data={mockData} />);
      // May appear multiple times
      expect(screen.getAllByText("$25,000").length).toBeGreaterThan(0);
    });

    it("uses custom currency when specified", () => {
      render(<RevenueChart data={mockData} currency="EUR" />);
      // Currency formatting should reflect EUR - may appear multiple times
      const revenueElements = screen.getAllByText((content) =>
        content.includes("25,000") && (content.includes("EUR") || content.includes("\u20AC"))
      );
      expect(revenueElements.length).toBeGreaterThan(0);
    });
  });

  describe("Chart Configuration", () => {
    it("passes correct data length to chart", () => {
      render(<RevenueChart data={mockData} />);
      const chart = screen.getByTestId("area-chart");
      expect(chart).toHaveAttribute("data-length", String(mockData.length));
    });

    it("renders revenue area/line component", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("area-revenue")).toBeInTheDocument();
    });

    it("renders revenue line when variant is line", () => {
      render(<RevenueChart data={mockData} variant="line" />);
      expect(screen.getByTestId("line-revenue")).toBeInTheDocument();
    });

    it("renders X axis with date dataKey", () => {
      render(<RevenueChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis).toHaveAttribute("data-key", "date");
    });

    it("renders Y axis", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });

    it("renders cartesian grid", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    });

    it("renders tooltip", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("renders legend", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });
  });

  describe("Growth Rate Styling", () => {
    it("applies green color for positive growth", () => {
      render(<RevenueChart data={mockData} />);
      const growthText = screen.getByText("+25.0% vs previous");
      expect(growthText).toHaveClass("text-green-500");
    });

    it("applies red color for negative growth", () => {
      const decreasingData: RevenueDataPoint[] = [
        { date: "Jan", revenue: 20000 },
        { date: "Feb", revenue: 15000 },
      ];
      render(<RevenueChart data={decreasingData} />);
      const growthText = screen.getByText("-25.0% vs previous");
      expect(growthText).toHaveClass("text-red-500");
    });
  });

  describe("Large Numbers Formatting", () => {
    it("formats large numbers correctly", () => {
      const largeData: RevenueDataPoint[] = [
        { date: "Jan", revenue: 1000000 },
        { date: "Feb", revenue: 1500000 },
      ];
      render(<RevenueChart data={largeData} />);
      // May appear multiple times (header + peak stat)
      expect(screen.getAllByText("$1,500,000").length).toBeGreaterThan(0);
    });
  });

  describe("Card Structure", () => {
    it("renders CardHeader with title", () => {
      render(<RevenueChart data={mockData} title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("renders CardContent with chart", () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible title", () => {
      render(<RevenueChart data={mockData} title="Revenue Chart" />);
      expect(screen.getByText("Revenue Chart")).toBeInTheDocument();
    });

    it("has accessible description", () => {
      render(
        <RevenueChart data={mockData} description="Shows monthly revenue" />
      );
      expect(screen.getByText("Shows monthly revenue")).toBeInTheDocument();
    });
  });
});
