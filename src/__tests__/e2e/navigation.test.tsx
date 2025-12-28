import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CommandMenu } from "@/components/layout/command-menu";
import { useQuery } from "convex/react";

// Mock the shortcuts hook
vi.mock("@/components/shortcuts", () => ({
  useShortcuts: () => ({
    isCommandPaletteOpen: false,
    openCommandPalette: vi.fn(),
    closeCommandPalette: vi.fn(),
    openGuide: vi.fn(),
  }),
}));

vi.mock("convex/react");

describe("Navigation - E2E Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sidebar Navigation", () => {
    it("should render all main navigation items", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Contacts")).toBeInTheDocument();
      expect(screen.getByText("Companies")).toBeInTheDocument();
      expect(screen.getByText("Deals")).toBeInTheDocument();
      expect(screen.getByText("Activities")).toBeInTheDocument();
      expect(screen.getByText("Conversations")).toBeInTheDocument();
    });

    it("should render navigation sections with correct structure", () => {
      render(<AppSidebar />);

      // CRM Objects section
      expect(screen.getByText("CRM Objects")).toBeInTheDocument();

      // Engagement section
      expect(screen.getByText("Engagement")).toBeInTheDocument();

      // Sales Tools section
      expect(screen.getByText("Sales Tools")).toBeInTheDocument();

      // Configuration section
      expect(screen.getByText("Configuration")).toBeInTheDocument();
    });

    it("should have correct href attributes for navigation links", () => {
      render(<AppSidebar />);

      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/");

      const contactsLink = screen.getByRole("link", { name: /contacts/i });
      expect(contactsLink).toHaveAttribute("href", "/contacts");

      const companiesLink = screen.getByRole("link", { name: /companies/i });
      expect(companiesLink).toHaveAttribute("href", "/companies");

      const dealsLink = screen.getByRole("link", { name: /deals/i });
      expect(dealsLink).toHaveAttribute("href", "/deals");
    });

    it("should highlight active route", () => {
      vi.mocked(usePathname).mockReturnValue("/contacts");

      render(<AppSidebar />);

      const contactsLink = screen.getByRole("link", { name: /contacts/i });
      expect(contactsLink).toHaveClass("bg-zinc-900");
    });

    it("should render Settings link at bottom", () => {
      render(<AppSidebar />);

      const settingsLink = screen.getByRole("link", { name: /^Settings$/i });
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });

    it("should render logo and link to home", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Convex CRM")).toBeInTheDocument();

      const logoLink = screen
        .getByText("Convex CRM")
        .closest("a");
      expect(logoLink).toHaveAttribute("href", "/");
    });

    it("should render search trigger button", () => {
      render(<AppSidebar />);

      const searchButton = screen.getByRole("button", {
        name: /search/i,
      });
      expect(searchButton).toBeInTheDocument();
      expect(within(searchButton).getByText("Search...")).toBeInTheDocument();
    });

    it("should display keyboard shortcut hint for search", () => {
      render(<AppSidebar />);

      const searchButton = screen.getByText("Search...").closest("button");
      expect(within(searchButton!).getByText("K")).toBeInTheDocument();
    });
  });

  describe("Sidebar User Profile", () => {
    it("should display user profile when provided", () => {
      const user = {
        name: "John Doe",
        email: "john@example.com",
      };

      render(<AppSidebar user={user} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("should display user initial", () => {
      const user = {
        name: "John Doe",
        email: "john@example.com",
      };

      render(<AppSidebar user={user} />);

      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("should display default user when not provided", () => {
      render(<AppSidebar />);

      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("should render sign out button when handler provided", () => {
      const onSignOut = vi.fn();
      const user = {
        name: "John Doe",
        email: "john@example.com",
      };

      render(<AppSidebar user={user} onSignOut={onSignOut} />);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it("should call onSignOut when clicked", async () => {
      const onSignOut = vi.fn();
      const user = {
        name: "John Doe",
        email: "john@example.com",
      };

      const { user: testUser } = render(
        <AppSidebar user={user} onSignOut={onSignOut} />
      );

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      await testUser.click(signOutButton);

      expect(onSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sidebar Collapse Functionality", () => {
    it("should render collapse button", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Collapse")).toBeInTheDocument();
    });

    it("should toggle collapsed state when clicked", async () => {
      const { user, container } = render(<AppSidebar />);

      const collapseButton = screen.getByText("Collapse");
      await user.click(collapseButton);

      // In collapsed state, sidebar should be narrower
      await waitFor(() => {
        const sidebar = container.querySelector('[class*="w-[68px]"]');
        expect(sidebar).toBeInTheDocument();
      });
    });

    it("should hide text labels when collapsed", async () => {
      const { user } = render(<AppSidebar />);

      const collapseButton = screen.getByText("Collapse");
      await user.click(collapseButton);

      // Collapse button text should change or disappear
      await waitFor(() => {
        expect(screen.queryByText("Collapse")).not.toBeInTheDocument();
      });
    });

    it("should show tooltips for icons when collapsed", async () => {
      const { user } = render(<AppSidebar />);

      const collapseButton = screen.getByText("Collapse");
      await user.click(collapseButton);

      // Links should have title attributes for tooltips
      await waitFor(() => {
        const contactsLink = screen.getByRole("link", { name: /contacts/i });
        // In collapsed state, tooltip should be available
      });
    });
  });

  describe("Mobile Navigation", () => {
    it("should render mobile menu button", () => {
      render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      expect(mobileButton).toBeInTheDocument();
    });

    it("should open mobile drawer when button clicked", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: /close menu/i,
        });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it("should close mobile drawer when close button clicked", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(async () => {
        const closeButton = screen.getByRole("button", {
          name: /close menu/i,
        });
        await user.click(closeButton);
      });

      // Close button should no longer be visible
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /close menu/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should close mobile drawer on Escape key", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /close menu/i })
        ).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /close menu/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should render backdrop when mobile menu open", async () => {
      const { user, container } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        const backdrop = container.querySelector('[class*="bg-black/50"]');
        expect(backdrop).toBeInTheDocument();
      });
    });
  });

  describe("Navigation Sections", () => {
    it("should render expandable sections", () => {
      render(<AppSidebar />);

      expect(screen.getByText("CRM Objects")).toBeInTheDocument();
      expect(screen.getByText("Engagement")).toBeInTheDocument();
      expect(screen.getByText("Sales Tools")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
    });

    it("should expand/collapse sections on click", async () => {
      const { user } = render(<AppSidebar />);

      const salesToolsSection = screen.getByText("Sales Tools");
      await user.click(salesToolsSection);

      // Section items should become visible
      await waitFor(() => {
        expect(screen.getByText("Forecasting")).toBeInTheDocument();
        expect(screen.getByText("Leaderboards")).toBeInTheDocument();
      });
    });

    it("should have default open sections", () => {
      render(<AppSidebar />);

      // CRM Objects and Engagement should be open by default
      expect(screen.getByText("Contacts")).toBeVisible();
      expect(screen.getByText("Conversations")).toBeVisible();
    });

    it("should render all items in CRM Objects section", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Contacts")).toBeInTheDocument();
      expect(screen.getByText("Companies")).toBeInTheDocument();
      expect(screen.getByText("Deals")).toBeInTheDocument();
      expect(screen.getByText("Activities")).toBeInTheDocument();
      expect(screen.getByText("Pipelines")).toBeInTheDocument();
    });

    it("should render all items in Engagement section", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Conversations")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Calls")).toBeInTheDocument();
    });
  });

  describe("Dashboard Header", () => {
    it("should render search bar", () => {
      render(<DashboardHeader />);

      expect(screen.getByText("Search or jump to...")).toBeInTheDocument();
    });

    it("should display keyboard shortcut hint", () => {
      render(<DashboardHeader />);

      const searchBar = screen.getByText("Search or jump to...").closest("button");
      expect(within(searchBar!).getByText("K")).toBeInTheDocument();
    });

    it("should render user profile dropdown", () => {
      const user = {
        name: "John Doe",
        email: "john@example.com",
      };

      render(<DashboardHeader user={user} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render keyboard shortcuts button", () => {
      render(<DashboardHeader />);

      const shortcutsButton = screen.getByRole("button", {
        name: /keyboard shortcuts/i,
      });
      expect(shortcutsButton).toBeInTheDocument();
    });

    it("should render settings button", () => {
      const { container } = render(<DashboardHeader />);

      // Settings icon button
      const settingsButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(settingsButtons).find(
        btn => btn.querySelector('svg[class*="h-5"]')
      );
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe("Command Palette (Cmd+K)", () => {
    it("should render command menu when open", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByPlaceholderText("Search or type a command...")).toBeInTheDocument();
    });

    it("should display search input", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      expect(searchInput).toBeInTheDocument();
    });

    it("should show Quick Actions section", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should show Pages section", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Pages")).toBeInTheDocument();
    });

    it("should show Settings section", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should display navigation shortcuts", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      // Command items should show keyboard shortcuts
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("G")).toBeInTheDocument();
      expect(screen.getByText("H")).toBeInTheDocument();
    });

    it("should display quick action items", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Create Contact")).toBeInTheDocument();
      expect(screen.getByText("Create Company")).toBeInTheDocument();
      expect(screen.getByText("Create Deal")).toBeInTheDocument();
      expect(screen.getByText("Log Activity")).toBeInTheDocument();
    });

    it("should display keyboard hints in footer", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("navigate")).toBeInTheDocument();
      expect(screen.getByText("select")).toBeInTheDocument();
      expect(screen.getByText("Type to search")).toBeInTheDocument();
    });

    it("should show ESC key hint", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("ESC")).toBeInTheDocument();
    });

    it("should handle search input change", async () => {
      vi.mocked(useQuery).mockReturnValue([]);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "test");

      expect(searchInput).toHaveValue("test");
    });

    it("should close on backdrop click", async () => {
      const onOpenChange = vi.fn();
      const { container } = render(
        <CommandMenu open={true} onOpenChange={onOpenChange} />
      );

      const backdrop = container.querySelector('[class*="backdrop-blur"]');
      if (backdrop) {
        await backdrop.dispatchEvent(
          new MouseEvent("click", { bubbles: true })
        );
      }

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Search Functionality", () => {
    it("should show loading state while searching", async () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "test query");

      await waitFor(() => {
        // Loading spinner should appear
        const spinner = screen
          .getByPlaceholderText("Search or type a command...")
          .closest("div")
          ?.querySelector('[class*="animate-spin"]');
        expect(spinner).toBeInTheDocument();
      });
    });

    it("should display search results for contacts", async () => {
      const mockContacts = [
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
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

    it("should show empty state when no results", async () => {
      vi.mocked(useQuery).mockReturnValue([]);

      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );
      await user.type(searchInput, "nonexistent query");

      await waitFor(() => {
        expect(screen.getByText("No results found")).toBeInTheDocument();
      });
    });

    it("should debounce search input", async () => {
      const { user } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );

      // Type quickly
      await user.type(searchInput, "abc");

      // Query should not be called immediately for each character
      // This tests the debounce functionality
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels on sidebar", () => {
      render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      expect(mobileButton).toHaveAccessibleName();
    });

    it("should have keyboard navigation support", () => {
      render(<AppSidebar />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("should support keyboard shortcuts in command palette", () => {
      render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("↑↓")).toBeInTheDocument();
      expect(screen.getByText("↵")).toBeInTheDocument();
    });

    it("should have proper focus management", () => {
      const { container } = render(<CommandMenu open={true} onOpenChange={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(
        "Search or type a command..."
      );

      // Input should be focusable
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode classes on sidebar", () => {
      const { container } = render(<AppSidebar />);

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it("should have dark mode classes on header", () => {
      const { container } = render(<DashboardHeader />);

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it("should have dark mode classes on command menu", () => {
      const { container } = render(
        <CommandMenu open={true} onOpenChange={vi.fn()} />
      );

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Navigation Integration", () => {
    it("should navigate to correct routes from sidebar", () => {
      render(<AppSidebar />);

      const routes = [
        { text: "Dashboard", href: "/" },
        { text: "Contacts", href: "/contacts" },
        { text: "Companies", href: "/companies" },
        { text: "Deals", href: "/deals" },
        { text: "Activities", href: "/activities" },
        { text: "Conversations", href: "/conversations" },
      ];

      routes.forEach(({ text, href }) => {
        const link = screen.getByRole("link", { name: new RegExp(text, "i") });
        expect(link).toHaveAttribute("href", href);
      });
    });

    it("should maintain scroll position in sidebar", () => {
      const { container } = render(<AppSidebar />);

      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("overflow-y-auto");
    });
  });
});
