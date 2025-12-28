import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { useQuery } from "convex/react";
import Dashboard from "@/app/page";
import {
  createMockCompany,
  createMockContact,
  createMockDeal,
  createMockActivity,
} from "@/test/test-utils";

// Mock Convex hooks
vi.mock("convex/react");

describe("Dashboard - E2E Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page Load", () => {
    it("should render dashboard without errors", () => {
      render(<Dashboard />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("should display welcome message", () => {
      render(<Dashboard />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Welcome back. Here's an overview of your CRM.")
      ).toBeInTheDocument();
    });

    it("should render page header actions", () => {
      render(<Dashboard />);

      expect(screen.getByText("Last 30 days")).toBeInTheDocument();
      expect(screen.getByText("Quick Add")).toBeInTheDocument();
    });

    it("should render all main sections", () => {
      render(<Dashboard />);

      // Stats section
      expect(screen.getByText("Total Contacts")).toBeInTheDocument();
      expect(screen.getByText("Companies")).toBeInTheDocument();
      expect(screen.getByText("Open Deals")).toBeInTheDocument();
      expect(screen.getByText("Conversations")).toBeInTheDocument();

      // Other sections
      expect(screen.getByText("Pipeline Value")).toBeInTheDocument();
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("Recent Deals")).toBeInTheDocument();
      expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });
  });

  describe("Stats Cards", () => {
    it("should display Total Contacts stat with value", () => {
      render(<Dashboard />);

      const statCard = screen.getByText("Total Contacts").closest("div");
      expect(statCard).toBeInTheDocument();
      expect(within(statCard!).getByText("2,350")).toBeInTheDocument();
    });

    it("should display Companies stat with value", () => {
      render(<Dashboard />);

      const statCard = screen.getByText("Companies").closest("div");
      expect(statCard).toBeInTheDocument();
      expect(within(statCard!).getByText("185")).toBeInTheDocument();
    });

    it("should display Open Deals stat with value", () => {
      render(<Dashboard />);

      const statCard = screen.getByText("Open Deals").closest("div");
      expect(statCard).toBeInTheDocument();
      expect(within(statCard!).getByText("42")).toBeInTheDocument();
    });

    it("should display Conversations stat with value", () => {
      render(<Dashboard />);

      const statCard = screen.getByText("Conversations").closest("div");
      expect(statCard).toBeInTheDocument();
      expect(within(statCard!).getByText("128")).toBeInTheDocument();
    });

    it("should display percentage changes for stats", () => {
      render(<Dashboard />);

      // All stats should have percentage changes
      expect(screen.getByText("+12.5%")).toBeInTheDocument();
      expect(screen.getByText("+4.3%")).toBeInTheDocument();
      expect(screen.getByText("-2.1%")).toBeInTheDocument();
      expect(screen.getByText("+18.2%")).toBeInTheDocument();
    });

    it("should display change labels", () => {
      render(<Dashboard />);

      const changeLabels = screen.getAllByText("from last month");
      expect(changeLabels).toHaveLength(4);
    });

    it("should render stat card icons", () => {
      const { container } = render(<Dashboard />);

      // Check for SVG icons in stat cards
      const svgIcons = container.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThan(4);
    });

    it("should make stat cards clickable links", () => {
      render(<Dashboard />);

      const contactsLink = screen.getByText("Total Contacts").closest("a");
      expect(contactsLink).toHaveAttribute("href", "/contacts");

      const companiesLink = screen.getByText("Companies").closest("a");
      expect(companiesLink).toHaveAttribute("href", "/companies");

      const dealsLink = screen.getByText("Open Deals").closest("a");
      expect(dealsLink).toHaveAttribute("href", "/deals");

      const conversationsLink = screen.getByText("Conversations").closest("a");
      expect(conversationsLink).toHaveAttribute("href", "/conversations");
    });
  });

  describe("Pipeline Value Section", () => {
    it("should display total pipeline value", () => {
      render(<Dashboard />);

      expect(screen.getByText("Pipeline Value")).toBeInTheDocument();
      expect(screen.getByText("$1,250,000")).toBeInTheDocument();
      expect(
        screen.getByText("Total value across all stages")
      ).toBeInTheDocument();
    });

    it("should display value breakdown by stage", () => {
      render(<Dashboard />);

      expect(screen.getByText("Lead")).toBeInTheDocument();
      expect(screen.getByText("$150,000")).toBeInTheDocument();

      expect(screen.getByText("Qualified")).toBeInTheDocument();
      expect(screen.getByText("$320,000")).toBeInTheDocument();

      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("$480,000")).toBeInTheDocument();

      expect(screen.getByText("Negotiation")).toBeInTheDocument();
      expect(screen.getByText("$300,000")).toBeInTheDocument();
    });

    it("should render View Pipeline button", () => {
      render(<Dashboard />);

      const viewPipelineBtn = screen.getByRole("button", {
        name: /view pipeline/i,
      });
      expect(viewPipelineBtn).toBeInTheDocument();

      const link = viewPipelineBtn.closest("a");
      expect(link).toHaveAttribute("href", "/deals");
    });
  });

  describe("Recent Activity Section", () => {
    it("should display recent activities", () => {
      render(<Dashboard />);

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(
        screen.getByText("Discovery call with Sarah Chen")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Proposal sent for Enterprise plan")
      ).toBeInTheDocument();
      expect(screen.getByText("Follow up on demo request")).toBeInTheDocument();
    });

    it("should display activity types", () => {
      render(<Dashboard />);

      expect(screen.getByText("Call")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Task")).toBeInTheDocument();
      expect(screen.getByText("Meeting")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    it("should display related entity names", () => {
      render(<Dashboard />);

      expect(screen.getByText(/TechCorp Inc/)).toBeInTheDocument();
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
      expect(screen.getByText(/John Smith/)).toBeInTheDocument();
    });

    it("should render View all button", () => {
      render(<Dashboard />);

      const activitySection = screen
        .getByText("Recent Activity")
        .closest("div");
      const viewAllBtn = within(activitySection!).getByText("View all");

      const link = viewAllBtn.closest("a");
      expect(link).toHaveAttribute("href", "/activities");
    });

    it("should display relative timestamps", () => {
      const { container } = render(<Dashboard />);

      // Should have time indicators like "15m ago", "2h ago", etc.
      const timeElements = container.querySelectorAll(
        '[class*="text-xs"][class*="text-muted-foreground"]'
      );
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Recent Deals Section", () => {
    it("should display recent deals", () => {
      render(<Dashboard />);

      expect(screen.getByText("Recent Deals")).toBeInTheDocument();
      expect(screen.getByText("Enterprise License")).toBeInTheDocument();
      expect(screen.getByText("Annual Subscription")).toBeInTheDocument();
      expect(screen.getByText("Startup Package")).toBeInTheDocument();
      expect(screen.getByText("Consulting Project")).toBeInTheDocument();
    });

    it("should display deal amounts", () => {
      render(<Dashboard />);

      expect(screen.getByText("$85,000")).toBeInTheDocument();
      expect(screen.getByText("$45,000")).toBeInTheDocument();
      expect(screen.getByText("$12,000")).toBeInTheDocument();
      expect(screen.getByText("$95,000")).toBeInTheDocument();
    });

    it("should display deal stages with badges", () => {
      render(<Dashboard />);

      expect(screen.getByText("Negotiation")).toBeInTheDocument();
      expect(screen.getByText("Proposal")).toBeInTheDocument();
      expect(screen.getByText("Qualified")).toBeInTheDocument();
      expect(screen.getByText("Lead")).toBeInTheDocument();
    });

    it("should display associated companies", () => {
      render(<Dashboard />);

      const dealSection = screen.getByText("Recent Deals").closest("div");
      expect(within(dealSection!).getByText(/TechCorp Inc/)).toBeInTheDocument();
      expect(within(dealSection!).getByText(/Acme Corp/)).toBeInTheDocument();
      expect(within(dealSection!).getByText(/StartupXYZ/)).toBeInTheDocument();
    });

    it("should render View all button for deals", () => {
      render(<Dashboard />);

      const dealsSection = screen.getByText("Recent Deals").closest("div");
      const viewAllBtn = within(dealsSection!).getByText("View all");

      const link = viewAllBtn.closest("a");
      expect(link).toHaveAttribute("href", "/deals");
    });
  });

  describe("Upcoming Tasks Section", () => {
    it("should display upcoming tasks", () => {
      render(<Dashboard />);

      expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
      expect(screen.getByText("Call back Sarah Chen")).toBeInTheDocument();
      expect(screen.getByText("Send proposal to Acme")).toBeInTheDocument();
      expect(screen.getByText("Review contract terms")).toBeInTheDocument();
      expect(
        screen.getByText("Schedule demo for TechCorp")
      ).toBeInTheDocument();
    });

    it("should display task due dates", () => {
      render(<Dashboard />);

      expect(screen.getByText("Today, 2:00 PM")).toBeInTheDocument();
      expect(screen.getByText("Today, 5:00 PM")).toBeInTheDocument();
      expect(screen.getByText("Tomorrow, 10:00 AM")).toBeInTheDocument();
      expect(screen.getByText("Tomorrow, 3:00 PM")).toBeInTheDocument();
    });

    it("should display task priority badges", () => {
      render(<Dashboard />);

      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getAllByText("medium")).toHaveLength(2);
      expect(screen.getByText("low")).toBeInTheDocument();
    });

    it("should render task checkboxes", () => {
      const { container } = render(<Dashboard />);

      const checkboxes = container.querySelectorAll(
        'button[class*="rounded-full"]'
      );
      expect(checkboxes.length).toBeGreaterThan(4);
    });

    it("should render View all button for tasks", () => {
      render(<Dashboard />);

      const tasksSection = screen.getByText("Upcoming Tasks").closest("div");
      const viewAllBtn = within(tasksSection!).getByText("View all");

      const link = viewAllBtn.closest("a");
      expect(link).toHaveAttribute("href", "/activities");
    });
  });

  describe("Quick Actions Section", () => {
    it("should display all quick action buttons", () => {
      render(<Dashboard />);

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Add Contact")).toBeInTheDocument();
      expect(screen.getByText("Add Company")).toBeInTheDocument();
      expect(screen.getByText("Create Deal")).toBeInTheDocument();
      expect(screen.getByText("Add Task")).toBeInTheDocument();
    });

    it("should link to correct routes", () => {
      render(<Dashboard />);

      const addContactBtn = screen.getByText("Add Contact");
      expect(addContactBtn.closest("a")).toHaveAttribute(
        "href",
        "/contacts/new"
      );

      const addCompanyBtn = screen.getByText("Add Company");
      expect(addCompanyBtn.closest("a")).toHaveAttribute(
        "href",
        "/companies/new"
      );

      const createDealBtn = screen.getByText("Create Deal");
      expect(createDealBtn.closest("a")).toHaveAttribute("href", "/deals/new");

      const addTaskBtn = screen.getByText("Add Task");
      expect(addTaskBtn.closest("a")).toHaveAttribute(
        "href",
        "/activities/new"
      );
    });

    it("should render action icons", () => {
      const { container } = render(<Dashboard />);

      const quickActionsSection = screen
        .getByText("Quick Actions")
        .closest("div");
      const icons = within(quickActionsSection!).getAllByRole("img", {
        hidden: true,
      });
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Responsive Layout", () => {
    it("should use grid layout for stats", () => {
      const { container } = render(<Dashboard />);

      const statsGrid = container.querySelector('[class*="grid"]');
      expect(statsGrid).toBeInTheDocument();
    });

    it("should have proper spacing between sections", () => {
      const { container } = render(<Dashboard />);

      const mainContainer = container.querySelector('[class*="space-y"]');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should handle undefined query results gracefully", () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      render(<Dashboard />);

      // Should still render with placeholder data
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible card structure", () => {
      render(<Dashboard />);

      const cards = screen.getAllByRole("link").filter((el) => {
        const parent = el.closest("div");
        return parent?.className?.includes("Card");
      });

      expect(cards.length).toBeGreaterThan(0);
    });

    it("should have accessible buttons", () => {
      render(<Dashboard />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it("should use semantic HTML", () => {
      const { container } = render(<Dashboard />);

      // Check for heading
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });
  });

  describe("Data Integration", () => {
    it("should display formatted currency values", () => {
      render(<Dashboard />);

      // Check for currency formatting
      const currencyValues = [
        "$1,250,000",
        "$150,000",
        "$320,000",
        "$480,000",
        "$300,000",
        "$85,000",
        "$45,000",
        "$12,000",
        "$95,000",
      ];

      currencyValues.forEach((value) => {
        expect(screen.getByText(value)).toBeInTheDocument();
      });
    });

    it("should handle empty data states", () => {
      vi.mocked(useQuery).mockReturnValue([]);

      render(<Dashboard />);

      // Should still render dashboard structure
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should handle stat card clicks", async () => {
      const { user } = render(<Dashboard />);

      const contactsCard = screen.getByText("Total Contacts").closest("a");
      expect(contactsCard).toHaveAttribute("href", "/contacts");
    });

    it("should handle quick action clicks", async () => {
      const { user } = render(<Dashboard />);

      const addContactBtn = screen.getByText("Add Contact").closest("a");
      expect(addContactBtn).toHaveAttribute("href", "/contacts/new");
    });

    it("should handle view all links", async () => {
      const { user } = render(<Dashboard />);

      const viewAllLinks = screen.getAllByText("View all");
      expect(viewAllLinks.length).toBeGreaterThan(0);

      viewAllLinks.forEach((link) => {
        const anchor = link.closest("a");
        expect(anchor).toHaveAttribute("href");
      });
    });
  });
});
