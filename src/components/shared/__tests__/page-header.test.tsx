import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PageHeader, PageHeaderActions } from "../page-header";
import { Button } from "@/components/ui/button";

describe("PageHeader", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<PageHeader title="Test Page" />);
      expect(screen.getByText("Test Page")).toBeInTheDocument();
    });

    it("renders title correctly", () => {
      render(<PageHeader title="Dashboard" />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders title as h1 heading", () => {
      render(<PageHeader title="My Page Title" />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("My Page Title");
    });
  });

  describe("Description", () => {
    it("renders description when provided", () => {
      render(
        <PageHeader
          title="Contacts"
          description="Manage your contacts and leads"
        />
      );
      expect(screen.getByText("Manage your contacts and leads")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      render(<PageHeader title="Contacts" />);
      // Should only have the title, no description paragraph
      const paragraphs = document.querySelectorAll("p");
      expect(paragraphs).toHaveLength(0);
    });

    it("description has muted styling", () => {
      render(
        <PageHeader title="Title" description="Description text here" />
      );
      const description = screen.getByText("Description text here");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-muted-foreground");
    });
  });

  describe("Actions", () => {
    it("renders actions when provided", () => {
      render(
        <PageHeader
          title="Contacts"
          actions={<Button>Add Contact</Button>}
        />
      );
      expect(screen.getByRole("button", { name: "Add Contact" })).toBeInTheDocument();
    });

    it("renders multiple actions", () => {
      render(
        <PageHeader
          title="Contacts"
          actions={
            <>
              <Button variant="outline">Export</Button>
              <Button>Add Contact</Button>
            </>
          }
        />
      );
      expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Contact" })).toBeInTheDocument();
    });

    it("does not render actions container when actions not provided", () => {
      const { container } = render(<PageHeader title="Title" />);
      // Should only have one child div (the title container)
      const flexChildren = container.querySelectorAll(".flex.items-center.gap-2");
      // No actions container should exist
      expect(flexChildren).toHaveLength(0);
    });

    it("renders custom React nodes as actions", () => {
      render(
        <PageHeader
          title="Dashboard"
          actions={<span data-testid="custom-action">Custom Action</span>}
        />
      );
      expect(screen.getByTestId("custom-action")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <PageHeader title="Title" className="custom-class" />
      );
      const header = container.firstChild;
      expect(header).toHaveClass("custom-class");
    });

    it("has responsive flex layout", () => {
      const { container } = render(<PageHeader title="Title" />);
      const header = container.firstChild;
      expect(header).toHaveClass("flex");
      expect(header).toHaveClass("flex-col");
      expect(header).toHaveClass("sm:flex-row");
    });

    it("has gap between title and actions on mobile", () => {
      const { container } = render(<PageHeader title="Title" />);
      const header = container.firstChild;
      expect(header).toHaveClass("gap-1");
    });

    it("aligns items center on larger screens", () => {
      const { container } = render(<PageHeader title="Title" />);
      const header = container.firstChild;
      expect(header).toHaveClass("sm:items-center");
    });

    it("has justify-between on larger screens", () => {
      const { container } = render(<PageHeader title="Title" />);
      const header = container.firstChild;
      expect(header).toHaveClass("sm:justify-between");
    });

    it("title has correct typography", () => {
      render(<PageHeader title="Page Title" />);
      const title = screen.getByText("Page Title");
      expect(title).toHaveClass("text-2xl");
      expect(title).toHaveClass("font-semibold");
      expect(title).toHaveClass("tracking-tight");
    });
  });

  describe("Layout Structure", () => {
    it("title and description are in their own container", () => {
      const { container } = render(
        <PageHeader title="Title" description="Description" />
      );
      const textContainer = container.querySelector(".space-y-1");
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toContainElement(screen.getByText("Title"));
      expect(textContainer).toContainElement(screen.getByText("Description"));
    });

    it("actions are wrapped in flex container", () => {
      render(
        <PageHeader
          title="Title"
          actions={<Button>Action</Button>}
        />
      );
      const button = screen.getByRole("button", { name: "Action" });
      const actionsContainer = button.parentElement;
      expect(actionsContainer).toHaveClass("flex");
      expect(actionsContainer).toHaveClass("items-center");
      expect(actionsContainer).toHaveClass("gap-2");
    });
  });
});

describe("PageHeaderActions", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      render(
        <PageHeaderActions>
          <Button>Test</Button>
        </PageHeaderActions>
      );
      expect(screen.getByRole("button", { name: "Test" })).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(
        <PageHeaderActions>
          <Button>Action 1</Button>
          <Button>Action 2</Button>
        </PageHeaderActions>
      );
      expect(screen.getByRole("button", { name: "Action 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action 2" })).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <PageHeaderActions className="custom-class">
          <Button>Test</Button>
        </PageHeaderActions>
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("has flex layout", () => {
      const { container } = render(
        <PageHeaderActions>
          <Button>Test</Button>
        </PageHeaderActions>
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("gap-2");
    });
  });
});
