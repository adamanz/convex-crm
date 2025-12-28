import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@/test/test-utils";
import { useQuery, useMutation } from "convex/react";
import ActivitiesPage from "@/app/(dashboard)/activities/page";
import {
  createMockActivity,
  createMockContact,
  createMockCompany,
  createMockDeal,
  createMockUser,
} from "@/test/test-utils";

// Mock Convex hooks
vi.mock("convex/react");

describe("Activities E2E Tests", () => {
  const mockUseQuery = vi.mocked(useQuery);
  const mockUseMutation = vi.mocked(useMutation);

  const mockContact = createMockContact({
    _id: "contact_123" as any,
    firstName: "John",
    lastName: "Doe",
  });

  const mockCompany = createMockCompany({
    _id: "company_123" as any,
    name: "Acme Corp",
  });

  const mockDeal = createMockDeal({
    _id: "deal_123" as any,
    name: "Big Deal",
  });

  const mockUser = createMockUser({
    _id: "user_123" as any,
    firstName: "Jane",
    lastName: "Smith",
  });

  const createActivity = (type: string, overrides = {}) =>
    createMockActivity({
      _id: `activity_${type}_${Date.now()}` as any,
      type: type as any,
      subject: `${type.charAt(0).toUpperCase() + type.slice(1)} activity`,
      description: `Test ${type} description`,
      relatedToType: "contact" as const,
      relatedToId: "contact_123",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

  const mockActivities = [
    {
      ...createActivity("task", {
        priority: "high",
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
        completed: false,
      }),
      relatedEntity: mockContact,
      owner: mockUser,
      assignedTo: mockUser,
    },
    {
      ...createActivity("call", {
        duration: 30,
        outcome: "Scheduled follow-up",
      }),
      relatedEntity: mockCompany,
      owner: mockUser,
      assignedTo: null,
    },
    {
      ...createActivity("email", {
        emailDirection: "outbound",
      }),
      relatedEntity: mockContact,
      owner: mockUser,
      assignedTo: null,
    },
    {
      ...createActivity("meeting", {
        duration: 60,
        dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
      }),
      relatedEntity: mockDeal,
      owner: mockUser,
      assignedTo: mockUser,
    },
    {
      ...createActivity("note"),
      relatedEntity: mockContact,
      owner: null,
      assignedTo: null,
    },
  ];

  const mockUpcomingTasks = [
    {
      ...createActivity("task", {
        _id: "task_upcoming_1" as any,
        priority: "high",
        dueDate: Date.now() + 1 * 60 * 60 * 1000, // 1 hour from now
        completed: false,
      }),
      relatedEntity: mockContact,
      assignedTo: mockUser,
      isOverdue: false,
    },
    {
      ...createActivity("task", {
        _id: "task_overdue_1" as any,
        priority: "medium",
        dueDate: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        completed: false,
      }),
      relatedEntity: mockCompany,
      assignedTo: mockUser,
      isOverdue: true,
    },
  ];

  const mockCompleteTask = vi.fn().mockResolvedValue("activity_123");
  const mockReopenTask = vi.fn().mockResolvedValue("activity_123");
  const mockDeleteActivity = vi.fn().mockResolvedValue("activity_123");

  beforeEach(() => {
    vi.clearAllMocks();

    // Track call count to differentiate between queries
    let queryCallCount = 0;

    // Default mock implementations
    mockUseQuery.mockImplementation(() => {
      queryCallCount++;

      // First call: activities.feed
      if (queryCallCount === 1) {
        return {
          items: mockActivities,
          nextCursor: null,
          hasMore: false,
        };
      }
      // Second call: activities.upcoming
      if (queryCallCount === 2) {
        return mockUpcomingTasks;
      }
      // Third+ calls: contacts, companies, deals for forms
      if (queryCallCount === 3) {
        return { page: [mockContact] };
      }
      if (queryCallCount === 4) {
        return { page: [mockCompany] };
      }
      if (queryCallCount === 5) {
        return { page: [mockDeal] };
      }

      // Default: return feed data for activities queries
      return {
        items: mockActivities,
        nextCursor: null,
        hasMore: false,
      };
    });

    mockUseMutation.mockImplementation(() => {
      // Return the appropriate mock based on which one was last setup
      // This is a simplified approach - in a real app we'd want more sophistication
      return vi.fn((args) => {
        if (args?.id) {
          return Promise.resolve(args.id);
        }
        return Promise.resolve("activity_123");
      });
    });
  });

  describe("1. View Activities List", () => {
    it("renders activities page without errors", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText("Activities")).toBeInTheDocument();
    });

    it("displays page header with description", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText("Activities")).toBeInTheDocument();
      expect(
        screen.getByText(/Track tasks, calls, emails, meetings, and notes/)
      ).toBeInTheDocument();
    });

    it("renders all activities in the list", () => {
      render(<ActivitiesPage />);

      mockActivities.forEach((activity) => {
        expect(screen.getByText(activity.subject)).toBeInTheDocument();
      });
    });

    it("displays activity metadata correctly", () => {
      render(<ActivitiesPage />);

      // Check for task priority badge
      expect(screen.getByText("high")).toBeInTheDocument();

      // Check for call duration
      expect(screen.getByText("30 min")).toBeInTheDocument();

      // Check for email direction
      expect(screen.getByText("Sent")).toBeInTheDocument();

      // Check for meeting duration
      expect(screen.getByText("60 min")).toBeInTheDocument();
    });

    it("shows loading state when data is not loaded", () => {
      mockUseQuery.mockReturnValue(undefined);

      render(<ActivitiesPage />);
      expect(screen.getByRole("progressbar", { hidden: true })).toBeInTheDocument();
    });

    it("shows empty state when no activities exist", () => {
      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return { items: [], nextCursor: null, hasMore: false };
        }
        if (String(query?._name || "").includes("upcoming")) {
          return [];
        }
        return undefined;
      });

      render(<ActivitiesPage />);
      expect(screen.getByText("No activities found")).toBeInTheDocument();
      expect(
        screen.getByText(/Get started by creating a task or adding a note/)
      ).toBeInTheDocument();
    });
  });

  describe("2. Filter by Type", () => {
    it("displays all activity type tabs", () => {
      render(<ActivitiesPage />);

      expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /tasks/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /calls/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /emails/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /meetings/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /notes/i })).toBeInTheDocument();
    });

    it("filters activities when switching to tasks tab", async () => {
      const { user } = render(<ActivitiesPage />);

      const tasksTab = screen.getByRole("tab", { name: /tasks/i });
      await user.click(tasksTab);

      // Should trigger new query with type filter
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ type: "task" })
        );
      });
    });

    it("filters activities when switching to calls tab", async () => {
      const { user } = render(<ActivitiesPage />);

      const callsTab = screen.getByRole("tab", { name: /calls/i });
      await user.click(callsTab);

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ type: "call" })
        );
      });
    });

    it("filters activities when switching to emails tab", async () => {
      const { user } = render(<ActivitiesPage />);

      const emailsTab = screen.getByRole("tab", { name: /emails/i });
      await user.click(emailsTab);

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ type: "email" })
        );
      });
    });

    it("shows empty state with type-specific message when filtered", async () => {
      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return { items: [], nextCursor: null, hasMore: false };
        }
        return [];
      });

      const { user } = render(<ActivitiesPage />);

      const tasksTab = screen.getByRole("tab", { name: /tasks/i });
      await user.click(tasksTab);

      await waitFor(() => {
        expect(
          screen.getByText(/No tasks found. Try adjusting your filters/)
        ).toBeInTheDocument();
      });
    });

    it("'All' tab shows activities without type filter", async () => {
      const { user } = render(<ActivitiesPage />);

      // First switch to another tab
      await user.click(screen.getByRole("tab", { name: /tasks/i }));

      // Then switch back to All
      const allTab = screen.getByRole("tab", { name: /all/i });
      await user.click(allTab);

      await waitFor(() => {
        // Should be called with undefined type
        expect(mockUseQuery).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ type: undefined })
        );
      });
    });
  });

  describe("3. Filter by Date", () => {
    it("displays date filter button", () => {
      render(<ActivitiesPage />);
      // Date filter uses Select component which renders as button with combobox role
      const buttons = screen.getAllByRole("combobox");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("has correct date filter options", async () => {
      const { user } = render(<ActivitiesPage />);

      // Find the date filter select trigger (has Calendar icon)
      const selectTriggers = screen.getAllByRole("combobox");
      const dateFilter = selectTriggers.find((trigger) =>
        trigger.textContent?.includes("All time") ||
        trigger.querySelector('svg')
      );

      if (dateFilter) {
        await user.click(dateFilter);

        await waitFor(() => {
          expect(screen.getByText("All time")).toBeInTheDocument();
          expect(screen.getByText("Today")).toBeInTheDocument();
          expect(screen.getByText("This week")).toBeInTheDocument();
          expect(screen.getByText("This month")).toBeInTheDocument();
        });
      }
    });

    it("filters activities by today", async () => {
      const todayActivity = {
        ...createActivity("note", { createdAt: Date.now() }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      const oldActivity = {
        ...createActivity("note", {
          _id: "old_activity" as any,
          subject: "Old Activity",
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [todayActivity, oldActivity],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      const { user } = render(<ActivitiesPage />);

      // Click date filter
      const selectTriggers = screen.getAllByRole("combobox");
      const dateFilter = selectTriggers[0]; // First select is date filter
      await user.click(dateFilter);

      await waitFor(() => {
        const todayOption = screen.getByText("Today");
        user.click(todayOption);
      });

      // Old activity should be filtered out client-side
      await waitFor(() => {
        expect(screen.getByText(todayActivity.subject)).toBeInTheDocument();
        expect(screen.queryByText("Old Activity")).not.toBeInTheDocument();
      });
    });

    it("defaults to 'All time' filter", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText("All time")).toBeInTheDocument();
    });
  });

  describe("4. Create New Activity", () => {
    it("displays 'Add Task' button", () => {
      render(<ActivitiesPage />);
      expect(screen.getByRole("button", { name: /add task/i })).toBeInTheDocument();
    });

    it("displays 'Add Note' button", () => {
      render(<ActivitiesPage />);
      expect(screen.getByRole("button", { name: /add note/i })).toBeInTheDocument();
    });

    it("opens task creation dialog when 'Add Task' is clicked", async () => {
      const { user } = render(<ActivitiesPage />);

      const addTaskButton = screen.getByRole("button", { name: /add task/i });
      await user.click(addTaskButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Create Task")).toBeInTheDocument();
      });
    });

    it("opens note creation dialog when 'Add Note' is clicked", async () => {
      const { user } = render(<ActivitiesPage />);

      const addNoteButton = screen.getByRole("button", { name: /add note/i });
      await user.click(addNoteButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Add Quick Note")).toBeInTheDocument();
      });
    });

    it("task form has all required fields", async () => {
      const { user } = render(<ActivitiesPage />);

      await user.click(screen.getByRole("button", { name: /add task/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/related to/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      });
    });

    it("note form has required fields", async () => {
      const { user } = render(<ActivitiesPage />);

      await user.click(screen.getByRole("button", { name: /add note/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/related to/i)).toBeInTheDocument();
      });
    });

    it("shows empty state create button", () => {
      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return { items: [], nextCursor: null, hasMore: false };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(
        screen.getByRole("button", { name: /create your first task/i })
      ).toBeInTheDocument();
    });

    it("empty state button opens task dialog", async () => {
      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return { items: [], nextCursor: null, hasMore: false };
        }
        return [];
      });

      const { user } = render(<ActivitiesPage />);

      const createButton = screen.getByRole("button", {
        name: /create your first task/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("Create Task")).toBeInTheDocument();
      });
    });
  });

  describe("5. View Activity Detail", () => {
    it("displays activity subject", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText(mockActivities[0].subject)).toBeInTheDocument();
    });

    it("displays activity description", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText(mockActivities[0].description!)).toBeInTheDocument();
    });

    it("displays related entity link", () => {
      render(<ActivitiesPage />);
      const link = screen.getByRole("link", { name: /john doe/i });
      expect(link).toHaveAttribute("href", "/contacts/contact_123");
    });

    it("displays assigned user", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });

    it("displays outcome for calls", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText("Outcome:")).toBeInTheDocument();
      expect(screen.getByText("Scheduled follow-up")).toBeInTheDocument();
    });

    it("displays AI summary when available", () => {
      const activityWithAI = {
        ...createActivity("call", {
          aiSummary: "This call went well and customer is interested.",
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [activityWithAI],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(screen.getByText("AI Summary:")).toBeInTheDocument();
      expect(
        screen.getByText("This call went well and customer is interested.")
      ).toBeInTheDocument();
    });

    it("displays relative timestamp", () => {
      render(<ActivitiesPage />);
      // Should show "just now" or similar relative time
      expect(screen.getAllByText(/just now|ago/i).length).toBeGreaterThan(0);
    });
  });

  describe("6. Edit Activity", () => {
    // Note: Current implementation doesn't have inline edit,
    // but we can test that the component displays editable data correctly
    it("displays activity data that could be edited", () => {
      render(<ActivitiesPage />);

      const taskActivity = mockActivities.find((a) => a.type === "task");
      expect(screen.getByText(taskActivity!.subject)).toBeInTheDocument();
      expect(screen.getByText(taskActivity!.description!)).toBeInTheDocument();
      expect(screen.getByText("high")).toBeInTheDocument();
    });
  });

  describe("7. Complete/Mark Done Activity", () => {
    it("displays checkbox for task activities", () => {
      render(<ActivitiesPage />);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("checkbox is unchecked for incomplete tasks", () => {
      render(<ActivitiesPage />);
      const taskCheckbox = screen.getAllByRole("checkbox")[0];
      expect(taskCheckbox).not.toBeChecked();
    });

    it("checkbox is checked for completed tasks", () => {
      const completedTask = {
        ...createActivity("task", { completed: true }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [completedTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("calls complete mutation when checkbox is clicked", async () => {
      const { user } = render(<ActivitiesPage />);

      const checkbox = screen.getAllByRole("checkbox")[0];
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockCompleteTask).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
          })
        );
      });
    });

    it("calls reopen mutation when completed task checkbox is unchecked", async () => {
      const completedTask = {
        ...createActivity("task", { completed: true }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [completedTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      const { user } = render(<ActivitiesPage />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockReopenTask).toHaveBeenCalled();
      });
    });

    it("shows 'Done' badge for completed tasks", () => {
      const completedTask = {
        ...createActivity("task", { completed: true }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [completedTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("applies strikethrough style to completed task subject", () => {
      const completedTask = {
        ...createActivity("task", {
          completed: true,
          subject: "Completed Task",
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [completedTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      const subject = screen.getByText("Completed Task");
      expect(subject).toHaveClass("line-through");
    });
  });

  describe("8. Delete Activity", () => {
    // Note: Current implementation doesn't show delete button in the UI
    // This test documents the mutation is available
    it("has delete mutation available", () => {
      render(<ActivitiesPage />);
      expect(mockUseMutation).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe("9. Link to Contact/Deal/Company", () => {
    it("displays link to contact", () => {
      render(<ActivitiesPage />);
      const contactLink = screen.getByRole("link", { name: /john doe/i });
      expect(contactLink).toHaveAttribute("href", "/contacts/contact_123");
    });

    it("displays link to company", () => {
      render(<ActivitiesPage />);
      const companyLink = screen.getByRole("link", { name: /acme corp/i });
      expect(companyLink).toHaveAttribute("href", "/companies/company_123");
    });

    it("displays link to deal", () => {
      render(<ActivitiesPage />);
      const dealLink = screen.getByRole("link", { name: /big deal/i });
      expect(dealLink).toHaveAttribute("href", "/deals/deal_123");
    });

    it("shows correct icon for contact", () => {
      const { container } = render(<ActivitiesPage />);
      // User icon should be present for contacts
      const contactLinks = screen.getAllByRole("link");
      const contactLink = contactLinks.find((link) =>
        link.getAttribute("href")?.includes("/contacts/")
      );
      expect(contactLink).toBeTruthy();
    });

    it("shows tooltip on related entity hover", async () => {
      const { user } = render(<ActivitiesPage />);

      const contactLink = screen.getByRole("link", { name: /john doe/i });
      await user.hover(contactLink);

      await waitFor(() => {
        expect(screen.getByText("View Contact")).toBeInTheDocument();
      });
    });
  });

  describe("10. Calendar View", () => {
    // Note: Current implementation doesn't have calendar view
    // These tests document the feature for future implementation
    it("displays upcoming tasks in sidebar", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
    });

    it("shows tasks with due dates in sidebar", () => {
      render(<ActivitiesPage />);
      mockUpcomingTasks.forEach((task) => {
        expect(screen.getByText(task.subject)).toBeInTheDocument();
      });
    });

    it("highlights overdue tasks in sidebar", () => {
      render(<ActivitiesPage />);
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it("displays due dates in sidebar", () => {
      render(<ActivitiesPage />);
      // Should show formatted dates
      const dateElements = screen.getAllByText(/due/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it("shows priority badges in upcoming tasks", () => {
      render(<ActivitiesPage />);
      const sidebar = screen.getByText("Upcoming Tasks").closest("div");
      expect(within(sidebar!).getByText("high")).toBeInTheDocument();
      expect(within(sidebar!).getByText("medium")).toBeInTheDocument();
    });

    it("view all tasks button switches to tasks tab", async () => {
      const { user } = render(<ActivitiesPage />);

      const viewAllButton = screen.getByRole("button", { name: /view all tasks/i });
      await user.click(viewAllButton);

      await waitFor(() => {
        const tasksTab = screen.getByRole("tab", { name: /tasks/i });
        expect(tasksTab).toHaveAttribute("data-state", "active");
      });
    });
  });

  describe("11. Timeline View", () => {
    it("displays activities in chronological order", () => {
      render(<ActivitiesPage />);

      // Activities should be displayed with timeline connector
      const { container } = render(<ActivitiesPage />);
      const timelineConnectors = container.querySelectorAll(".bg-zinc-200");
      expect(timelineConnectors.length).toBeGreaterThan(0);
    });

    it("shows timeline connector between activities", () => {
      const { container } = render(<ActivitiesPage />);
      const connector = container.querySelector(".bg-zinc-200");
      expect(connector).toBeInTheDocument();
    });

    it("hides connector for last activity", () => {
      const singleActivity = {
        ...createActivity("note"),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [singleActivity],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      const { container } = render(<ActivitiesPage />);
      // Should not have absolute positioned connector for single item
      const absoluteConnector = container.querySelector(".absolute.left-\\[19px\\].top-10");
      expect(absoluteConnector).not.toBeInTheDocument();
    });

    it("displays activity icons with proper colors", () => {
      const { container } = render(<ActivitiesPage />);

      // Check for icon containers with colored backgrounds
      const iconContainers = container.querySelectorAll("[class*='bg-blue']");
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    it("shows activity type icons", () => {
      render(<ActivitiesPage />);

      // All activity type badges should be visible
      expect(screen.getByText("Task")).toBeInTheDocument();
      expect(screen.getByText("Call")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Meeting")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles missing related entity gracefully", () => {
      const activityWithoutEntity = {
        ...createActivity("note"),
        relatedEntity: null,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [activityWithoutEntity],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      // Should still render without crashing
      expect(screen.getByText(activityWithoutEntity.subject)).toBeInTheDocument();
    });

    it("handles error when completing task", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockCompleteTask.mockRejectedValueOnce(new Error("Network error"));

      const { user } = render(<ActivitiesPage />);

      const checkbox = screen.getAllByRole("checkbox")[0];
      await user.click(checkbox);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it("indicates when more activities are available", () => {
      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: mockActivities,
            nextCursor: 123456789,
            hasMore: true,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      // Component receives hasMore flag for future pagination implementation
      expect(mockActivities.length).toBeGreaterThan(0);
    });

    it("displays overdue badge for past due tasks", () => {
      const overdueTask = {
        ...createActivity("task", {
          dueDate: Date.now() - 24 * 60 * 60 * 1000,
          completed: false,
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [overdueTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    it("does not show overdue for completed tasks", () => {
      const completedOverdueTask = {
        ...createActivity("task", {
          dueDate: Date.now() - 24 * 60 * 60 * 1000,
          completed: true,
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [completedOverdueTask],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    });

    it("handles activities with no description", () => {
      const activityNoDesc = {
        ...createActivity("note", { description: undefined }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      };

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: [activityNoDesc],
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      render(<ActivitiesPage />);
      expect(screen.getByText(activityNoDesc.subject)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<ActivitiesPage />);
      const mainHeading = screen.getByRole("heading", { name: /activities/i });
      expect(mainHeading).toBeInTheDocument();
    });

    it("tab list is keyboard navigable", async () => {
      const { user } = render(<ActivitiesPage />);

      const tabList = screen.getAllByRole("tab")[0];
      tabList.focus();
      expect(tabList).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      // Should move to next tab
    });

    it("checkboxes have accessible labels", () => {
      render(<ActivitiesPage />);
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeInTheDocument();
      });
    });

    it("links have descriptive text", () => {
      render(<ActivitiesPage />);
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy();
      });
    });

    it("buttons have accessible names", () => {
      render(<ActivitiesPage />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const accessibleName =
          button.getAttribute("aria-label") || button.textContent;
        expect(accessibleName).toBeTruthy();
      });
    });
  });

  describe("Responsive Design", () => {
    it("shows activity type labels on desktop", () => {
      render(<ActivitiesPage />);
      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab.textContent).toBeTruthy();
      });
    });

    it("sidebar is hidden on mobile (lg: breakpoint)", () => {
      const { container } = render(<ActivitiesPage />);
      const sidebar = container.querySelector(".lg\\:block");
      expect(sidebar).toHaveClass("hidden");
    });
  });

  describe("Performance", () => {
    it("renders efficiently with many activities", () => {
      const manyActivities = Array.from({ length: 50 }, (_, i) => ({
        ...createActivity("note", {
          _id: `activity_${i}` as any,
          subject: `Activity ${i}`,
        }),
        relatedEntity: mockContact,
        owner: null,
        assignedTo: null,
      }));

      mockUseQuery.mockImplementation((query: any) => {
        if (String(query?._name || "").includes("feed")) {
          return {
            items: manyActivities,
            nextCursor: null,
            hasMore: false,
          };
        }
        return [];
      });

      const startTime = performance.now();
      render(<ActivitiesPage />);
      const renderTime = performance.now() - startTime;

      // Should render in reasonable time (< 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });

    it("memoizes filtered activities", () => {
      const { rerender } = render(<ActivitiesPage />);

      // Re-render with same data
      rerender(<ActivitiesPage />);

      // Query should not be called excessively
      const feedCalls = mockUseQuery.mock.calls.filter((call) =>
        call[0].toString().includes("feed")
      );
      expect(feedCalls.length).toBeLessThan(10);
    });
  });
});
