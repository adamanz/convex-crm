import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { ContactForm } from "../contact-form";
import { createMockCompany } from "@/test/test-utils";

describe("ContactForm", () => {
  const mockCompanies = [
    createMockCompany({ _id: "company_1", name: "Acme Inc" }),
    createMockCompany({ _id: "company_2", name: "Tech Corp" }),
    createMockCompany({ _id: "company_3", name: "StartUp LLC" }),
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<ContactForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(<ContactForm onSubmit={mockOnSubmit} companies={mockCompanies} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it("renders address fields", () => {
      render(<ContactForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/street/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it("renders submit button with custom label", () => {
      render(<ContactForm onSubmit={mockOnSubmit} submitLabel="Create Contact" />);
      expect(screen.getByRole("button", { name: /create contact/i })).toBeInTheDocument();
    });

    it("renders cancel button when onCancel is provided", () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not render cancel button when onCancel is not provided", () => {
      render(<ContactForm onSubmit={mockOnSubmit} />);
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe("Initial Values", () => {
    it("populates fields with initial data", () => {
      const initialData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1 555-123-4567",
        title: "Engineer",
        tags: ["vip"],
      };

      render(<ContactForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
      expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
      expect(screen.getByLabelText(/email/i)).toHaveValue("john@example.com");
      expect(screen.getByLabelText(/phone/i)).toHaveValue("+1 555-123-4567");
      expect(screen.getByLabelText(/title/i)).toHaveValue("Engineer");
    });

    it("displays initial tags", () => {
      const initialData = {
        tags: ["vip", "enterprise"],
      };

      render(<ContactForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByText("vip")).toBeInTheDocument();
      expect(screen.getByText("enterprise")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows error for empty first name on submit", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/last name/i), "Doe");
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty last name on submit", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), "John");
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for invalid email", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), "John");
      await user.type(screen.getByLabelText(/last name/i), "Doe");
      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it("accepts empty email field", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), "John");
      await user.type(screen.getByLabelText(/last name/i), "Doe");
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("User Interactions", () => {
    it("updates input values on typing", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, "Jane");

      expect(firstNameInput).toHaveValue("Jane");
    });

    it("adds tag on Enter key", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      const tagInput = screen.getByPlaceholderText(/type a tag/i);
      await user.type(tagInput, "newtag{Enter}");

      expect(screen.getByText("newtag")).toBeInTheDocument();
    });

    it("removes tag when X button is clicked", async () => {
      const initialData = { tags: ["removable"] };
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByText("removable")).toBeInTheDocument();

      const removeButton = screen.getByRole("button", { name: /remove removable/i });
      await user.click(removeButton);

      expect(screen.queryByText("removable")).not.toBeInTheDocument();
    });

    it("clears tag input after adding tag", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      const tagInput = screen.getByPlaceholderText(/type a tag/i);
      await user.type(tagInput, "newtag{Enter}");

      expect(tagInput).toHaveValue("");
    });

    it("does not add duplicate tags", async () => {
      const initialData = { tags: ["existing"] };
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} initialData={initialData} />);

      const tagInput = screen.getByPlaceholderText(/type a tag/i);
      await user.type(tagInput, "existing{Enter}");

      // Should only have one "existing" tag
      const existingTags = screen.getAllByText("existing");
      expect(existingTags).toHaveLength(1);
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const { user } = render(
        <ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Company Selection", () => {
    it("opens company dropdown on click", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} companies={mockCompanies} />);

      const companyButton = screen.getByRole("combobox", { name: /company/i });
      await user.click(companyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search companies/i)).toBeInTheDocument();
      });
    });

    it("displays company options in dropdown", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} companies={mockCompanies} />);

      const companyButton = screen.getByRole("combobox", { name: /company/i });
      await user.click(companyButton);

      await waitFor(() => {
        expect(screen.getByText("Acme Inc")).toBeInTheDocument();
        expect(screen.getByText("Tech Corp")).toBeInTheDocument();
        expect(screen.getByText("StartUp LLC")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data on valid submission", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), "John");
      await user.type(screen.getByLabelText(/last name/i), "Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          })
        );
      });
    });

    it("does not call onSubmit on invalid submission", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      // Don't fill required fields
      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Loading State", () => {
    it("disables submit button when loading", () => {
      render(<ContactForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole("button", { name: /save contact/i })).toBeDisabled();
    });

    it("shows loading spinner when loading", () => {
      render(<ContactForm onSubmit={mockOnSubmit} isLoading={true} />);

      // The loading spinner has the animate-spin class
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("labels are associated with inputs", () => {
      render(<ContactForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("required fields are marked", () => {
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Check for asterisks or required markers
      const firstNameLabel = screen.getByText(/first name/i);
      const requiredMarker = firstNameLabel.parentElement?.querySelector(".text-destructive");
      expect(requiredMarker).toBeInTheDocument();
    });

    it("error messages are announced", async () => {
      const { user } = render(<ContactForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: /save contact/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/first name is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <ContactForm onSubmit={mockOnSubmit} className="custom-form-class" />
      );

      const form = container.querySelector("form");
      expect(form).toHaveClass("custom-form-class");
    });
  });
});
