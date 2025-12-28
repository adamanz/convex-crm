import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CompanyCard, CompanyCardSkeleton } from "../company-card";
import { createMockCompany } from "@/test/test-utils";

describe("CompanyCard", () => {
  const mockCompany = createMockCompany();

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    });

    it("renders company name", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    });

    it("renders company domain", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText("acme.com")).toBeInTheDocument();
    });

    it("renders industry badge", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText("Technology")).toBeInTheDocument();
    });

    it("renders contact count", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText(/5 contacts/i)).toBeInTheDocument();
    });

    it("renders deal count", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText(/3 deals/i)).toBeInTheDocument();
    });

    it("renders as link", () => {
      render(<CompanyCard company={mockCompany} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `/companies/${mockCompany._id}`);
    });
  });

  describe("Company Logo", () => {
    it("renders logo when URL provided", () => {
      const companyWithLogo = {
        ...mockCompany,
        logoUrl: "https://example.com/logo.png",
      };
      render(<CompanyCard company={companyWithLogo} />);

      const logo = screen.getByRole("img");
      expect(logo).toHaveAttribute("src", "https://example.com/logo.png");
    });

    it("renders initials when no logo URL", () => {
      const companyWithoutLogo = {
        ...mockCompany,
        logoUrl: undefined,
      };
      render(<CompanyCard company={companyWithoutLogo} />);

      expect(screen.getByText("AI")).toBeInTheDocument(); // "Acme Inc" -> "AI"
    });
  });

  describe("Company Size", () => {
    it("renders size label", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText(/51-200 employees/i)).toBeInTheDocument();
    });

    it("handles different size values", () => {
      const largeCompany = {
        ...mockCompany,
        size: "1001-5000",
      };
      render(<CompanyCard company={largeCompany} />);
      expect(screen.getByText(/1K-5K employees/i)).toBeInTheDocument();
    });

    it("does not render size when not provided", () => {
      const companyWithoutSize = {
        ...mockCompany,
        size: undefined,
      };
      render(<CompanyCard company={companyWithoutSize} />);
      expect(screen.queryByText(/employees/i)).not.toBeInTheDocument();
    });
  });

  describe("Contact Count", () => {
    it("renders singular contact when count is 1", () => {
      const companySingleContact = {
        ...mockCompany,
        contactCount: 1,
      };
      render(<CompanyCard company={companySingleContact} />);
      expect(screen.getByText(/1 contact$/i)).toBeInTheDocument();
    });

    it("renders plural contacts when count is greater than 1", () => {
      render(<CompanyCard company={mockCompany} />);
      expect(screen.getByText(/5 contacts/i)).toBeInTheDocument();
    });

    it("shows 0 contacts when contactCount is undefined", () => {
      const companyNoContacts = {
        ...mockCompany,
        contactCount: undefined,
      };
      render(<CompanyCard company={companyNoContacts} />);
      expect(screen.getByText(/0 contacts/i)).toBeInTheDocument();
    });
  });

  describe("Deal Count", () => {
    it("renders singular deal when count is 1", () => {
      const companySingleDeal = {
        ...mockCompany,
        dealCount: 1,
      };
      render(<CompanyCard company={companySingleDeal} />);
      expect(screen.getByText(/1 deal$/i)).toBeInTheDocument();
    });

    it("does not render deals section when count is 0", () => {
      const companyNoDeals = {
        ...mockCompany,
        dealCount: 0,
      };
      render(<CompanyCard company={companyNoDeals} />);
      expect(screen.queryByText(/deal/i)).not.toBeInTheDocument();
    });
  });

  describe("Optional Fields", () => {
    it("renders without domain", () => {
      const companyWithoutDomain = {
        ...mockCompany,
        domain: undefined,
      };
      render(<CompanyCard company={companyWithoutDomain} />);
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
      expect(screen.queryByText("acme.com")).not.toBeInTheDocument();
    });

    it("renders without industry", () => {
      const companyWithoutIndustry = {
        ...mockCompany,
        industry: undefined,
      };
      render(<CompanyCard company={companyWithoutIndustry} />);
      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
      expect(screen.queryByText("Technology")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <CompanyCard company={mockCompany} className="custom-class" />
      );
      const link = container.firstChild;
      expect(link).toHaveClass("custom-class");
    });

    it("has hover effects", () => {
      const { container } = render(<CompanyCard company={mockCompany} />);
      const link = container.firstChild;
      expect(link).toHaveClass("hover:shadow-md");
    });

    it("has rounded corners", () => {
      const { container } = render(<CompanyCard company={mockCompany} />);
      const link = container.firstChild;
      expect(link).toHaveClass("rounded-xl");
    });

    it("has border", () => {
      const { container } = render(<CompanyCard company={mockCompany} />);
      const link = container.firstChild;
      expect(link).toHaveClass("border");
    });
  });

  describe("Accessibility", () => {
    it("is navigable as link", () => {
      render(<CompanyCard company={mockCompany} />);
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("logo has alt text", () => {
      const companyWithLogo = {
        ...mockCompany,
        logoUrl: "https://example.com/logo.png",
      };
      render(<CompanyCard company={companyWithLogo} />);

      const logo = screen.getByRole("img");
      expect(logo).toHaveAttribute("alt", "Acme Inc");
    });
  });
});

describe("CompanyCardSkeleton", () => {
  it("renders without errors", () => {
    const { container } = render(<CompanyCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders skeleton elements with animation", () => {
    const { container } = render(<CompanyCardSkeleton />);
    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("has same structure as CompanyCard", () => {
    const { container } = render(<CompanyCardSkeleton />);

    // Should have logo skeleton
    expect(container.querySelector(".h-12.w-12")).toBeInTheDocument();

    // Should have text skeletons
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
