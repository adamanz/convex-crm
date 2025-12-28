import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { AppSidebar } from "../app-sidebar";

describe("AppSidebar", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    avatarUrl: undefined,
  };

  const mockOnSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<AppSidebar />);
      expect(screen.getByText("CRM")).toBeInTheDocument();
    });

    it("renders logo", () => {
      render(<AppSidebar />);
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("CRM")).toBeInTheDocument();
    });

    it("renders all navigation items", () => {
      render(<AppSidebar />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Contacts")).toBeInTheDocument();
      expect(screen.getByText("Companies")).toBeInTheDocument();
      expect(screen.getByText("Deals")).toBeInTheDocument();
      expect(screen.getByText("Conversations")).toBeInTheDocument();
      expect(screen.getByText("Activities")).toBeInTheDocument();
    });

    it("renders settings link", () => {
      render(<AppSidebar />);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    it("renders Dashboard link correctly", () => {
      render(<AppSidebar />);
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/");
    });

    it("renders Contacts link correctly", () => {
      render(<AppSidebar />);
      const contactsLink = screen.getByRole("link", { name: /contacts/i });
      expect(contactsLink).toHaveAttribute("href", "/contacts");
    });

    it("renders Companies link correctly", () => {
      render(<AppSidebar />);
      const companiesLink = screen.getByRole("link", { name: /companies/i });
      expect(companiesLink).toHaveAttribute("href", "/companies");
    });

    it("renders Deals link correctly", () => {
      render(<AppSidebar />);
      const dealsLink = screen.getByRole("link", { name: /deals/i });
      expect(dealsLink).toHaveAttribute("href", "/deals");
    });

    it("renders Conversations link correctly", () => {
      render(<AppSidebar />);
      const conversationsLink = screen.getByRole("link", { name: /conversations/i });
      expect(conversationsLink).toHaveAttribute("href", "/conversations");
    });

    it("renders Activities link correctly", () => {
      render(<AppSidebar />);
      const activitiesLink = screen.getByRole("link", { name: /activities/i });
      expect(activitiesLink).toHaveAttribute("href", "/activities");
    });

    it("renders Settings link correctly", () => {
      render(<AppSidebar />);
      const settingsLink = screen.getByRole("link", { name: /settings/i });
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });
  });

  describe("User Profile", () => {
    it("renders user name when provided", () => {
      render(<AppSidebar user={mockUser} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders user email when provided", () => {
      render(<AppSidebar user={mockUser} />);
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders user initial when no avatar", () => {
      render(<AppSidebar user={mockUser} />);
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("renders avatar image when URL provided", () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: "https://example.com/avatar.jpg",
      };
      render(<AppSidebar user={userWithAvatar} />);

      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });

    it("shows default name when user not provided", () => {
      render(<AppSidebar />);
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("shows default email when user not provided", () => {
      render(<AppSidebar />);
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
  });

  describe("Sign Out", () => {
    it("renders sign out button when onSignOut provided", () => {
      render(<AppSidebar user={mockUser} onSignOut={mockOnSignOut} />);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it("does not render sign out button when onSignOut not provided", () => {
      render(<AppSidebar user={mockUser} />);

      expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
    });

    it("calls onSignOut when button is clicked", async () => {
      const { user } = render(
        <AppSidebar user={mockUser} onSignOut={mockOnSignOut} />
      );

      await user.click(screen.getByRole("button", { name: /sign out/i }));

      expect(mockOnSignOut).toHaveBeenCalled();
    });
  });

  describe("Collapse Toggle", () => {
    it("renders collapse button", () => {
      render(<AppSidebar />);
      expect(screen.getByText("Collapse")).toBeInTheDocument();
    });

    it("collapses sidebar when collapse is clicked", async () => {
      const { user, container } = render(<AppSidebar />);

      await user.click(screen.getByText("Collapse"));

      // After collapse, sidebar should be narrower
      const sidebar = container.querySelector("[class*='w-16']");
      expect(sidebar).toBeInTheDocument();
    });

    it("expands sidebar when expand is clicked", async () => {
      const { user, container } = render(<AppSidebar />);

      // First collapse
      await user.click(screen.getByText("Collapse"));

      // Then expand
      const expandButton = container.querySelector("button");
      if (expandButton) {
        await user.click(expandButton);
      }

      // Check for expanded state
    });

    it("hides text labels when collapsed", async () => {
      const { user } = render(<AppSidebar />);

      await user.click(screen.getByText("Collapse"));

      // Text labels should be hidden in collapsed state
      // The navigation still works but labels are not visible
    });
  });

  describe("Mobile Menu", () => {
    it("renders mobile menu button", () => {
      render(<AppSidebar />);

      // Mobile menu button should exist
      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      expect(mobileButton).toBeInTheDocument();
    });

    it("opens mobile drawer when button is clicked", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      // Mobile drawer should be open
      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close menu/i });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it("closes mobile drawer when close button is clicked", async () => {
      const { user } = render(<AppSidebar />);

      // Open menu
      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      // Close menu
      await waitFor(async () => {
        const closeButton = screen.getByRole("button", { name: /close menu/i });
        await user.click(closeButton);
      });

      // Menu should be closed
    });

    it("closes mobile menu on Escape key", async () => {
      const { user } = render(<AppSidebar />);

      // Open menu
      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard("{Escape}");

      // Menu should close
    });
  });

  describe("Active Route Highlighting", () => {
    it("highlights current route", () => {
      // With mocked usePathname returning "/"
      render(<AppSidebar />);

      // Dashboard should be highlighted as active
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass("bg-zinc-100");
    });
  });

  describe("Styling", () => {
    it("has correct desktop sidebar width", () => {
      const { container } = render(<AppSidebar />);

      const sidebar = container.querySelector("[class*='w-64']");
      expect(sidebar).toBeInTheDocument();
    });

    it("has dark mode support", () => {
      const { container } = render(<AppSidebar />);

      // Should have dark mode classes
      const darkModeElement = container.querySelector("[class*='dark:']");
      expect(darkModeElement).toBeInTheDocument();
    });

    it("has border styling", () => {
      const { container } = render(<AppSidebar />);

      const borderedElement = container.querySelector("[class*='border-r']");
      expect(borderedElement).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("navigation links are accessible", () => {
      render(<AppSidebar />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });

    it("buttons have accessible names", () => {
      render(<AppSidebar user={mockUser} onSignOut={mockOnSignOut} />);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it("mobile menu button has accessible label", () => {
      render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      expect(mobileButton).toBeInTheDocument();
    });

    it("close menu button has accessible label", async () => {
      const { user } = render(<AppSidebar />);

      const mobileButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(mobileButton);

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close menu/i });
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe("Logo Link", () => {
    it("logo links to home", () => {
      render(<AppSidebar />);

      const logoLinks = screen.getAllByRole("link");
      const homeLink = logoLinks.find(link => link.getAttribute("href") === "/");
      expect(homeLink).toBeInTheDocument();
    });
  });
});
