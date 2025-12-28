import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ActivityItem } from "../activity-item";
import { createMockActivity } from "@/test/test-utils";

describe("ActivityItem", () => {
  const mockActivity = {
    ...createMockActivity(),
    relatedEntity: {
      _id: "contact_123",
      firstName: "John",
      lastName: "Doe",
    },
    owner: null,
    assignedTo: null,
  };

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText("Follow up with client")).toBeInTheDocument();
    });

    it("renders activity subject", () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText("Follow up with client")).toBeInTheDocument();
    });

    it("renders activity description", () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText("Discuss pricing options")).toBeInTheDocument();
    });

    it("renders related entity name", () => {
      render(<ActivityItem activity={mockActivity} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Activity Types", () => {
    it("renders task activity correctly", () => {
      const taskActivity = { ...mockActivity, type: "task" as const };
      render(<ActivityItem activity={taskActivity} />);
      expect(screen.getByText("Task")).toBeInTheDocument();
    });

    it("renders call activity correctly", () => {
      const callActivity = {
        ...mockActivity,
        type: "call" as const,
        duration: 30,
      };
      render(<ActivityItem activity={callActivity} />);
      expect(screen.getByText("Call")).toBeInTheDocument();
      expect(screen.getByText("30 min")).toBeInTheDocument();
    });

    it("renders email activity correctly", () => {
      const emailActivity = {
        ...mockActivity,
        type: "email" as const,
        emailDirection: "outbound" as const,
      };
      render(<ActivityItem activity={emailActivity} />);
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    it("renders meeting activity correctly", () => {
      const meetingActivity = {
        ...mockActivity,
        type: "meeting" as const,
        duration: 60,
      };
      render(<ActivityItem activity={meetingActivity} />);
      expect(screen.getByText("Meeting")).toBeInTheDocument();
      expect(screen.getByText("60 min")).toBeInTheDocument();
    });

    it("renders note activity correctly", () => {
      const noteActivity = { ...mockActivity, type: "note" as const };
      render(<ActivityItem activity={noteActivity} />);
      expect(screen.getByText("Note")).toBeInTheDocument();
    });
  });

  describe("Task Completion", () => {
    it("renders checkbox for task activities", () => {
      const taskActivity = { ...mockActivity, type: "task" as const };
      render(<ActivityItem activity={taskActivity} onTaskComplete={vi.fn()} />);

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("checkbox is checked when task is completed", () => {
      const completedTask = {
        ...mockActivity,
        type: "task" as const,
        completed: true,
      };
      render(<ActivityItem activity={completedTask} onTaskComplete={vi.fn()} />);

      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("calls onTaskComplete when checkbox is clicked", async () => {
      const handleComplete = vi.fn();
      const taskActivity = { ...mockActivity, type: "task" as const };
      const { user } = render(
        <ActivityItem activity={taskActivity} onTaskComplete={handleComplete} />
      );

      await user.click(screen.getByRole("checkbox"));
      expect(handleComplete).toHaveBeenCalledWith("activity_123", true);
    });

    it("shows completed badge when task is done", () => {
      const completedTask = {
        ...mockActivity,
        type: "task" as const,
        completed: true,
      };
      render(<ActivityItem activity={completedTask} />);

      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("applies strikethrough to completed task subject", () => {
      const completedTask = {
        ...mockActivity,
        type: "task" as const,
        completed: true,
      };
      render(<ActivityItem activity={completedTask} />);

      const subject = screen.getByText("Follow up with client");
      expect(subject).toHaveClass("line-through");
    });
  });

  describe("Priority Badges", () => {
    it("renders high priority badge", () => {
      const highPriorityTask = {
        ...mockActivity,
        type: "task" as const,
        priority: "high" as const,
      };
      render(<ActivityItem activity={highPriorityTask} />);

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("renders medium priority badge", () => {
      const mediumPriorityTask = {
        ...mockActivity,
        type: "task" as const,
        priority: "medium" as const,
      };
      render(<ActivityItem activity={mediumPriorityTask} />);

      expect(screen.getByText("medium")).toBeInTheDocument();
    });

    it("renders low priority badge", () => {
      const lowPriorityTask = {
        ...mockActivity,
        type: "task" as const,
        priority: "low" as const,
      };
      render(<ActivityItem activity={lowPriorityTask} />);

      expect(screen.getByText("low")).toBeInTheDocument();
    });
  });

  describe("Overdue Indicator", () => {
    it("shows overdue badge for overdue tasks", () => {
      const overdueTask = {
        ...mockActivity,
        type: "task" as const,
        dueDate: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
        completed: false,
      };
      render(<ActivityItem activity={overdueTask} />);

      expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    it("does not show overdue for completed tasks", () => {
      const completedOverdueTask = {
        ...mockActivity,
        type: "task" as const,
        dueDate: Date.now() - 24 * 60 * 60 * 1000,
        completed: true,
      };
      render(<ActivityItem activity={completedOverdueTask} />);

      expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    });

    it("does not show overdue for future due dates", () => {
      const futureTask = {
        ...mockActivity,
        type: "task" as const,
        dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
        completed: false,
      };
      render(<ActivityItem activity={futureTask} />);

      expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    });
  });

  describe("Due Date Display", () => {
    it("shows due date for tasks", () => {
      const taskWithDueDate = {
        ...mockActivity,
        type: "task" as const,
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
      };
      render(<ActivityItem activity={taskWithDueDate} />);

      expect(screen.getByText(/due/i)).toBeInTheDocument();
    });
  });

  describe("Email Direction", () => {
    it("shows Received for inbound emails", () => {
      const inboundEmail = {
        ...mockActivity,
        type: "email" as const,
        emailDirection: "inbound" as const,
      };
      render(<ActivityItem activity={inboundEmail} />);

      expect(screen.getByText("Received")).toBeInTheDocument();
    });

    it("shows Sent for outbound emails", () => {
      const outboundEmail = {
        ...mockActivity,
        type: "email" as const,
        emailDirection: "outbound" as const,
      };
      render(<ActivityItem activity={outboundEmail} />);

      expect(screen.getByText("Sent")).toBeInTheDocument();
    });
  });

  describe("Assigned User", () => {
    it("displays assigned user name", () => {
      const activityWithAssignee = {
        ...mockActivity,
        assignedTo: {
          _id: "user_123",
          firstName: "Jane",
          lastName: "Smith",
        } as any,
      };
      render(<ActivityItem activity={activityWithAssignee} />);

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });
  });

  describe("Outcome Display", () => {
    it("shows outcome for activities with outcome", () => {
      const activityWithOutcome = {
        ...mockActivity,
        type: "call" as const,
        outcome: "Scheduled follow-up meeting",
      };
      render(<ActivityItem activity={activityWithOutcome} />);

      expect(screen.getByText("Outcome:")).toBeInTheDocument();
      expect(screen.getByText("Scheduled follow-up meeting")).toBeInTheDocument();
    });
  });

  describe("AI Summary", () => {
    it("shows AI summary when available", () => {
      const activityWithAISummary = {
        ...mockActivity,
        aiSummary: "This is an AI-generated summary of the activity.",
      };
      render(<ActivityItem activity={activityWithAISummary} />);

      expect(screen.getByText("AI Summary:")).toBeInTheDocument();
      expect(screen.getByText("This is an AI-generated summary of the activity.")).toBeInTheDocument();
    });
  });

  describe("Timeline Connector", () => {
    it("shows connector line by default", () => {
      const { container } = render(<ActivityItem activity={mockActivity} />);

      const connector = container.querySelector(".bg-zinc-200");
      expect(connector).toBeInTheDocument();
    });

    it("hides connector line when isLast is true", () => {
      const { container } = render(
        <ActivityItem activity={mockActivity} isLast={true} />
      );

      // The connector should not be present for the last item
      const absoluteConnector = container.querySelector(".absolute.left-\\[19px\\].top-10");
      expect(absoluteConnector).not.toBeInTheDocument();
    });
  });

  describe("Related Entity Link", () => {
    it("renders link to contact", () => {
      render(<ActivityItem activity={mockActivity} />);

      const link = screen.getByRole("link", { name: /john doe/i });
      expect(link).toHaveAttribute("href", "/contacts/contact_123");
    });

    it("renders link to company", () => {
      const companyActivity = {
        ...mockActivity,
        relatedToType: "company" as const,
        relatedToId: "company_123",
        relatedEntity: {
          _id: "company_123",
          name: "Acme Corp",
        },
      };
      render(<ActivityItem activity={companyActivity} />);

      const link = screen.getByRole("link", { name: /acme corp/i });
      expect(link).toHaveAttribute("href", "/companies/company_123");
    });

    it("renders link to deal", () => {
      const dealActivity = {
        ...mockActivity,
        relatedToType: "deal" as const,
        relatedToId: "deal_123",
        relatedEntity: {
          _id: "deal_123",
          name: "Big Deal",
        },
      };
      render(<ActivityItem activity={dealActivity} />);

      const link = screen.getByRole("link", { name: /big deal/i });
      expect(link).toHaveAttribute("href", "/deals/deal_123");
    });
  });

  describe("Timestamp", () => {
    it("shows relative time for activity", () => {
      render(<ActivityItem activity={mockActivity} />);

      // Should show something like "just now" or "Xm ago"
      expect(screen.getByText(/just now|ago/i)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies correct icon color for activity type", () => {
      const { container } = render(<ActivityItem activity={mockActivity} />);

      // Task type should have blue icon background
      const iconContainer = container.querySelector(".bg-blue-100");
      expect(iconContainer).toBeInTheDocument();
    });

    it("applies overdue styling to card border", () => {
      const overdueTask = {
        ...mockActivity,
        type: "task" as const,
        dueDate: Date.now() - 24 * 60 * 60 * 1000,
        completed: false,
      };
      const { container } = render(<ActivityItem activity={overdueTask} />);

      const card = container.querySelector(".border-red-200");
      expect(card).toBeInTheDocument();
    });

    it("applies reduced opacity to completed activities", () => {
      const completedTask = {
        ...mockActivity,
        type: "task" as const,
        completed: true,
      };
      const { container } = render(<ActivityItem activity={completedTask} />);

      const opacityElement = container.querySelector(".opacity-70");
      expect(opacityElement).toBeInTheDocument();
    });
  });
});
