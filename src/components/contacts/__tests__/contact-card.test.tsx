import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ContactCard } from "../contact-card";
import { createMockContactWithCompany } from "@/test/test-utils";

describe("ContactCard", () => {
  const mockContact = createMockContactWithCompany();

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<ContactCard contact={mockContact} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders full name correctly", () => {
      render(<ContactCard contact={mockContact} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders first name only when last name is missing", () => {
      const contactWithoutLastName = {
        ...mockContact,
        lastName: "",
      };
      render(<ContactCard contact={contactWithoutLastName} />);
      expect(screen.getByText("John")).toBeInTheDocument();
    });

    it("renders email with mailto link", () => {
      render(<ContactCard contact={mockContact} />);
      const emailLink = screen.getByRole("link", { name: /john.doe@example.com/i });
      expect(emailLink).toHaveAttribute("href", "mailto:john.doe@example.com");
    });

    it("renders phone with tel link", () => {
      render(<ContactCard contact={mockContact} />);
      const phoneLink = screen.getByRole("link", { name: /555/i });
      expect(phoneLink).toHaveAttribute("href", "tel:+1 (555) 123-4567");
    });

    it("renders title and company", () => {
      render(<ContactCard contact={mockContact} />);
      expect(screen.getByText(/software engineer/i)).toBeInTheDocument();
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    });

    it("renders company name in details section", () => {
      render(<ContactCard contact={mockContact} />);
      // Company name appears in the subtitle and in the details
      const companyElements = screen.getAllByText("Acme Inc");
      expect(companyElements.length).toBeGreaterThan(0);
    });
  });

  describe("Avatar", () => {
    it("renders avatar with initials when no avatar URL", () => {
      const contactWithoutAvatar = {
        ...mockContact,
        avatarUrl: undefined,
      };
      render(<ContactCard contact={contactWithoutAvatar} />);
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("renders avatar image when URL is provided", () => {
      const contactWithAvatar = {
        ...mockContact,
        avatarUrl: "https://example.com/avatar.jpg",
      };
      render(<ContactCard contact={contactWithAvatar} />);
      const avatar = screen.getByRole("img", { hidden: true });
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });
  });

  describe("Tags", () => {
    it("renders tags", () => {
      render(<ContactCard contact={mockContact} />);
      expect(screen.getByText("vip")).toBeInTheDocument();
      expect(screen.getByText("enterprise")).toBeInTheDocument();
    });

    it("limits displayed tags to 3", () => {
      const contactWithManyTags = {
        ...mockContact,
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
      };
      render(<ContactCard contact={contactWithManyTags} />);

      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.getByText("tag3")).toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("does not render tags section when no tags", () => {
      const contactWithoutTags = {
        ...mockContact,
        tags: [],
      };
      render(<ContactCard contact={contactWithoutTags} />);
      expect(screen.queryByText("vip")).not.toBeInTheDocument();
    });
  });

  describe("Last Activity", () => {
    it("renders last activity time", () => {
      render(<ContactCard contact={mockContact} />);
      expect(screen.getByText(/last activity/i)).toBeInTheDocument();
    });

    it("does not render last activity when not available", () => {
      const contactWithoutActivity = {
        ...mockContact,
        lastActivityAt: undefined,
      };
      render(<ContactCard contact={contactWithoutActivity} />);
      expect(screen.queryByText(/last activity/i)).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("calls onClick when card is clicked", async () => {
      const handleClick = vi.fn();
      const { user } = render(<ContactCard contact={mockContact} onClick={handleClick} />);

      await user.click(screen.getByText("John Doe"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not propagate click from email link", async () => {
      const handleClick = vi.fn();
      const { user } = render(<ContactCard contact={mockContact} onClick={handleClick} />);

      const emailLink = screen.getByRole("link", { name: /john.doe@example.com/i });
      await user.click(emailLink);

      // Click should be stopped from propagating
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not propagate click from phone link", async () => {
      const handleClick = vi.fn();
      const { user } = render(<ContactCard contact={mockContact} onClick={handleClick} />);

      const phoneLink = screen.getByRole("link", { name: /555/i });
      await user.click(phoneLink);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <ContactCard contact={mockContact} className="custom-class" />
      );
      const card = container.firstChild;
      expect(card).toHaveClass("custom-class");
    });

    it("has hover styles", () => {
      const { container } = render(<ContactCard contact={mockContact} />);
      const card = container.firstChild;
      expect(card).toHaveClass("hover:shadow-md");
    });

    it("has cursor pointer for clickable card", () => {
      const { container } = render(<ContactCard contact={mockContact} onClick={() => {}} />);
      const card = container.firstChild;
      expect(card).toHaveClass("cursor-pointer");
    });
  });

  describe("Edge Cases", () => {
    it("renders without company", () => {
      const contactWithoutCompany = {
        ...mockContact,
        company: null,
        companyId: undefined,
      };
      render(<ContactCard contact={contactWithoutCompany} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders without email", () => {
      const contactWithoutEmail = {
        ...mockContact,
        email: undefined,
      };
      render(<ContactCard contact={contactWithoutEmail} />);
      expect(screen.queryByRole("link", { name: /example.com/i })).not.toBeInTheDocument();
    });

    it("renders without phone", () => {
      const contactWithoutPhone = {
        ...mockContact,
        phone: undefined,
      };
      render(<ContactCard contact={contactWithoutPhone} />);
      expect(screen.queryByRole("link", { name: /555/i })).not.toBeInTheDocument();
    });

    it("renders without title", () => {
      const contactWithoutTitle = {
        ...mockContact,
        title: undefined,
      };
      render(<ContactCard contact={contactWithoutTitle} />);
      // Should still render company name
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("email link is accessible", () => {
      render(<ContactCard contact={mockContact} />);
      const emailLink = screen.getByRole("link", { name: /john.doe@example.com/i });
      expect(emailLink).toBeInTheDocument();
    });

    it("phone link is accessible", () => {
      render(<ContactCard contact={mockContact} />);
      const phoneLink = screen.getByRole("link", { name: /555/i });
      expect(phoneLink).toBeInTheDocument();
    });
  });
});
