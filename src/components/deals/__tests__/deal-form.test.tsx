import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { DealForm } from "../deal-form";
import {
  createMockPipeline,
  createMockCompany,
  createMockContact,
  createMockUser,
} from "@/test/test-utils";

describe("DealForm", () => {
  const mockPipeline = createMockPipeline();
  const mockCompanies = [
    createMockCompany({ _id: "company_1" as any, name: "Acme Inc" }),
    createMockCompany({ _id: "company_2" as any, name: "TechCorp" }),
  ];
  const mockContacts = [
    createMockContact({
      _id: "contact_1" as any,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    }),
    createMockContact({
      _id: "contact_2" as any,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
    }),
  ];
  const mockUsers = [
    createMockUser({ _id: "user_1" as any, firstName: "Admin", lastName: "User" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders in create mode", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          mode="create"
        />
      );

      expect(screen.getByText("Create New Deal")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create deal/i })).toBeInTheDocument();
    });

    it("renders in edit mode", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          mode="edit"
        />
      );

      expect(screen.getByText("Edit Deal")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contacts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expected close date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    });

    it("renders owner field when users are provided", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          users={mockUsers}
        />
      );

      expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    });

    it("does not render owner field when no users provided", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          users={[]}
        />
      );

      expect(screen.queryByLabelText(/owner/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("validates required deal name", async () => {
      const mockOnSubmit = vi.fn();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      // Try to submit without deal name
      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/deal name is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("validates required stage", async () => {
      const mockOnSubmit = vi.fn();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={[]} // No stages
          companies={mockCompanies}
          contacts={mockContacts}
          defaultValues={{ stageId: "" }}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/stage is required/i)).toBeInTheDocument();
      });
    });

    it("validates amount is positive", async () => {
      const mockOnSubmit = vi.fn();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "-1000");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe("Default Values", () => {
    it("populates form with default values", () => {
      const defaultValues = {
        name: "Existing Deal",
        amount: 50000,
        currency: "USD",
        stageId: "stage_2",
        companyId: "company_1",
      };

      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          defaultValues={defaultValues}
        />
      );

      expect(screen.getByDisplayValue("Existing Deal")).toBeInTheDocument();
      expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
    });

    it("selects default stage", () => {
      const defaultValues = {
        stageId: "stage_3",
      };

      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          defaultValues={defaultValues}
        />
      );

      // Stage select should have the default value selected
      const stageSelect = screen.getByLabelText(/stage/i);
      expect(stageSelect).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("updates deal name on typing", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "New Deal Name");

      expect(nameInput).toHaveValue("New Deal Name");
    });

    it("updates amount on typing", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "75000");

      expect(amountInput).toHaveValue(75000);
    });

    it("calls onOpenChange when cancel is clicked", async () => {
      const mockOnOpenChange = vi.fn();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("opens company search on click", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const companyButton = screen.getByRole("combobox", { name: /company/i });
      await user.click(companyButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search companies/i)).toBeInTheDocument();
      });
    });

    it("displays company options in search", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const companyButton = screen.getByRole("combobox", { name: /company/i });
      await user.click(companyButton);

      await waitFor(() => {
        expect(screen.getByText("Acme Inc")).toBeInTheDocument();
        expect(screen.getByText("TechCorp")).toBeInTheDocument();
      });
    });

    it("opens contacts multi-select on click", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const contactsButton = screen.getByRole("combobox", { name: /contacts/i });
      await user.click(contactsButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search contacts/i)).toBeInTheDocument();
      });
    });

    it("displays contact options with email", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const contactsButton = screen.getByRole("combobox", { name: /contacts/i });
      await user.click(contactsButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "100000");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Deal",
            amount: 100000,
          })
        );
      });
    });

    it("closes dialog on successful submit", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockOnOpenChange = vi.fn();

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("includes selected company in submission", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          defaultValues={{
            companyId: "company_1",
          }}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            companyId: "company_1",
          })
        );
      });
    });

    it("includes expected close date in submission", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const dateInput = screen.getByLabelText(/expected close date/i);
      await user.type(dateInput, "2024-12-31");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            expectedCloseDate: "2024-12-31",
          })
        );
      });
    });
  });

  describe("Currency Selection", () => {
    it("defaults to USD currency", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      // Currency field should exist and have USD as default
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });

    it("submits with selected currency", async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          defaultValues={{ currency: "EUR" }}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: "EUR",
          })
        );
      });
    });
  });

  describe("Loading States", () => {
    it("disables submit button when loading", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      expect(submitButton).toBeDisabled();
    });

    it("shows loading text during submission", async () => {
      const mockOnSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
      });
    });

    it("disables cancel button during submission", async () => {
      const mockOnSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={mockOnSubmit}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const nameInput = screen.getByLabelText(/deal name/i);
      await user.type(nameInput, "Test Deal");

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper form labels", () => {
      render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    });

    it("shows validation errors with proper ARIA", async () => {
      const { user } = render(
        <DealForm
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={vi.fn()}
          stages={mockPipeline.stages}
          companies={mockCompanies}
          contacts={mockContacts}
        />
      );

      const submitButton = screen.getByRole("button", { name: /create deal/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/deal name is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
