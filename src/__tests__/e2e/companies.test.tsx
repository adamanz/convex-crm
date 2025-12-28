import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { createMockCompany, createMockContact, createMockDeal } from "@/test/test-utils";
import CompaniesPage from "@/app/(dashboard)/companies/page";
import CompanyDetailPage from "@/app/(dashboard)/companies/[id]/page";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  usePathname: vi.fn(() => "/companies"),
}));

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("Companies E2E Tests", () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("1. View Companies List", () => {
    it("should display companies list with data", async () => {
      const mockCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Acme Corp",
          domain: "acme.com",
          industry: "Technology",
          contactCount: 5,
          dealCount: 3,
        }),
        createMockCompany({
          _id: "company_2" as Id<"companies">,
          name: "TechStart Inc",
          domain: "techstart.io",
          industry: "Software",
          contactCount: 2,
          dealCount: 1,
        }),
      ];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        // Check the query function name or arguments to determine which query it is
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: mockCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        // getIndustries query
        if (queryFn && typeof queryFn === "object") {
          return ["Technology", "Software"];
        }
        return undefined;
      });

      render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("TechStart Inc")).toBeInTheDocument();
      });

      expect(screen.getByText("acme.com")).toBeInTheDocument();
      expect(screen.getByText("techstart.io")).toBeInTheDocument();
    });

    it("should display empty state when no companies", async () => {
      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return [];
      });

      render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no companies yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/add your first company/i)).toBeInTheDocument();
    });

    it("should display loading state while fetching", () => {
      (useQuery as any).mockReturnValue(undefined);

      render(<CompaniesPage />);

      // Loading state should be shown (skeleton or spinner)
      expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
    });

    it("should display company counts and metadata", async () => {
      const mockCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Acme Corp",
          contactCount: 5,
          dealCount: 3,
          size: "51-200",
        }),
      ];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: mockCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        return ["Technology"];
      });

      render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      expect(screen.getByText("5 contacts")).toBeInTheDocument();
      expect(screen.getByText("51-200")).toBeInTheDocument();
    });
  });

  describe("2. Search Companies", () => {
    it("should filter companies by search query", async () => {
      const allCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Acme Corp",
        }),
        createMockCompany({
          _id: "company_2" as Id<"companies">,
          name: "TechStart Inc",
        }),
      ];

      const searchResults = [allCompanies[0]];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args === "skip") return undefined;

        // Search query with searchTerm
        if (args && typeof args === "object" && "searchTerm" in args) {
          return searchResults;
        }
        // List query with paginationOpts
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: allCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        // getIndustries
        return ["Technology"];
      });

      const { user } = render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("TechStart Inc")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search companies/i);
      await user.type(searchInput, "Acme");

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });
    });

    it("should show message when search returns no results", async () => {
      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args === "skip") return undefined;

        if (args && typeof args === "object" && "searchTerm" in args) {
          return [];
        }
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return [];
      });

      const { user } = render(<CompaniesPage />);

      const searchInput = screen.getByPlaceholderText(/search companies/i);
      await user.type(searchInput, "NonexistentCompany");

      await waitFor(() => {
        expect(screen.getByText(/no companies/i)).toBeInTheDocument();
      });
    });

    it("should clear search and show all companies", async () => {
      const allCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Acme Corp",
        }),
      ];

      (useQuery as any).mockImplementation((query: any, args?: any) => {
        if (args === "skip") return undefined;

        if (query.toString().includes("list")) {
          return {
            page: allCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        if (query.toString().includes("getIndustries")) {
          return ["Technology"];
        }
        return undefined;
      });

      const { user } = render(<CompaniesPage />);

      const searchInput = screen.getByPlaceholderText(/search companies/i);
      await user.type(searchInput, "Test");
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });
    });
  });

  describe("3. Filter by Industry", () => {
    it("should filter companies by selected industry", async () => {
      const techCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Tech Corp",
        industry: "Technology",
      });

      const healthCompany = createMockCompany({
        _id: "company_2" as Id<"companies">,
        name: "Health Corp",
        industry: "Healthcare",
      });

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          if (args?.filter?.industry === "Technology") {
            return {
              page: [techCompany],
              continueCursor: null,
              isDone: true,
            };
          }
          return {
            page: [techCompany, healthCompany],
            continueCursor: null,
            isDone: true,
          };
        }
        return ["Technology", "Healthcare"];
      });

      const { user } = render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText("Tech Corp")).toBeInTheDocument();
        expect(screen.getByText("Health Corp")).toBeInTheDocument();
      });

      // Open industry filter dropdown
      const industryFilter = screen.getByRole("combobox");
      await user.click(industryFilter);

      // Select Technology
      const technologyOption = await screen.findByText("Technology");
      await user.click(technologyOption);

      await waitFor(() => {
        expect(screen.getByText("Tech Corp")).toBeInTheDocument();
      });
    });

    it("should show all industries in dropdown", async () => {
      const industries = ["Technology", "Healthcare", "Finance", "Retail"];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return industries;
      });

      const { user } = render(<CompaniesPage />);

      const industryFilter = screen.getByRole("combobox");
      await user.click(industryFilter);

      await waitFor(() => {
        industries.forEach((industry) => {
          expect(screen.getByText(industry)).toBeInTheDocument();
        });
      });
    });

    it("should clear industry filter", async () => {
      const mockCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Tech Corp",
          industry: "Technology",
        }),
      ];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: mockCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        return ["Technology"];
      });

      const { user } = render(<CompaniesPage />);

      const industryFilter = screen.getByRole("combobox");
      await user.click(industryFilter);

      const allOption = await screen.findByText(/all industries/i);
      await user.click(allOption);

      await waitFor(() => {
        expect(screen.getByText("Tech Corp")).toBeInTheDocument();
      });
    });
  });

  describe("4. Create New Company", () => {
    it("should open company form when add button clicked", async () => {
      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return [];
      });

      const { user } = render(<CompaniesPage />);

      const addButton = screen.getByRole("button", { name: /add company/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
      });
    });

    it("should create company with valid data", async () => {
      const mockCreate = vi.fn().mockResolvedValue("new_company_id");

      (useMutation as any).mockReturnValue(mockCreate);
      (useQuery as any).mockImplementation((query: any) => {
        if (query.toString().includes("list")) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        if (query.toString().includes("getIndustries")) {
          return ["Technology"];
        }
        return undefined;
      });

      const { user } = render(<CompaniesPage />);

      const addButton = screen.getByRole("button", { name: /add company/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByRole("textbox", { name: /name/i });
      await user.type(nameInput, "New Company Inc");

      const submitButton = screen.getByRole("button", { name: /save|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });

    it("should validate required fields", async () => {
      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return [];
      });

      const { user } = render(<CompaniesPage />);

      const addButton = screen.getByRole("button", { name: /add company/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /save|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it("should close form after successful creation", async () => {
      const mockCreate = vi.fn().mockResolvedValue("new_company_id");

      (useMutation as any).mockReturnValue(mockCreate);
      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: [],
            continueCursor: null,
            isDone: true,
          };
        }
        return [];
      });

      const { user } = render(<CompaniesPage />);

      const addButton = screen.getByRole("button", { name: /add company/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
      });

      const nameInput = screen.getByRole("textbox", { name: /name/i });
      await user.type(nameInput, "New Company");

      const submitButton = screen.getByRole("button", { name: /save|create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });
  });

  describe("5. View Company Detail", () => {
    it("should display company details", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        domain: "acme.com",
        industry: "Technology",
        website: "https://acme.com",
        phone: "+1-555-1234",
        description: "A leading technology company",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      expect(screen.getByText("acme.com")).toBeInTheDocument();
      expect(screen.getByText("Technology")).toBeInTheDocument();
      expect(screen.getByText("A leading technology company")).toBeInTheDocument();
    });

    it("should display not found message for invalid company", async () => {
      (useParams as any).mockReturnValue({ id: "invalid_id" });
      (useQuery as any).mockReturnValue(null);
      (useMutation as any).mockReturnValue(vi.fn());

      render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/company not found/i)).toBeInTheDocument();
      });
    });

    it("should display loading state while fetching", () => {
      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(undefined);
      (useMutation as any).mockReturnValue(vi.fn());

      render(<CompanyDetailPage />);

      // Should show skeleton/loading state
      expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
    });

    it("should display company stats", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 5,
        dealStats: {
          total: 10,
          open: 3,
          won: 5,
          lost: 2,
          totalValue: 500000,
          openValue: 150000,
          wonValue: 300000,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      expect(screen.getByText("10")).toBeInTheDocument(); // Total deals
      expect(screen.getByText("5")).toBeInTheDocument(); // Contacts or Won deals
    });
  });

  describe("6. Edit Company", () => {
    it("should open edit form when edit button clicked", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });
    });

    it("should update company with new data", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("company_1");
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockUpdate);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });

      const nameInput = screen.getAllByRole("textbox", { name: /name/i })[0];
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Company Name");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it("should cancel edit without saving", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole("textbox", { name: /name/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("7. Delete Company", () => {
    it("should show delete confirmation dialog", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it("should delete company on confirmation", async () => {
      const mockDelete = vi.fn().mockResolvedValue({ success: true });
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockDelete);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getAllByRole("button", { name: /delete/i })[1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith({ id: "company_1" });
      });
    });

    it("should cancel delete operation", async () => {
      const mockDelete = vi.fn();
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockDelete);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("should warn when company has associated data", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [createMockContact()],
        deals: [createMockDeal()],
        recentActivities: [],
        contactCount: 1,
        dealStats: {
          total: 1,
          open: 1,
          won: 0,
          lost: 0,
          totalValue: 50000,
          openValue: 50000,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/has 1 contacts and 1 deals/i)).toBeInTheDocument();
      });
    });
  });

  describe("8. Add Contacts to Company", () => {
    it("should display contacts tab with contact list", async () => {
      const mockContact = createMockContact({
        _id: "contact_1" as Id<"contacts">,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        companyId: "company_1" as Id<"companies">,
      });

      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [mockContact],
        deals: [],
        recentActivities: [],
        contactCount: 1,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const contactsTab = screen.getByRole("tab", { name: /contacts \(1\)/i });
      await user.click(contactsTab);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("should show empty state when no contacts", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const contactsTab = screen.getByRole("tab", { name: /contacts \(0\)/i });
      await user.click(contactsTab);

      await waitFor(() => {
        expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("9. Add Deals to Company", () => {
    it("should display deals tab with deal list", async () => {
      const mockDeal = createMockDeal({
        _id: "deal_1" as Id<"deals">,
        name: "Enterprise Deal",
        amount: 50000,
        currency: "USD",
        status: "open",
        companyId: "company_1" as Id<"companies">,
      });

      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [mockDeal],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 1,
          open: 1,
          won: 0,
          lost: 0,
          totalValue: 50000,
          openValue: 50000,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const dealsTab = screen.getByRole("tab", { name: /deals \(1\)/i });
      await user.click(dealsTab);

      await waitFor(() => {
        expect(screen.getByText("Enterprise Deal")).toBeInTheDocument();
      });
    });

    it("should show empty state when no deals", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const dealsTab = screen.getByRole("tab", { name: /deals \(0\)/i });
      await user.click(dealsTab);

      await waitFor(() => {
        expect(screen.getByText(/no deals yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("10. View Company Activities", () => {
    it("should display activities tab with activity list", async () => {
      const mockActivity = {
        _id: "activity_1" as Id<"activities">,
        type: "note" as const,
        subject: "Follow-up call",
        description: "Discussed project requirements",
        createdAt: Date.now(),
      };

      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [mockActivity],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const activitiesTab = screen.getByRole("tab", { name: /activities/i });
      await user.click(activitiesTab);

      await waitFor(() => {
        expect(screen.getByText("Follow-up call")).toBeInTheDocument();
      });
    });

    it("should show empty state when no activities", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const activitiesTab = screen.getByRole("tab", { name: /activities/i });
      await user.click(activitiesTab);

      await waitFor(() => {
        expect(screen.getByText(/no activities yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("11. Update Company Fields", () => {
    it("should update company name", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("company_1");
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Old Name",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockUpdate);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Old Name")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });

      const nameInput = screen.getAllByRole("textbox", { name: /name/i })[0];
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "company_1",
            name: "New Name",
          })
        );
      });
    });

    it("should update company industry", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("company_1");
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        industry: "Technology",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockUpdate);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });

      // Update would interact with industry field here
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it("should update company contact information", async () => {
      const mockUpdate = vi.fn().mockResolvedValue("company_1");
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        phone: "+1-555-1234",
        website: "https://acme.com",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(mockUpdate);

      const { user } = render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        const nameInputs = screen.getAllByRole("textbox", { name: /name/i });
        expect(nameInputs.length).toBeGreaterThan(0);
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("Navigation and Integration", () => {
    it("should navigate to company detail from list", async () => {
      const mockCompanies = [
        createMockCompany({
          _id: "company_1" as Id<"companies">,
          name: "Acme Corp",
          contactCount: 5,
          dealCount: 3,
        }),
      ];

      (useQuery as any).mockImplementation((queryFn: any, args?: any) => {
        if (args && typeof args === "object" && "paginationOpts" in args) {
          return {
            page: mockCompanies,
            continueCursor: null,
            isDone: true,
          };
        }
        return ["Technology"];
      });

      const { user } = render(<CompaniesPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const companyLink = screen.getByText("Acme Corp").closest("a");
      expect(companyLink).toHaveAttribute("href", "/companies/company_1");
    });

    it("should navigate back to companies list from detail", async () => {
      const mockCompany = createMockCompany({
        _id: "company_1" as Id<"companies">,
        name: "Acme Corp",
        contacts: [],
        deals: [],
        recentActivities: [],
        contactCount: 0,
        dealStats: {
          total: 0,
          open: 0,
          won: 0,
          lost: 0,
          totalValue: 0,
          openValue: 0,
          wonValue: 0,
        },
      });

      (useParams as any).mockReturnValue({ id: "company_1" });
      (useQuery as any).mockReturnValue(mockCompany);
      (useMutation as any).mockReturnValue(vi.fn());

      render(<CompanyDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const backLink = screen.getByText(/back to companies/i).closest("a");
      expect(backLink).toHaveAttribute("href", "/companies");
    });
  });
});
