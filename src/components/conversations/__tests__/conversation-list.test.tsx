import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ConversationList } from "../conversation-list";
import { createMockConversation } from "@/test/test-utils";

describe("ConversationList", () => {
  const mockConversations = [
    createMockConversation({
      _id: "conv_1",
      phoneNumber: "+1 555-111-1111",
      contact: {
        _id: "contact_1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
      lastMessagePreview: "Hello, how are you?",
      unreadCount: 3,
      isIMessage: true,
    }),
    createMockConversation({
      _id: "conv_2",
      phoneNumber: "+1 555-222-2222",
      contact: {
        _id: "contact_2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      },
      lastMessagePreview: "Thanks for the update!",
      unreadCount: 0,
      isIMessage: false,
    }),
    createMockConversation({
      _id: "conv_3",
      phoneNumber: "+1 555-333-3333",
      contact: null,
      lastMessagePreview: "New message from unknown",
      unreadCount: 1,
      isIMessage: true,
    }),
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders all conversations", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("+1 555-333-3333")).toBeInTheDocument();
    });

    it("renders message previews", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
      expect(screen.getByText("Thanks for the update!")).toBeInTheDocument();
    });

    it("shows phone number when no contact", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("+1 555-333-3333")).toBeInTheDocument();
    });
  });

  describe("Avatar", () => {
    it("shows contact initials when no avatar", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("JD")).toBeInTheDocument();
      expect(screen.getByText("JS")).toBeInTheDocument();
    });

    it("shows last two digits of phone when no contact", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // For +1 555-333-3333, should show "33"
      expect(screen.getByText("33")).toBeInTheDocument();
    });

    it("renders avatar image when URL provided", () => {
      const conversationWithAvatar = [
        createMockConversation({
          _id: "conv_avatar",
          contact: {
            _id: "contact_avatar",
            firstName: "Avatar",
            lastName: "User",
            avatarUrl: "https://example.com/avatar.jpg",
          },
        }),
      ];

      render(
        <ConversationList
          conversations={conversationWithAvatar}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });
  });

  describe("Message Type Indicator", () => {
    it("shows iMessage indicator", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // Should have "i" indicator for iMessage
      const iMessageIndicators = screen.getAllByText("i");
      expect(iMessageIndicators.length).toBeGreaterThan(0);
    });

    it("shows SMS indicator", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // Should have "S" indicator for SMS
      expect(screen.getByText("S")).toBeInTheDocument();
    });
  });

  describe("Unread Count", () => {
    it("shows unread badge when there are unread messages", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("does not show unread badge when count is 0", () => {
      const noUnreadConversations = [
        createMockConversation({
          _id: "conv_no_unread",
          contact: { _id: "c1", firstName: "No", lastName: "Unread" },
          unreadCount: 0,
        }),
      ];

      render(
        <ConversationList
          conversations={noUnreadConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // Should not have any unread count badges
      const unreadBadges = screen.queryAllByText(/^\d+$/).filter(el =>
        el.classList.contains("bg-blue-500")
      );
      expect(unreadBadges).toHaveLength(0);
    });

    it("shows 99+ for large unread counts", () => {
      const manyUnreadConversation = [
        createMockConversation({
          _id: "conv_many_unread",
          contact: { _id: "c1", firstName: "Many", lastName: "Unread" },
          unreadCount: 150,
        }),
      ];

      render(
        <ConversationList
          conversations={manyUnreadConversation}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("highlights selected conversation", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId="conv_1"
          onSelect={mockOnSelect}
        />
      );

      // Find the button containing John Doe
      const buttons = screen.getAllByRole("button");
      const selectedButton = buttons.find(btn =>
        btn.textContent?.includes("John Doe")
      );
      expect(selectedButton).toHaveClass("bg-blue-50");
    });

    it("calls onSelect when conversation is clicked", async () => {
      const { user } = render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      await user.click(screen.getByText("John Doe"));

      expect(mockOnSelect).toHaveBeenCalledWith("conv_1");
    });

    it("can select different conversations", async () => {
      const { user } = render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      await user.click(screen.getByText("Jane Smith"));

      expect(mockOnSelect).toHaveBeenCalledWith("conv_2");
    });
  });

  describe("Status Indicators", () => {
    it("shows AI enabled indicator", () => {
      const aiEnabledConversation = [
        createMockConversation({
          _id: "conv_ai",
          contact: { _id: "c1", firstName: "AI", lastName: "Enabled" },
          aiEnabled: true,
        }),
      ];

      const { container } = render(
        <ConversationList
          conversations={aiEnabledConversation}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // AI indicator should be visible
      const aiIndicator = container.querySelector(".bg-purple-100");
      expect(aiIndicator).toBeInTheDocument();
    });

    it("shows workflow active indicator", () => {
      const workflowActiveConversation = [
        createMockConversation({
          _id: "conv_workflow",
          contact: { _id: "c1", firstName: "Workflow", lastName: "Active" },
          status: "workflow_active",
        }),
      ];

      const { container } = render(
        <ConversationList
          conversations={workflowActiveConversation}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // Workflow indicator should be visible
      const workflowIndicator = container.querySelector(".bg-blue-100");
      expect(workflowIndicator).toBeInTheDocument();
    });
  });

  describe("Relative Time", () => {
    it("shows relative time for last message", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // Should show something like "10m ago" or similar
      expect(screen.getAllByText(/ago|just now/i).length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("renders empty when no conversations", () => {
      const { container } = render(
        <ConversationList
          conversations={[]}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      // The list should be empty but render the container
      const list = container.querySelector(".divide-y");
      expect(list).toBeInTheDocument();
      expect(list?.children).toHaveLength(0);
    });
  });

  describe("Message Preview", () => {
    it("shows No messages yet when no preview", () => {
      const noPreviewConversation = [
        createMockConversation({
          _id: "conv_no_preview",
          contact: { _id: "c1", firstName: "No", lastName: "Preview" },
          lastMessagePreview: undefined,
        }),
      ];

      render(
        <ConversationList
          conversations={noPreviewConversation}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText("No messages yet")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("has dividers between conversations", () => {
      const { container } = render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      const dividerContainer = container.querySelector(".divide-y");
      expect(dividerContainer).toBeInTheDocument();
    });

    it("applies hover styles to conversation items", () => {
      const { container } = render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("hover:bg-zinc-50");
    });
  });

  describe("Accessibility", () => {
    it("conversation items are focusable buttons", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(mockConversations.length);
    });

    it("can navigate with keyboard", async () => {
      const { user } = render(
        <ConversationList
          conversations={mockConversations}
          selectedId={null}
          onSelect={mockOnSelect}
        />
      );

      await user.tab();

      const firstButton = screen.getAllByRole("button")[0];
      expect(firstButton).toHaveFocus();
    });
  });
});
