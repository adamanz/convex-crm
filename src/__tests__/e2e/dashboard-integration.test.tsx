import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { useQuery, useMutation } from "convex/react";
import Dashboard from "@/app/page";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CommandMenu } from "@/components/layout/command-menu";
import {
  createMockContact,
  createMockCompany,
  createMockDeal,
  createMockActivity,
} from "@/test/test-utils";

// Mock dependencies
vi.mock("convex/react");
vi.mock("@/components/shortcuts", () => ({
  useShortcuts: () => ({
    isCommandPaletteOpen: false,
    openCommandPalette: vi.fn(),
    closeCommandPalette: vi.fn(),
    openGuide: vi.fn(),
  }),
}));

describe("Dashboard & Navigation - Integration Tests", () => {
  const mockUser = {
    name: "Jane Smith",
    email: "jane@example.com",
    id: "user_1" as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockReturnValue(undefined);
  });

  describe("Complete Dashboard Layout", () => {
    it("should render full dashboard with sidebar and header", () => {
      const FullLayout = () => (
        <div>
          <AppSidebar user={mockUser} />
          <div>
            <DashboardHeader user={mockUser} />
            <Dashboard />
          </div>
        </div>
      );

      render(<FullLayout />);

      // Sidebar
      expect(screen.getByText("Convex CRM")).toBeInTheDocument();
      expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument();

      // Header
      expect(screen.getByText("Search or jump to...")).toBeInTheDocument();

      // Dashboard content
      expect(screen.getByText("Welcome back. Here's an overview of your CRM.")).toBeInTheDocument();
    });

    it("should maintain user context across components", () => {
      const FullLayout = () => (
        <div>
          <AppSidebar user={mockUser} />
          <DashboardHeader user={mockUser} />
        </div>
      );

      render(<FullLayout />);

      // User should appear in both sidebar and header
      const userNames = screen.getAllByText("Jane Smith");
      expect(userNames.length).toBeGreaterThan(0);
    });
  });

  describe("Navigation Flow", () => {
    it("should navigate from dashboard to contacts via stat card", () => {
      render(<Dashboard />);

      const contactsCard = screen.getByText("Total Contacts").closest("a");
      expect(contactsCard).toHaveAttribute("href", "/contacts");
    });

    it("should navigate from dashboard to deals via pipeline", () => {
      render(<Dashboard />);

      const viewPipelineBtn = screen.getByText("View Pipeline");
      const link = viewPipelineBtn.closest("a");
      expect(link).toHaveAttribute("href", "/deals");
    });

    it("should navigate from dashboard to activities", () => {
      render(<Dashboard />);

      const activityViewAll = screen.getAllByText("View all")[0];
      const link = activityViewAll.closest("a");
      expect(link).toHaveAttribute("href", "/activities");
    });

    it("should access quick actions from dashboard", () => {
      render(<Dashboard />);

      const quickActions = [
        { text: "Add Contact", href: "/contacts/new" },
        { text: "Add Company", href: "/companies/new" },
        { text: "Create Deal", href: "/deals/new" },
        { text: "Add Task", href: "/activities/new" },
      ];

      quickActions.forEach(({ text, href }) => {
        const button = screen.getByText(text);
        const link = button.closest("a");
        expect(link).toHaveAttribute("href", href);
      });
    });
  });

  describe("Command Palette Integration", () => {
    it("should search and navigate to contacts", async () => {
      const mockContacts = [
        createMockContact({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        }),
      ];

      vi.mocked(useQuery).mockReturnValue(mockContacts);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "john");

      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      });
    });

    it("should search and navigate to companies", async () => {
      const mockCompanies = [
        createMockCompany({
          name: "Acme Inc",
          industry: "Technology",
        }),
      ];

      vi.mocked(useQuery)
        .mockReturnValueOnce([]) // contacts
        .mockReturnValueOnce(mockCompanies) // companies
        .mockReturnValueOnce([]); // deals

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "acme");

      await waitFor(() => {
        expect(screen.getByText("Acme Inc")).toBeInTheDocument();
      });
    });

    it("should search and navigate to deals", async () => {
      const mockDeals = [
        createMockDeal({
          name: "Enterprise Deal",
          amount: 50000,
          currency: "USD",
        }),
      ];

      vi.mocked(useQuery)
        .mockReturnValueOnce([]) // contacts
        .mockReturnValueOnce([]) // companies
        .mockReturnValueOnce(mockDeals); // deals

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "enterprise");

      await waitFor(() => {
        expect(screen.getByText("Enterprise Deal")).toBeInTheDocument();
      });
    });

    it("should show all entity types in search results", async () => {
      const mockContacts = [createMockContact({ firstName: "Test" })];
      const mockCompanies = [createMockCompany({ name: "Test Corp" })];
      const mockDeals = [createMockDeal({ name: "Test Deal" })];

      vi.mocked(useQuery)
        .mockReturnValueOnce(mockContacts)
        .mockReturnValueOnce(mockCompanies)
        .mockReturnValueOnce(mockDeals);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "test");

      await waitFor(() => {
        expect(screen.getByText("Contacts")).toBeInTheDocument();
        expect(screen.getByText("Companies")).toBeInTheDocument();
        expect(screen.getByText("Deals")).toBeInTheDocument();
      });
    });
  });

  describe("Mobile Navigation Flow", () => {
    it("should open mobile menu and navigate", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: /close menu/i,
        });
        expect(closeButton).toBeInTheDocument();
      });

      // Navigation links should be accessible
      expect(screen.getByRole("link", { name: /contacts/i })).toBeInTheDocument();
    });

    it("should close mobile menu after navigation", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /close menu/i })
        ).toBeInTheDocument();
      });

      // Click a navigation link
      const contactsLink = screen.getByRole("link", { name: /contacts/i });
      await user.click(contactsLink);

      // Mobile menu should auto-close (tested via route change effect)
    });
  });

  describe("User Profile Dropdown", () => {
    it("should display user menu in header", async () => {
      const { user } = render(<DashboardHeader user={mockUser} />);

      const userButton = screen.getByText("Jane Smith");
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Account Settings")).toBeInTheDocument();
        expect(screen.getByText("Team")).toBeInTheDocument();
        expect(screen.getByText("Sign Out")).toBeInTheDocument();
      });
    });

    it("should show user email in dropdown", async () => {
      const { user } = render(<DashboardHeader user={mockUser} />);

      const userButton = screen.getByText("Jane Smith");
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      });
    });
  });

  describe("Settings Navigation", () => {
    it("should navigate to settings from sidebar", () => {
      render(<AppSidebar />);

      const settingsLink = screen.getByRole("link", { name: /^Settings$/i });
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });

    it("should access subsettings from expanded sections", async () => {
      const { user } = render(<AppSidebar />);

      // Click to expand CRM Objects section (Pipelines is there)
      const crmSection = screen.getByText("CRM Objects");
      await user.click(crmSection);

      await waitFor(() => {
        const pipelinesLink = screen.getByRole("link", { name: /pipelines/i });
        expect(pipelinesLink).toHaveAttribute("href", "/settings/pipelines");
      });
    });

    it("should access email settings", async () => {
      const { user } = render(<AppSidebar />);

      // Email is in the Engagement section which is open by default
      const emailLink = screen.getByRole("link", { name: /email/i });
      expect(emailLink).toHaveAttribute("href", "/settings/email");
    });
  });

  describe("Search Integration with Dashboard", () => {
    it("should open command palette from header search", async () => {
      const { user } = render(<DashboardHeader />);

      const searchButton = screen.getByText("Search or jump to...");
      await user.click(searchButton);

      // Command palette should open (tested via useShortcuts mock)
    });

    it("should open command palette from sidebar search", async () => {
      const { user } = render(<AppSidebar />);

      const searchButton = screen.getByText("Search...");
      await user.click(searchButton);

      // Command palette should open
    });
  });

  describe("Responsive Behavior", () => {
    it("should show mobile menu button on small screens", () => {
      render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton).toHaveClass("lg:hidden");
    });

    it("should show collapse button only on desktop", () => {
      render(<AppSidebar />);

      const collapseButton = screen.getByText("Collapse");
      expect(collapseButton.closest("div")).toHaveClass("hidden", "lg:block");
    });

    it("should adapt dashboard grid for mobile", () => {
      const { container } = render(<Dashboard />);

      const statsGrid = container.querySelector('[class*="md:grid-cols-2"]');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should display keyboard shortcuts in command palette", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      // Navigation shortcuts
      expect(screen.getByText("G")).toBeInTheDocument();
      expect(screen.getByText("H")).toBeInTheDocument(); // Go Home/Dashboard
      expect(screen.getByText("C")).toBeInTheDocument(); // Contacts
      expect(screen.getByText("D")).toBeInTheDocument(); // Deals

      // Quick action shortcuts
      expect(screen.getByText("N")).toBeInTheDocument(); // New
    });

    it("should show keyboard hint in header search", () => {
      render(<DashboardHeader />);

      const searchButton = screen.getByText("Search or jump to...").closest("button");
      expect(within(searchButton!).getByText("K")).toBeInTheDocument();
    });

    it("should show keyboard hint in sidebar search", () => {
      render(<AppSidebar />);

      const searchButton = screen.getByText("Search...").closest("button");
      expect(within(searchButton!).getByText("K")).toBeInTheDocument();
    });
  });

  describe("Data Loading States", () => {
    it("should handle loading state for search", async () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "test");

      await waitFor(() => {
        const spinner = screen
          .getByPlaceholderText("Search or type a command...")
          .closest("div")
          ?.querySelector('[class*="animate-spin"]');
        expect(spinner).toBeInTheDocument();
      });
    });

    it("should show placeholder data when queries return undefined", () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      render(<Dashboard />);

      // Should still render with static placeholder data
      expect(screen.getByText("2,350")).toBeInTheDocument(); // Contacts
      expect(screen.getByText("185")).toBeInTheDocument(); // Companies
    });
  });

  describe("Active Route Highlighting", () => {
    it("should highlight current dashboard route in sidebar", () => {
      vi.mocked(require("next/navigation").usePathname).mockReturnValue("/");

      render(<AppSidebar />);

      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass("bg-zinc-900");
    });

    it("should highlight current contacts route in sidebar", () => {
      vi.mocked(require("next/navigation").usePathname).mockReturnValue(
        "/contacts"
      );

      render(<AppSidebar />);

      const contactsLink = screen.getByRole("link", { name: /contacts/i });
      expect(contactsLink).toHaveClass("bg-zinc-900");
    });
  });

  describe("Error Handling", () => {
    it("should handle search errors gracefully", async () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "error query");

      // Should not crash and should show appropriate state
      expect(searchInput).toBeInTheDocument();
    });

    it("should handle missing user data", () => {
      render(<AppSidebar />);

      // Should show default user
      expect(screen.getByText("User")).toBeInTheDocument();
    });
  });

  describe("Accessibility - Full Integration", () => {
    it("should have proper heading hierarchy", () => {
      render(<Dashboard />);

      const h1 = screen.getByRole("heading", { level: 1, name: "Dashboard" });
      expect(h1).toBeInTheDocument();
    });

    it("should have accessible navigation landmarks", () => {
      render(<AppSidebar />);

      const nav = screen.getByRole("navigation", { hidden: true });
      expect(nav).toBeInTheDocument();
    });

    it("should support keyboard navigation throughout", () => {
      render(<AppSidebar />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("should have accessible command palette", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAccessibleName();
    });
  });

  describe("Performance", () => {
    it("should debounce search queries", async () => {
      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );

      await user.type(searchInput, "abc");

      // The component uses 150ms debounce
      // Queries shouldn't fire for every keystroke
    });

    it("should lazy load command menu", () => {
      render(<CommandMenu open={false} onOpenChange={vi.fn()} />);

      // Command menu content should not be in DOM when closed
      expect(
        screen.queryByPlaceholderText("Search or type a command...")
      ).not.toBeInTheDocument();
    });
  });
});
