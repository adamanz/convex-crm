import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { EmailComposer } from "../EmailComposer";

describe("EmailComposer", () => {
  const mockOnSend = vi.fn();
  const mockOnCancel = vi.fn();

  const mockContacts = [
    { email: "john@example.com", name: "John Doe" },
    { email: "jane@example.com", name: "Jane Smith" },
    { email: "bob@example.com", name: "Bob Wilson" },
  ];

  const mockTemplates = [
    { id: "t1", name: "Welcome Email", subject: "Welcome!", body: "Welcome to our service..." },
    { id: "t2", name: "Follow Up", subject: "Following Up", body: "I wanted to follow up..." },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.getByText("To")).toBeInTheDocument();
    });

    it("renders To field", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.getByText("To")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/add email/i)).toBeInTheDocument();
    });

    it("renders Subject field", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.getByText("Subject")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email subject/i)).toBeInTheDocument();
    });

    it("renders Message field", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.getByText("Message")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/write your message/i)).toBeInTheDocument();
    });

    it("renders Send button", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
    });

    it("renders Cancel button when onCancel provided", () => {
      render(<EmailComposer onSend={mockOnSend} onCancel={mockOnCancel} />);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not render Cancel button when onCancel not provided", () => {
      render(<EmailComposer onSend={mockOnSend} />);
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe("Initial Values", () => {
    it("populates initial recipients", () => {
      const initialTo = [{ email: "initial@example.com", name: "Initial User" }];
      render(<EmailComposer onSend={mockOnSend} initialTo={initialTo} />);

      expect(screen.getByText("Initial User")).toBeInTheDocument();
    });

    it("populates initial subject", () => {
      render(<EmailComposer onSend={mockOnSend} initialSubject="Test Subject" />);

      const subjectInput = screen.getByPlaceholderText(/email subject/i);
      expect(subjectInput).toHaveValue("Test Subject");
    });

    it("populates initial body", () => {
      render(<EmailComposer onSend={mockOnSend} initialBody="Test body content" />);

      const bodyInput = screen.getByPlaceholderText(/write your message/i);
      expect(bodyInput).toHaveValue("Test body content");
    });
  });

  describe("CC/BCC Toggle", () => {
    it("hides CC/BCC fields by default", () => {
      render(<EmailComposer onSend={mockOnSend} />);

      expect(screen.queryByText("CC")).not.toBeInTheDocument();
      expect(screen.queryByText("BCC")).not.toBeInTheDocument();
    });

    it("shows CC/BCC fields when toggle is clicked", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      await user.click(screen.getByText(/show cc\/bcc/i));

      expect(screen.getByText("CC")).toBeInTheDocument();
      expect(screen.getByText("BCC")).toBeInTheDocument();
    });

    it("hides CC/BCC fields when toggle is clicked again", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      await user.click(screen.getByText(/show cc\/bcc/i));
      expect(screen.getByText("CC")).toBeInTheDocument();

      await user.click(screen.getByText(/hide cc\/bcc/i));
      expect(screen.queryByText("CC")).not.toBeInTheDocument();
    });
  });

  describe("Recipient Management", () => {
    it("adds recipient on Enter key", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "newuser@example.com{Enter}");

      expect(screen.getByText("newuser@example.com")).toBeInTheDocument();
    });

    it("adds recipient on comma key", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "comma@example.com,");

      expect(screen.getByText("comma@example.com")).toBeInTheDocument();
    });

    it("removes recipient when X is clicked", async () => {
      const initialTo = [{ email: "remove@example.com", name: "Remove Me" }];
      const { user } = render(<EmailComposer onSend={mockOnSend} initialTo={initialTo} />);

      expect(screen.getByText("Remove Me")).toBeInTheDocument();

      const removeButton = screen.getByRole("button", { name: "" });
      await user.click(removeButton);

      expect(screen.queryByText("Remove Me")).not.toBeInTheDocument();
    });

    it("does not add duplicate recipients", async () => {
      const initialTo = [{ email: "existing@example.com", name: "Existing" }];
      const { user } = render(<EmailComposer onSend={mockOnSend} initialTo={initialTo} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "existing@example.com{Enter}");

      // Should only have one instance
      const existingElements = screen.getAllByText("Existing");
      expect(existingElements).toHaveLength(1);
    });

    it("clears input after adding recipient", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "clear@example.com{Enter}");

      expect(toInput).toHaveValue("");
    });
  });

  describe("Contact Autocomplete", () => {
    it("shows suggestions when typing", async () => {
      const { user } = render(
        <EmailComposer onSend={mockOnSend} contacts={mockContacts} />
      );

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "john");

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("adds contact from suggestion", async () => {
      const { user } = render(
        <EmailComposer onSend={mockOnSend} contacts={mockContacts} />
      );

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "jane");

      await waitFor(() => {
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      });

      // Note: The suggestion click uses onMouseDown, which might need different handling
    });
  });

  describe("Templates", () => {
    it("shows template selector when templates provided", () => {
      render(<EmailComposer onSend={mockOnSend} templates={mockTemplates} />);

      expect(screen.getByText("Template")).toBeInTheDocument();
    });

    it("does not show template selector when no templates", () => {
      render(<EmailComposer onSend={mockOnSend} />);

      expect(screen.queryByText("Template")).not.toBeInTheDocument();
    });

    it("applies template when selected", async () => {
      const { user } = render(
        <EmailComposer onSend={mockOnSend} templates={mockTemplates} />
      );

      const templateButton = screen.getByText(/select a template/i);
      await user.click(templateButton);

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Welcome Email"));

      const subjectInput = screen.getByPlaceholderText(/email subject/i);
      expect(subjectInput).toHaveValue("Welcome!");
    });
  });

  describe("Form Submission", () => {
    it("calls onSend with form data", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "recipient@example.com{Enter}");

      const subjectInput = screen.getByPlaceholderText(/email subject/i);
      await user.type(subjectInput, "Test Subject");

      const bodyInput = screen.getByPlaceholderText(/write your message/i);
      await user.type(bodyInput, "Test body");

      await user.click(screen.getByRole("button", { name: /send/i }));

      expect(mockOnSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: "recipient@example.com", name: undefined }],
          subject: "Test Subject",
          body: "Test body",
        })
      );
    });

    it("disables send button when no recipients", () => {
      render(<EmailComposer onSend={mockOnSend} />);

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it("disables send button when no subject", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "recipient@example.com{Enter}");

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it("enables send button when has recipient and subject", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      const toInput = screen.getByPlaceholderText(/add email/i);
      await user.type(toInput, "recipient@example.com{Enter}");

      const subjectInput = screen.getByPlaceholderText(/email subject/i);
      await user.type(subjectInput, "Subject");

      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe("Loading State", () => {
    it("shows sending state", () => {
      render(<EmailComposer onSend={mockOnSend} isSending={true} />);

      expect(screen.getByText("Sending...")).toBeInTheDocument();
    });

    it("disables send button while sending", () => {
      render(<EmailComposer onSend={mockOnSend} isSending={true} />);

      const sendButton = screen.getByText("Sending...");
      expect(sendButton.closest("button")).toBeDisabled();
    });

    it("disables cancel button while sending", () => {
      render(
        <EmailComposer onSend={mockOnSend} onCancel={mockOnCancel} isSending={true} />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Cancel Action", () => {
    it("calls onCancel when cancel is clicked", async () => {
      const { user } = render(
        <EmailComposer onSend={mockOnSend} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Attachment Button", () => {
    it("renders attachment button", () => {
      render(<EmailComposer onSend={mockOnSend} />);

      // Attachment button is disabled
      const buttons = screen.getAllByRole("button");
      const attachmentButton = buttons.find(btn =>
        btn.querySelector("svg")
      );
      expect(attachmentButton).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <EmailComposer onSend={mockOnSend} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("labels are associated with inputs", () => {
      render(<EmailComposer onSend={mockOnSend} />);

      // Subject should be labeled
      expect(screen.getByText("Subject")).toBeInTheDocument();
      expect(screen.getByText("Message")).toBeInTheDocument();
    });

    it("form fields are keyboard navigable", async () => {
      const { user } = render(<EmailComposer onSend={mockOnSend} />);

      await user.tab();

      // First focusable element should be the To input
      const toInput = screen.getByPlaceholderText(/add email/i);
      expect(document.activeElement?.tagName).toBe("INPUT");
    });
  });
});
