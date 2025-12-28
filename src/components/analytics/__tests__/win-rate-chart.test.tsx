import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { WinRateChart, WinRateData } from "../WinRateChart";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({
    children,
    data,
    innerRadius,
    outerRadius,
  }: {
    children: React.ReactNode;
    data: unknown[];
    innerRadius?: number;
    outerRadius?: number;
  }) => (
    <div
      data-testid="pie"
      data-length={data?.length}
      data-inner-radius={innerRadius}
      data-outer-radius={outerRadius}
    >
      {children}
    </div>
  ),
  Cell: ({ fill }: { fill: string }) => (
    <div data-testid="cell" data-fill={fill} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
  TrendingDown: () => <svg data-testid="icon-trending-down" />,
  Minus: () => <svg data-testid="icon-minus" />,
}));

describe("WinRateChart", () => {
  const mockData: WinRateData = {
    won: 25,
    lost: 15,
  };

  const mockDataWithPending: WinRateData = {
    won: 25,
    lost: 15,
    pending: 10,
  };

  const mockDataWithValues: WinRateData = {
    won: 25,
    lost: 15,
    wonValue: 500000,
    lostValue: 200000,
  };

  const mockDataComplete: WinRateData = {
    won: 25,
    lost: 15,
    pending: 10,
    wonValue: 500000,
    lostValue: 200000,
    pendingValue: 150000,
  };

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("renders with custom title and description", () => {
      render(
        <WinRateChart
          data={mockData}
          title="Deal Win Rate"
          description="Monthly win/loss analysis"
        />
      );
      expect(screen.getByText("Deal Win Rate")).toBeInTheDocument();
      expect(screen.getByText("Monthly win/loss analysis")).toBeInTheDocument();
    });

    it("renders default title and description when not provided", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByText("Win Rate")).toBeInTheDocument();
      expect(screen.getByText("Won vs lost deals")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <WinRateChart data={mockData} className="custom-class" />
      );
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Win Rate Calculation", () => {
    it("calculates win rate correctly", () => {
      render(<WinRateChart data={mockData} />);
      // Win rate: 25 / (25 + 15) = 62.5%
      expect(screen.getByText("62.5%")).toBeInTheDocument();
    });

    it("displays closed deals count", () => {
      render(<WinRateChart data={mockData} />);
      // Closed deals: 25 + 15 = 40
      expect(screen.getByText("40 closed deals")).toBeInTheDocument();
    });

    it("calculates win rate excluding pending deals", () => {
      render(<WinRateChart data={mockDataWithPending} />);
      // Win rate: 25 / (25 + 15) = 62.5% (pending excluded from calculation)
      expect(screen.getByText("62.5%")).toBeInTheDocument();
    });
  });

  describe("Edge Cases - No Deals", () => {
    it("handles zero closed deals", () => {
      const noDeals: WinRateData = { won: 0, lost: 0 };
      render(<WinRateChart data={noDeals} />);
      // Win rate should be 0 when no deals
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles only won deals", () => {
      const onlyWon: WinRateData = { won: 10, lost: 0 };
      render(<WinRateChart data={onlyWon} />);
      // Win rate should be 100%
      expect(screen.getByText("100.0%")).toBeInTheDocument();
    });

    it("handles only lost deals", () => {
      const onlyLost: WinRateData = { won: 0, lost: 10 };
      render(<WinRateChart data={onlyLost} />);
      // Win rate should be 0%
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles only pending deals", () => {
      const onlyPending: WinRateData = { won: 0, lost: 0, pending: 10 };
      render(<WinRateChart data={onlyPending} />);
      // Win rate should be 0 (no closed deals)
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });
  });

  describe("Stats Breakdown Section", () => {
    it("displays won count", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByText("Won")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("displays lost count", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByText("Lost")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("displays pending count when present", () => {
      render(<WinRateChart data={mockDataWithPending} />);
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("displays total when no pending", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("40")).toBeInTheDocument();
    });
  });

  describe("Value Display", () => {
    it("shows deal values when showValue is true and values are provided", () => {
      render(<WinRateChart data={mockDataWithValues} showValue />);
      expect(screen.getByText("$500,000")).toBeInTheDocument();
      expect(screen.getByText("$200,000")).toBeInTheDocument();
    });

    it("hides deal values when showValue is false", () => {
      render(<WinRateChart data={mockDataWithValues} showValue={false} />);
      expect(screen.queryByText("$500,000")).not.toBeInTheDocument();
    });

    it("shows pending value when present", () => {
      render(<WinRateChart data={mockDataComplete} showValue />);
      expect(screen.getByText("$150,000")).toBeInTheDocument();
    });

    it("shows total value when no pending", () => {
      render(<WinRateChart data={mockDataWithValues} showValue />);
      // Total value: 500000 + 200000 = 700000
      expect(screen.getByText("$700,000")).toBeInTheDocument();
    });
  });

  describe("Trend Indicator", () => {
    it("shows positive trend when current rate is higher than previous", () => {
      render(
        <WinRateChart data={mockData} showTrend previousWinRate={50} />
      );
      // Current: 62.5%, Previous: 50%, Diff: +12.5%
      expect(screen.getByText("+12.5%")).toBeInTheDocument();
      expect(screen.getByTestId("icon-trending-up")).toBeInTheDocument();
    });

    it("shows negative trend when current rate is lower than previous", () => {
      render(
        <WinRateChart data={mockData} showTrend previousWinRate={75} />
      );
      // Current: 62.5%, Previous: 75%, Diff: -12.5%
      expect(screen.getByText("-12.5%")).toBeInTheDocument();
      expect(screen.getByTestId("icon-trending-down")).toBeInTheDocument();
    });

    it("shows neutral trend when rate is unchanged", () => {
      render(
        <WinRateChart data={mockData} showTrend previousWinRate={62.5} />
      );
      expect(screen.getByText("0.0%")).toBeInTheDocument();
      expect(screen.getByTestId("icon-minus")).toBeInTheDocument();
    });

    it("hides trend when showTrend is false", () => {
      render(
        <WinRateChart data={mockData} showTrend={false} previousWinRate={50} />
      );
      expect(screen.queryByTestId("icon-trending-up")).not.toBeInTheDocument();
    });

    it("hides trend when previousWinRate is not provided", () => {
      render(<WinRateChart data={mockData} showTrend />);
      expect(screen.queryByTestId("icon-trending-up")).not.toBeInTheDocument();
      expect(screen.queryByTestId("icon-trending-down")).not.toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("uses default USD currency", () => {
      render(<WinRateChart data={mockDataWithValues} showValue />);
      expect(screen.getByText("$500,000")).toBeInTheDocument();
    });

    it("uses custom currency when specified", () => {
      render(
        <WinRateChart data={mockDataWithValues} showValue currency="EUR" />
      );
      // Currency formatting should reflect EUR
      const valueElement = screen.getByText((content) =>
        content.includes("500,000") && (content.includes("EUR") || content.includes("\u20AC"))
      );
      expect(valueElement).toBeInTheDocument();
    });
  });

  describe("Chart Configuration", () => {
    it("renders pie chart with correct data length", () => {
      render(<WinRateChart data={mockData} />);
      const pie = screen.getByTestId("pie");
      // Should have 2 segments (won, lost)
      expect(pie).toHaveAttribute("data-length", "2");
    });

    it("renders pie chart with 3 segments when pending is present", () => {
      render(<WinRateChart data={mockDataWithPending} />);
      const pie = screen.getByTestId("pie");
      // Should have 3 segments (won, lost, pending)
      expect(pie).toHaveAttribute("data-length", "3");
    });

    it("renders donut chart (has inner radius)", () => {
      render(<WinRateChart data={mockData} />);
      const pie = screen.getByTestId("pie");
      expect(pie).toHaveAttribute("data-inner-radius", "60");
      expect(pie).toHaveAttribute("data-outer-radius", "100");
    });

    it("renders tooltip", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("renders legend", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });
  });

  describe("Color Coding", () => {
    it("renders cells with correct colors", () => {
      render(<WinRateChart data={mockData} />);
      const cells = screen.getAllByTestId("cell");
      // Won should be green, Lost should be red
      expect(cells[0]).toHaveAttribute("data-fill", "#22c55e"); // green-500
      expect(cells[1]).toHaveAttribute("data-fill", "#ef4444"); // red-500
    });

    it("includes amber color for pending", () => {
      render(<WinRateChart data={mockDataWithPending} />);
      const cells = screen.getAllByTestId("cell");
      expect(cells[2]).toHaveAttribute("data-fill", "#f59e0b"); // amber-500
    });
  });

  describe("Stat Card Styling", () => {
    it("applies green styling to won stat", () => {
      const { container } = render(<WinRateChart data={mockData} />);
      const wonCard = container.querySelector(".border-green-500\\/20");
      expect(wonCard).toBeInTheDocument();
    });

    it("applies red styling to lost stat", () => {
      const { container } = render(<WinRateChart data={mockData} />);
      const lostCard = container.querySelector(".border-red-500\\/20");
      expect(lostCard).toBeInTheDocument();
    });

    it("applies amber styling to pending stat when present", () => {
      const { container } = render(<WinRateChart data={mockDataWithPending} />);
      const pendingCard = container.querySelector(".border-amber-500\\/20");
      expect(pendingCard).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible title", () => {
      render(<WinRateChart data={mockData} title="Win Rate Analysis" />);
      expect(screen.getByText("Win Rate Analysis")).toBeInTheDocument();
    });

    it("has accessible description", () => {
      render(
        <WinRateChart data={mockData} description="Shows deal win/loss ratio" />
      );
      expect(screen.getByText("Shows deal win/loss ratio")).toBeInTheDocument();
    });
  });

  describe("Card Structure", () => {
    it("renders CardHeader with title and win rate", () => {
      render(<WinRateChart data={mockData} title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("62.5%")).toBeInTheDocument();
    });

    it("renders CardContent with chart", () => {
      render(<WinRateChart data={mockData} />);
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
  });

  describe("Large Numbers", () => {
    it("formats large deal counts correctly", () => {
      const largeData: WinRateData = {
        won: 1500,
        lost: 500,
      };
      render(<WinRateChart data={largeData} />);
      expect(screen.getByText("1,500")).toBeInTheDocument();
      expect(screen.getByText("500")).toBeInTheDocument();
    });

    it("formats large deal values correctly", () => {
      const largeValueData: WinRateData = {
        won: 25,
        lost: 15,
        wonValue: 5000000,
        lostValue: 1000000,
      };
      render(<WinRateChart data={largeValueData} showValue />);
      expect(screen.getByText("$5,000,000")).toBeInTheDocument();
    });
  });
});
