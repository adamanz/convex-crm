import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { useQuery, useMutation } from "convex/react";
import ContactsPage from "@/app/(dashboard)/contacts/page";
import ContactDetailPage from "@/app/(dashboard)/contacts/[id]/page";
import { createMockContact, createMockContactWithCompany, createMockCompany } from "@/test/test-utils";
import { toast } from "sonner";

// Mock Next.js navigation
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
    }),
    useParams: () => ({ id: "contact_1" }),
    useSearchParams: () => new URLSearchParams(),
  };
});

describe("Contacts E2E Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. View Contacts List", () => {
    it("displays contacts list with all contact information", async () => {
      const mockContacts = [
        createMockContactWithCompany({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1 555-111-1111",
          title: "CEO",
          tags: ["vip", "enterprise"],
        }),
        createMockContactWithCompany({
          _id: "contact_2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          title: "CTO",
          tags: ["technical"],
        }),
      ];

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("list")) {
          return {
            page: mockContacts,
            continueCursor: null,
            isDone: true,
          };
        }
        return undefined;
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1 555-111-1111")).toBeInTheDocument();
      expect(screen.getByText("CEO at Acme Inc")).toBeInTheDocument();
      expect(screen.getByText("vip")).toBeInTheDocument();
      expect(screen.getByText("enterprise")).toBeInTheDocument();
    });

    it("displays empty state when no contacts exist", async () => {
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("No contacts yet")).toBeInTheDocument();
      });

      expect(screen.getByText(/Get started by adding your first contact/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add your first contact/i })).toBeInTheDocument();
    });

    it("shows loading state while fetching contacts", () => {
      vi.mocked(useQuery).mockReturnValue(undefined);

      render(<ContactsPage />);

      // Loading state should be shown (spinner or skeleton)
      const loadingElement = document.querySelector(".animate-spin, .animate-pulse");
      expect(loadingElement).toBeInTheDocument();
    });

    it("renders contact avatars with initials", async () => {
      const mockContacts = [
        createMockContactWithCompany({
          _id: "contact_1",
          firstName: "Alice",
          lastName: "Johnson",
        }),
      ];

      vi.mocked(useQuery).mockImplementation(() => ({
        page: mockContacts,
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("AJ")).toBeInTheDocument();
      });
    });

    it("navigates to contact detail on row click", async () => {
      const mockContacts = [
        createMockContactWithCompany({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
        }),
      ];

      vi.mocked(useQuery).mockImplementation(() => ({
        page: mockContacts,
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        const contactLink = screen.getByText("John Doe").closest("a");
        expect(contactLink).toHaveAttribute("href", "/contacts/contact_1");
      });
    });
  });

  describe("2. Search Contacts", () => {
    it("searches contacts by name", async () => {
      const searchResults = [
        createMockContactWithCompany({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
        }),
      ];

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("search")) {
          return searchResults;
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      const { user } = render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/Search contacts/i);
      await user.type(searchInput, "John");

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("shows empty state for no search results", async () => {
      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("search")) {
          return [];
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      const { user } = render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/Search contacts/i);
      await user.type(searchInput, "NonExistent");

      await waitFor(() => {
        expect(screen.getByText(/No contacts yet/i)).toBeInTheDocument();
      });
    });

    it("clears search results when search is cleared", async () => {
      const allContacts = [
        createMockContactWithCompany({ _id: "contact_1", firstName: "John", lastName: "Doe" }),
        createMockContactWithCompany({ _id: "contact_2", firstName: "Jane", lastName: "Smith" }),
      ];

      const searchResults = [
        createMockContactWithCompany({ _id: "contact_1", firstName: "John", lastName: "Doe" }),
      ];

      vi.mocked(useQuery).mockImplementation((query: any, args: any) => {
        if (query.toString().includes("search") && args !== "skip") {
          return searchResults;
        }
        return { page: allContacts, continueCursor: null, isDone: true };
      });

      const { user } = render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/Search contacts/i);

      // Type search query
      await user.type(searchInput, "John");
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });
  });

  describe("3. Create New Contact", () => {
    it("opens add contact dialog when clicking Add Contact button", async () => {
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("creates a new contact with all fields", async () => {
      const mockCreate = vi.fn().mockResolvedValue("contact_new");
      vi.mocked(useMutation).mockReturnValue(mockCreate);
      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("list")) {
          return { page: [], continueCursor: null, isDone: true };
        }
        return [createMockCompany()]; // companies list
      });

      const { user } = render(<ContactsPage />);

      // Open dialog
      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Fill in form
      await user.type(screen.getByLabelText(/first name/i), "Alice");
      await user.type(screen.getByLabelText(/last name/i), "Johnson");
      await user.type(screen.getByLabelText(/email/i), "alice@example.com");
      await user.type(screen.getByLabelText(/phone/i), "+1 555-999-9999");
      await user.type(screen.getByLabelText(/title/i), "Product Manager");

      // Submit
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: "Alice",
            lastName: "Johnson",
            email: "alice@example.com",
            phone: "+1 555-999-9999",
            title: "Product Manager",
          })
        );
      });
    });

    it("shows validation errors when required fields are missing", async () => {
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it("validates email format", async () => {
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/first name/i), "Test");
      await user.type(screen.getByLabelText(/last name/i), "User");
      await user.type(screen.getByLabelText(/email/i), "invalid-email");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it("creates contact with tags", async () => {
      const mockCreate = vi.fn().mockResolvedValue("contact_new");
      vi.mocked(useMutation).mockReturnValue(mockCreate);
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/first name/i), "Test");
      await user.type(screen.getByLabelText(/last name/i), "User");

      // Add tags
      const tagInput = screen.getByPlaceholderText(/type a tag/i);
      await user.type(tagInput, "vip{Enter}");
      await user.type(tagInput, "enterprise{Enter}");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.arrayContaining(["vip", "enterprise"]),
          })
        );
      });
    });
  });

  describe("4. View Contact Detail", () => {
    it("displays full contact information on detail page", async () => {
      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1 555-111-1111",
          title: "CEO",
          tags: ["vip", "enterprise"],
        }),
        company: createMockCompany(),
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("CEO at Acme Inc")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("+1 555-111-1111")).toBeInTheDocument();
      expect(screen.getByText("vip")).toBeInTheDocument();
      expect(screen.getByText("enterprise")).toBeInTheDocument();
    });

    it("displays contact not found when contact does not exist", async () => {
      vi.mocked(useQuery).mockReturnValue(null);

      render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Contact not found")).toBeInTheDocument();
      });

      expect(screen.getByText(/doesn't exist or has been deleted/i)).toBeInTheDocument();
    });

    it("shows contact activities in activities tab", async () => {
      const mockContact = {
        ...createMockContact(),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      const mockActivities = {
        items: [
          {
            _id: "activity_1",
            _creationTime: Date.now(),
            type: "note",
            subject: "Initial call",
            description: "Had a great conversation",
            createdAt: Date.now(),
            relatedToType: "contact",
            relatedToId: "contact_1",
            userId: "user_1",
          },
          {
            _id: "activity_2",
            _creationTime: Date.now(),
            type: "email",
            subject: "Follow up email",
            description: "Sent pricing information",
            createdAt: Date.now(),
            relatedToType: "contact",
            relatedToId: "contact_1",
            userId: "user_1",
          },
        ],
        cursor: null,
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return mockActivities;
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click activities tab
      const activitiesTab = screen.getByRole("tab", { name: /activities/i });
      await user.click(activitiesTab);

      await waitFor(() => {
        expect(screen.getByText("Initial call")).toBeInTheDocument();
        expect(screen.getByText("Follow up email")).toBeInTheDocument();
      });
    });

    it("shows deals tab with associated deals", async () => {
      const mockContact = {
        ...createMockContact(),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [
          {
            _id: "deal_1",
            _creationTime: Date.now(),
            name: "Enterprise Deal",
            amount: 50000,
            currency: "USD",
            status: "open",
            expectedCloseDate: Date.now(),
          },
        ],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click deals tab
      const dealsTab = screen.getByRole("tab", { name: /deals/i });
      await user.click(dealsTab);

      await waitFor(() => {
        expect(screen.getByText("Enterprise Deal")).toBeInTheDocument();
        expect(screen.getByText("$50,000")).toBeInTheDocument();
      });
    });

    it("displays quick action buttons (Email, Call, Message)", async () => {
      const mockContact = {
        ...createMockContact({
          email: "john@example.com",
          phone: "+1 555-111-1111",
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
        "href",
        "mailto:john@example.com"
      );
      expect(screen.getByRole("link", { name: /call/i })).toHaveAttribute(
        "href",
        "tel:+1 555-111-1111"
      );
      expect(screen.getByRole("button", { name: /message/i })).toBeInTheDocument();
    });
  });

  describe("5. Edit Contact", () => {
    it("opens edit dialog when clicking edit action", async () => {
      const mockContact = {
        ...createMockContact(),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open menu and click edit
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("updates contact information successfully", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("contact_1");
      vi.mocked(useMutation).mockReturnValue(mockUpdate);

      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open edit dialog
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Update email
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "john.doe@newcompany.com");

      // Update title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, "VP of Engineering");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "contact_1",
            email: "john.doe@newcompany.com",
            title: "VP of Engineering",
          })
        );
      });
    });

    it("preserves existing data when updating only some fields", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("contact_1");
      vi.mocked(useMutation).mockReturnValue(mockUpdate);

      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1 555-111-1111",
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Only update title, leave other fields
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, "CTO");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "contact_1",
            title: "CTO",
          })
        );
      });
    });
  });

  describe("6. Delete Contact", () => {
    it("prevents deletion when contact has associated deals", async () => {
      const mockDelete = vi.fn().mockRejectedValue(
        new Error("Cannot delete contact: associated with 2 deal(s)")
      );
      vi.mocked(useMutation).mockReturnValue(mockDelete);

      const mockContact = {
        ...createMockContact(),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [
          { _id: "deal_1", name: "Deal 1" },
          { _id: "deal_2", name: "Deal 2" },
        ],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        return { items: [], cursor: null };
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Open menu and click delete
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      const deleteButton = await screen.findByRole("menuitem", { name: /delete contact/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });
    });
  });

  describe("7. Add Tags to Contact", () => {
    it("adds tags via edit dialog", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("contact_1");
      vi.mocked(useMutation).mockReturnValue(mockUpdate);

      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          tags: ["existing"],
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Add new tag
      const tagInput = screen.getByPlaceholderText(/type a tag/i);
      await user.type(tagInput, "vip{Enter}");
      await user.type(tagInput, "enterprise{Enter}");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.arrayContaining(["existing", "vip", "enterprise"]),
          })
        );
      });
    });

    it("removes tags from contact", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("contact_1");
      vi.mocked(useMutation).mockReturnValue(mockUpdate);

      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          tags: ["vip", "enterprise", "technical"],
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Remove a tag
      const removeButton = screen.getByRole("button", { name: /remove vip/i });
      await user.click(removeButton);

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.not.arrayContaining(["vip"]),
          })
        );
      });
    });
  });

  describe("8. Add Notes/Comments to Contact", () => {
    it("displays comments tab", async () => {
      const mockContact = {
        ...createMockContact(),
        company: null,
        owner: { _id: "user_1", firstName: "Test", lastName: "User" },
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        if (query.toString().includes("users.list")) {
          return [{ _id: "user_1", firstName: "Test", lastName: "User", email: "test@example.com" }];
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click comments tab
      const commentsTab = screen.getByRole("tab", { name: /comments/i });
      await user.click(commentsTab);

      await waitFor(() => {
        expect(screen.getByText(/Team Comments/i)).toBeInTheDocument();
      });
    });
  });

  describe("9. Link Contact to Company", () => {
    it("links contact to a company via edit dialog", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("contact_1");
      vi.mocked(useMutation).mockReturnValue(mockUpdate);

      const mockCompanies = [
        createMockCompany({ _id: "company_1", name: "Acme Inc" }),
        createMockCompany({ _id: "company_2", name: "Tech Corp" }),
      ];

      const mockContact = {
        ...createMockContact({
          _id: "contact_1",
          companyId: undefined,
        }),
        company: null,
        owner: null,
        recentActivities: [],
        deals: [],
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("contacts.get")) {
          return mockContact;
        }
        if (query.toString().includes("activities")) {
          return { items: [], cursor: null };
        }
        if (query.toString().includes("companies.list")) {
          return { page: mockCompanies };
        }
        return [];
      });

      const { user } = render(<ContactDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      const editButton = await screen.findByRole("menuitem", { name: /edit contact/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select company
      const companyButton = screen.getByRole("combobox", { name: /company/i });
      await user.click(companyButton);

      await waitFor(() => {
        expect(screen.getByText("Tech Corp")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Tech Corp"));
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            companyId: "company_2",
          })
        );
      });
    });
  });

  describe("10. Filter Contacts", () => {
    it("filters contacts by All", async () => {
      const mockContacts = [
        createMockContactWithCompany({ _id: "contact_1" }),
        createMockContactWithCompany({ _id: "contact_2" }),
      ];

      vi.mocked(useQuery).mockImplementation(() => ({
        page: mockContacts,
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click All filter (should be selected by default)
      const allFilter = screen.getByRole("button", { name: /all/i });
      expect(allFilter).toHaveClass(/bg-zinc-100/);
    });

    it("filters contacts by Recent", async () => {
      const now = Date.now();
      const mockContacts = [
        createMockContactWithCompany({
          _id: "contact_1",
          firstName: "Recent",
          lastName: "Contact",
          lastActivityAt: now,
        }),
        createMockContactWithCompany({
          _id: "contact_2",
          firstName: "Old",
          lastName: "Contact",
          lastActivityAt: now - 1000000,
        }),
      ];

      vi.mocked(useQuery).mockImplementation(() => ({
        page: mockContacts,
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("Recent Contact")).toBeInTheDocument();
      });

      // Click Recent filter
      const recentFilter = screen.getByRole("button", { name: /recent/i });
      await user.click(recentFilter);

      await waitFor(() => {
        // Recent Contact should appear first after sorting
        const rows = screen.getAllByRole("link");
        expect(rows[0]).toHaveTextContent("Recent Contact");
      });
    });
  });

  describe("11. Smart Lists Integration", () => {
    it("displays smart lists in sidebar", async () => {
      const mockSmartLists = [
        {
          _id: "smartlist_1",
          name: "VIP Contacts",
          entityType: "contact",
          count: 5,
        },
        {
          _id: "smartlist_2",
          name: "Enterprise Customers",
          entityType: "contact",
          count: 12,
        },
      ];

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("smartLists.list")) {
          return mockSmartLists;
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("VIP Contacts")).toBeInTheDocument();
        expect(screen.getByText("Enterprise Customers")).toBeInTheDocument();
      });
    });

    it("filters contacts by smart list when clicked", async () => {
      const mockSmartListMembers = {
        members: [
          createMockContactWithCompany({
            _id: "contact_1",
            firstName: "VIP",
            lastName: "Customer",
            tags: ["vip"],
          }),
        ],
        count: 1,
      };

      const mockSmartList = {
        _id: "smartlist_1",
        name: "VIP Contacts",
        description: "High value contacts",
        entityType: "contact",
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("getSmartListMembers")) {
          return mockSmartListMembers;
        }
        if (query.toString().includes("getSmartList")) {
          return mockSmartList;
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      // Set search params to include smartList
      const mockSearchParams = new URLSearchParams("smartList=smartlist_1");
      vi.mocked(require("next/navigation").useSearchParams).mockReturnValue(mockSearchParams);

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("VIP Contacts")).toBeInTheDocument();
        expect(screen.getByText("VIP Customer")).toBeInTheDocument();
      });

      expect(screen.getByText(/High value contacts/i)).toBeInTheDocument();
    });

    it("creates new smart list", async () => {
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      // Look for create smart list button in sidebar
      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("shows active smart list filter badge", async () => {
      const mockSmartList = {
        _id: "smartlist_1",
        name: "VIP Contacts",
        entityType: "contact",
      };

      const mockSmartListMembers = {
        members: [],
        count: 5,
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("getSmartList")) {
          return mockSmartList;
        }
        if (query.toString().includes("getSmartListMembers")) {
          return mockSmartListMembers;
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      const mockSearchParams = new URLSearchParams("smartList=smartlist_1");
      vi.mocked(require("next/navigation").useSearchParams).mockReturnValue(mockSearchParams);

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("VIP Contacts")).toBeInTheDocument();
      });

      // Badge should show count
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("clears smart list filter when clicking X on badge", async () => {
      const mockPushState = vi.fn();
      global.window.history.pushState = mockPushState;

      const mockSmartList = {
        _id: "smartlist_1",
        name: "VIP Contacts",
        entityType: "contact",
      };

      const mockSmartListMembers = {
        members: [],
        count: 5,
      };

      vi.mocked(useQuery).mockImplementation((query: any) => {
        if (query.toString().includes("getSmartList")) {
          return mockSmartList;
        }
        if (query.toString().includes("getSmartListMembers")) {
          return mockSmartListMembers;
        }
        return { page: [], continueCursor: null, isDone: true };
      });

      const mockSearchParams = new URLSearchParams("smartList=smartlist_1");
      vi.mocked(require("next/navigation").useSearchParams).mockReturnValue(mockSearchParams);

      const { user } = render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("VIP Contacts")).toBeInTheDocument();
      });

      // Find and click the clear button on the badge
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(mockPushState).toHaveBeenCalledWith({}, "", "/contacts");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles network errors gracefully", async () => {
      vi.mocked(useQuery).mockImplementation(() => {
        throw new Error("Network error");
      });

      expect(() => render(<ContactsPage />)).toThrow();
    });

    it("handles missing contact data fields gracefully", async () => {
      const mockContact = {
        ...createMockContactWithCompany({
          email: undefined,
          phone: undefined,
          title: undefined,
        }),
      };

      vi.mocked(useQuery).mockImplementation(() => ({
        page: [mockContact],
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Should not crash with missing fields
      expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    });

    it("handles contact with no company", async () => {
      const mockContact = createMockContactWithCompany({
        companyId: undefined,
        company: null,
      });

      vi.mocked(useQuery).mockImplementation(() => ({
        page: [mockContact],
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Should display without company info
      expect(screen.queryByText("at")).not.toBeInTheDocument();
    });

    it("prevents duplicate email addresses", async () => {
      const mockCreate = vi.fn().mockRejectedValue(
        new Error("A contact with this email already exists")
      );
      vi.mocked(useMutation).mockReturnValue(mockCreate);
      vi.mocked(useQuery).mockImplementation(() => ({
        page: [],
        continueCursor: null,
        isDone: true,
      }));

      const { user } = render(<ContactsPage />);

      const addButton = screen.getByRole("button", { name: /Add Contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/first name/i), "Test");
      await user.type(screen.getByLabelText(/last name/i), "User");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");

      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    it("handles long contact names gracefully", async () => {
      const mockContact = createMockContactWithCompany({
        firstName: "VeryLongFirstNameThatExceedsNormalLength",
        lastName: "VeryLongLastNameThatExceedsNormalLength",
      });

      vi.mocked(useQuery).mockImplementation(() => ({
        page: [mockContact],
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        const name = screen.getByText(/VeryLongFirstNameThatExceedsNormalLength/i);
        expect(name).toBeInTheDocument();
        // Should have truncate class
        expect(name).toHaveClass(/truncate/);
      });
    });

    it("handles many tags on a contact", async () => {
      const mockContact = createMockContactWithCompany({
        tags: ["vip", "enterprise", "technical", "priority", "active", "qualified"],
      });

      vi.mocked(useQuery).mockImplementation(() => ({
        page: [mockContact],
        continueCursor: null,
        isDone: true,
      }));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText("vip")).toBeInTheDocument();
        expect(screen.getByText("enterprise")).toBeInTheDocument();
      });

      // Should show +N for additional tags
      expect(screen.getByText(/\+4/)).toBeInTheDocument();
    });
  });
});
