import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { EmptyState } from "../empty-state";
import { Star } from "lucide-react";

describe("EmptyState", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<EmptyState />);
      expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    });

    it("renders default variant correctly", () => {
      render(<EmptyState variant="default" />);
      expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
      expect(
        screen.getByText("Get started by creating your first item.")
      ).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders contacts variant", () => {
      render(<EmptyState variant="contacts" />);
      expect(screen.getByText("No contacts yet")).toBeInTheDocument();
      expect(
        screen.getByText("Get started by adding your first contact.")
      ).toBeInTheDocument();
    });

    it("renders companies variant", () => {
      render(<EmptyState variant="companies" />);
      expect(screen.getByText("No companies yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start building your company directory.")
      ).toBeInTheDocument();
    });

    it("renders deals variant", () => {
      render(<EmptyState variant="deals" />);
      expect(screen.getByText("No deals in pipeline")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first deal to start tracking revenue.")
      ).toBeInTheDocument();
    });

    it("renders conversations variant", () => {
      render(<EmptyState variant="conversations" />);
      expect(screen.getByText("No conversations")).toBeInTheDocument();
      expect(
        screen.getByText("Start a conversation with a contact.")
      ).toBeInTheDocument();
    });

    it("renders activities variant", () => {
      render(<EmptyState variant="activities" />);
      expect(screen.getByText("No activities scheduled")).toBeInTheDocument();
      expect(
        screen.getByText("Schedule your first meeting or task.")
      ).toBeInTheDocument();
    });

    it("renders documents variant", () => {
      render(<EmptyState variant="documents" />);
      expect(screen.getByText("No documents")).toBeInTheDocument();
      expect(
        screen.getByText("Upload or create your first document.")
      ).toBeInTheDocument();
    });

    it("renders search variant", () => {
      render(<EmptyState variant="search" />);
      expect(screen.getByText("No results found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your search or filters.")
      ).toBeInTheDocument();
    });
  });

  describe("Custom Content", () => {
    it("shows custom title", () => {
      render(<EmptyState title="Custom Title" />);
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      // Should not show default title
      expect(screen.queryByText("Nothing here yet")).not.toBeInTheDocument();
    });

    it("shows custom description", () => {
      render(<EmptyState description="Custom description text" />);
      expect(screen.getByText("Custom description text")).toBeInTheDocument();
    });

    it("shows both custom title and description", () => {
      render(
        <EmptyState
          title="My Custom Title"
          description="My custom description"
        />
      );
      expect(screen.getByText("My Custom Title")).toBeInTheDocument();
      expect(screen.getByText("My custom description")).toBeInTheDocument();
    });

    it("custom title overrides variant title", () => {
      render(<EmptyState variant="contacts" title="Override Title" />);
      expect(screen.getByText("Override Title")).toBeInTheDocument();
      expect(screen.queryByText("No contacts yet")).not.toBeInTheDocument();
    });

    it("custom description overrides variant description", () => {
      render(
        <EmptyState variant="contacts" description="Override Description" />
      );
      expect(screen.getByText("Override Description")).toBeInTheDocument();
      expect(
        screen.queryByText("Get started by adding your first contact.")
      ).not.toBeInTheDocument();
    });
  });

  describe("Custom Icon", () => {
    it("renders custom icon when provided", () => {
      const { container } = render(<EmptyState icon={Star} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders variant icon when custom icon not provided", () => {
      const { container } = render(<EmptyState variant="contacts" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Action Button", () => {
    it("renders action button when both actionLabel and onAction provided", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState actionLabel="Add Contact" onAction={handleAction} />
      );
      expect(
        screen.getByRole("button", { name: "Add Contact" })
      ).toBeInTheDocument();
    });

    it("calls onAction when button is clicked", async () => {
      const handleAction = vi.fn();
      const { user } = render(
        <EmptyState actionLabel="Create Item" onAction={handleAction} />
      );

      await user.click(screen.getByRole("button", { name: "Create Item" }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("does not render button when actionLabel is not provided", () => {
      const handleAction = vi.fn();
      render(<EmptyState onAction={handleAction} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not render button when onAction is not provided", () => {
      render(<EmptyState actionLabel="Click Me" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not render button when neither actionLabel nor onAction provided", () => {
      render(<EmptyState />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<EmptyState className="custom-class" />);
      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass("custom-class");
    });

    it("has centered layout", () => {
      const { container } = render(<EmptyState />);
      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass("flex");
      expect(emptyState).toHaveClass("flex-col");
      expect(emptyState).toHaveClass("items-center");
      expect(emptyState).toHaveClass("justify-center");
      expect(emptyState).toHaveClass("text-center");
    });

    it("has appropriate padding", () => {
      const { container } = render(<EmptyState />);
      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass("py-12");
      expect(emptyState).toHaveClass("px-4");
    });

    it("icon container has circular background", () => {
      const { container } = render(<EmptyState />);
      const iconContainer = container.querySelector(".rounded-full");
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass("h-16");
      expect(iconContainer).toHaveClass("w-16");
    });

    it("title has correct styling", () => {
      render(<EmptyState title="Test Title" />);
      const title = screen.getByText("Test Title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
    });

    it("description has muted styling", () => {
      render(<EmptyState description="Test description" />);
      const description = screen.getByText("Test description");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-zinc-500");
    });
  });

  describe("Accessibility", () => {
    it("button is keyboard accessible", async () => {
      const handleAction = vi.fn();
      const { user } = render(
        <EmptyState actionLabel="Add Item" onAction={handleAction} />
      );

      const button = screen.getByRole("button", { name: "Add Item" });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleAction).toHaveBeenCalled();
    });

    it("heading element is used for title", () => {
      render(<EmptyState title="Test Heading" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Test Heading");
    });
  });
});
