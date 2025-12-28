import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StatsCard } from "../stats-card";
import { Users, DollarSign, TrendingUp } from "lucide-react";

describe("StatsCard", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<StatsCard icon={Users} label="Total Users" value={150} />);
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
    });

    it("renders label correctly", () => {
      render(<StatsCard icon={Users} label="Active Contacts" value={42} />);
      expect(screen.getByText("Active Contacts")).toBeInTheDocument();
    });

    it("renders numeric value correctly", () => {
      render(<StatsCard icon={DollarSign} label="Revenue" value={12500} />);
      expect(screen.getByText("12500")).toBeInTheDocument();
    });

    it("renders string value correctly", () => {
      render(<StatsCard icon={DollarSign} label="Revenue" value="$12,500" />);
      expect(screen.getByText("$12,500")).toBeInTheDocument();
    });

    it("renders icon", () => {
      const { container } = render(
        <StatsCard icon={Users} label="Users" value={100} />
      );
      // The icon should be rendered as an SVG inside the component
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Change Indicator", () => {
    it("shows positive change correctly", () => {
      render(
        <StatsCard
          icon={TrendingUp}
          label="Growth"
          value={100}
          change={15.5}
        />
      );
      // formatPercentage should show +15.5%
      expect(screen.getByText("+15.5%")).toBeInTheDocument();
    });

    it("shows negative change correctly", () => {
      render(
        <StatsCard
          icon={TrendingUp}
          label="Decline"
          value={80}
          change={-10.2}
        />
      );
      // formatPercentage should show -10.2%
      expect(screen.getByText("-10.2%")).toBeInTheDocument();
    });

    it("shows zero change as positive", () => {
      render(
        <StatsCard icon={TrendingUp} label="Stable" value={100} change={0} />
      );
      // Zero should be treated as positive and show 0% or +0%
      const changeElement = screen.getByText(/0%/);
      expect(changeElement).toBeInTheDocument();
    });

    it("applies positive styling for positive change", () => {
      render(
        <StatsCard icon={TrendingUp} label="Growth" value={100} change={10} />
      );
      // formatPercentage includes decimal places, so we use a regex match
      const changeElement = screen.getByText(/\+10/);
      // Should have emerald/green styling for positive
      expect(changeElement).toHaveClass("text-emerald-700");
    });

    it("applies negative styling for negative change", () => {
      render(
        <StatsCard icon={TrendingUp} label="Decline" value={80} change={-5} />
      );
      // formatPercentage includes decimal places, so we use a regex match
      const changeElement = screen.getByText(/-5/);
      // Should have red styling for negative
      expect(changeElement).toHaveClass("text-red-700");
    });

    it("shows default change label", () => {
      render(
        <StatsCard icon={TrendingUp} label="Growth" value={100} change={10} />
      );
      expect(screen.getByText("vs last month")).toBeInTheDocument();
    });

    it("shows custom change label", () => {
      render(
        <StatsCard
          icon={TrendingUp}
          label="Growth"
          value={100}
          change={10}
          changeLabel="vs last week"
        />
      );
      expect(screen.getByText("vs last week")).toBeInTheDocument();
    });

    it("does not show change section when change is not provided", () => {
      render(<StatsCard icon={Users} label="Users" value={100} />);
      expect(screen.queryByText("vs last month")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatsCard
          icon={Users}
          label="Users"
          value={100}
          className="custom-class"
        />
      );
      const card = container.firstChild;
      expect(card).toHaveClass("custom-class");
    });

    it("has hover styles", () => {
      const { container } = render(
        <StatsCard icon={Users} label="Users" value={100} />
      );
      const card = container.firstChild;
      expect(card).toHaveClass("hover:shadow-sm");
    });

    it("has rounded corners", () => {
      const { container } = render(
        <StatsCard icon={Users} label="Users" value={100} />
      );
      const card = container.firstChild;
      expect(card).toHaveClass("rounded-xl");
    });

    it("has border styling", () => {
      const { container } = render(
        <StatsCard icon={Users} label="Users" value={100} />
      );
      const card = container.firstChild;
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-zinc-200");
    });
  });

  describe("Layout", () => {
    it("positions icon on the right side", () => {
      const { container } = render(
        <StatsCard icon={Users} label="Users" value={100} />
      );
      // The icon container should exist
      const iconContainer = container.querySelector(".h-10.w-10");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("rounded-lg");
    });

    it("displays value in large text", () => {
      render(<StatsCard icon={Users} label="Users" value={100} />);
      const valueElement = screen.getByText("100");
      expect(valueElement).toHaveClass("text-3xl");
      expect(valueElement).toHaveClass("font-semibold");
    });

    it("displays label in smaller muted text", () => {
      render(<StatsCard icon={Users} label="Total Users" value={100} />);
      const labelElement = screen.getByText("Total Users");
      expect(labelElement).toHaveClass("text-sm");
      expect(labelElement).toHaveClass("font-medium");
    });
  });
});
