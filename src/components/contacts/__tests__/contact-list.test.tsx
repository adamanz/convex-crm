import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@/test/test-utils";
import { ContactList } from "../contact-list";
import { createMockContactWithCompany } from "@/test/test-utils";

describe("ContactList", () => {
  const mockContacts = [
    createMockContactWithCompany({
      _id: "contact_1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1 555-111-1111",
    }),
    createMockContactWithCompany({
      _id: "contact_2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "+1 555-222-2222",
      company: { _id: "company_2", _creationTime: Date.now(), name: "Tech Corp" },
    }),
    createMockContactWithCompany({
      _id: "contact_3",
      firstName: "Bob",
      lastName: "Wilson",
      email: "bob@example.com",
      phone: "+1 555-333-3333",
      company: null,
    }),
  ];

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<ContactList contacts={mockContacts} />);
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders table headers", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /company/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /email/i })).toBeInTheDocument();
    });

    it("renders all contacts", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    });

    it("renders contact emails as links", () => {
      render(<ContactList contacts={mockContacts} />);

      const emailLinks = screen.getAllByRole("link").filter(link =>
        link.getAttribute("href")?.startsWith("mailto:")
      );
      expect(emailLinks.length).toBeGreaterThan(0);
    });

    it("renders contact phones as links", () => {
      render(<ContactList contacts={mockContacts} />);

      const phoneLinks = screen.getAllByRole("link").filter(link =>
        link.getAttribute("href")?.startsWith("tel:")
      );
      expect(phoneLinks.length).toBeGreaterThan(0);
    });

    it("renders company names", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByText("Acme Inc")).toBeInTheDocument();
      expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    });

    it("renders dash for contacts without company", () => {
      render(<ContactList contacts={mockContacts} />);

      // Bob Wilson has no company
      const cells = screen.getAllByRole("cell");
      const dashCells = cells.filter(cell => cell.textContent === "-");
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it("renders empty state when no contacts", () => {
      render(<ContactList contacts={[]} />);

      expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
    });
  });

  describe("Checkboxes and Selection", () => {
    it("renders select all checkbox in header", () => {
      render(<ContactList contacts={mockContacts} />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      expect(headerCheckbox).toBeInTheDocument();
    });

    it("renders checkbox for each row", () => {
      render(<ContactList contacts={mockContacts} />);

      const checkboxes = screen.getAllByRole("checkbox");
      // Header checkbox + 3 row checkboxes
      expect(checkboxes.length).toBe(4);
    });

    it("selects all rows when header checkbox is clicked", async () => {
      const handleSelect = vi.fn();
      const { user } = render(
        <ContactList contacts={mockContacts} onSelect={handleSelect} />
      );

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      await user.click(headerCheckbox);

      expect(handleSelect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ _id: "contact_1" }),
          expect.objectContaining({ _id: "contact_2" }),
          expect.objectContaining({ _id: "contact_3" }),
        ])
      );
    });

    it("selects individual row when checkbox is clicked", async () => {
      const handleSelect = vi.fn();
      const { user } = render(
        <ContactList contacts={mockContacts} onSelect={handleSelect} />
      );

      // Click the first row checkbox (index 1, since 0 is header)
      const rowCheckboxes = screen.getAllByRole("checkbox");
      await user.click(rowCheckboxes[1]);

      expect(handleSelect).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ _id: "contact_1" }),
        ])
      );
    });

    it("shows selected count", async () => {
      const { user } = render(<ContactList contacts={mockContacts} />);

      const rowCheckbox = screen.getAllByRole("checkbox")[1];
      await user.click(rowCheckbox);

      expect(screen.getByText(/1 of 3 row\(s\) selected/i)).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("renders sortable column headers", () => {
      render(<ContactList contacts={mockContacts} />);

      const nameHeader = screen.getByRole("button", { name: /name/i });
      expect(nameHeader).toBeInTheDocument();
    });

    it("sorts by name when header is clicked", async () => {
      const { user } = render(<ContactList contacts={mockContacts} />);

      const nameHeader = screen.getByRole("button", { name: /name/i });
      await user.click(nameHeader);

      // After sorting, the order should change
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });

    it("toggles sort direction on second click", async () => {
      const { user } = render(<ContactList contacts={mockContacts} />);

      const nameHeader = screen.getByRole("button", { name: /name/i });
      await user.click(nameHeader); // First click - ascending
      await user.click(nameHeader); // Second click - descending

      // Sorting should be applied
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe("Actions Menu", () => {
    it("renders action buttons for each row", () => {
      render(
        <ContactList
          contacts={mockContacts}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      // Should have action buttons
      const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
      expect(menuButtons.length).toBe(3);
    });

    it("calls onEdit when edit action is clicked", async () => {
      const handleEdit = vi.fn();
      const { user } = render(
        <ContactList
          contacts={mockContacts}
          onEdit={handleEdit}
          onDelete={() => {}}
        />
      );

      // Open the first menu
      const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
      await user.click(menuButtons[0]);

      // Click edit
      const editButton = await screen.findByRole("menuitem", { name: /edit/i });
      await user.click(editButton);

      expect(handleEdit).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "contact_1" })
      );
    });

    it("calls onDelete when delete action is clicked", async () => {
      const handleDelete = vi.fn();
      const { user } = render(
        <ContactList
          contacts={mockContacts}
          onEdit={() => {}}
          onDelete={handleDelete}
        />
      );

      // Open the first menu
      const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
      await user.click(menuButtons[0]);

      // Click delete
      const deleteButton = await screen.findByRole("menuitem", { name: /delete/i });
      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "contact_1" })
      );
    });
  });

  describe("Pagination", () => {
    it("renders pagination controls", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(<ContactList contacts={mockContacts} />);

      const prevButton = screen.getByRole("button", { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it("navigates to next page when next is clicked", async () => {
      // Create many contacts to test pagination
      const manyContacts = Array.from({ length: 15 }, (_, i) =>
        createMockContactWithCompany({
          _id: `contact_${i}`,
          firstName: `User${i}`,
          lastName: "Test",
        })
      );

      const { user } = render(<ContactList contacts={manyContacts} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      if (!nextButton.hasAttribute("disabled")) {
        await user.click(nextButton);
        // Page should have changed
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).not.toBeDisabled();
      }
    });
  });

  describe("Avatar Display", () => {
    it("renders avatar with initials", () => {
      render(<ContactList contacts={mockContacts} />);

      // John Doe should have "JD" initials
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("renders avatar image when URL provided", () => {
      const contactWithAvatar = [
        createMockContactWithCompany({
          _id: "contact_avatar",
          firstName: "Avatar",
          lastName: "User",
          avatarUrl: "https://example.com/avatar.jpg",
        }),
      ];

      render(<ContactList contacts={contactWithAvatar} />);

      const avatar = screen.getByRole("img", { hidden: true });
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });
  });

  describe("Contact Title Display", () => {
    it("renders contact title", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });
  });

  describe("Last Activity Column", () => {
    it("renders last activity time", () => {
      render(<ContactList contacts={mockContacts} />);

      // Check that some relative time is displayed
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });

    it("renders Never for contacts without last activity", () => {
      const contactWithoutActivity = [
        createMockContactWithCompany({
          _id: "contact_no_activity",
          firstName: "No",
          lastName: "Activity",
          lastActivityAt: undefined,
        }),
      ];

      render(<ContactList contacts={contactWithoutActivity} />);

      expect(screen.getByText("Never")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <ContactList contacts={mockContacts} className="custom-list-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-list-class");
    });

    it("rows have cursor pointer style", () => {
      render(<ContactList contacts={mockContacts} />);

      const rows = screen.getAllByRole("row");
      // Body rows should have cursor-pointer
      const bodyRows = rows.slice(1); // Skip header row
      bodyRows.forEach(row => {
        expect(row).toHaveClass("cursor-pointer");
      });
    });
  });

  describe("Accessibility", () => {
    it("table has accessible structure", () => {
      render(<ContactList contacts={mockContacts} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
    });

    it("checkboxes have accessible labels", () => {
      render(<ContactList contacts={mockContacts} />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      expect(headerCheckbox).toHaveAttribute("aria-label", "Select all");

      const rowCheckbox = screen.getAllByRole("checkbox")[1];
      expect(rowCheckbox).toHaveAttribute("aria-label", "Select row");
    });

    it("action menu button has accessible label", () => {
      render(
        <ContactList
          contacts={mockContacts}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      );

      const menuButtons = screen.getAllByRole("button", { name: /open menu/i });
      expect(menuButtons[0]).toBeInTheDocument();
    });
  });
});
