import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import {
  Spinner,
  FullPageSpinner,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  InlineLoading,
} from "../loading-state";

describe("Spinner", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("has animation class", () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("animate-spin");
    });
  });

  describe("Sizes", () => {
    it("renders small size correctly", () => {
      const { container } = render(<Spinner size="sm" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-4");
      expect(svg).toHaveClass("w-4");
    });

    it("renders medium size correctly (default)", () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-6");
      expect(svg).toHaveClass("w-6");
    });

    it("renders medium size explicitly", () => {
      const { container } = render(<Spinner size="md" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-6");
      expect(svg).toHaveClass("w-6");
    });

    it("renders large size correctly", () => {
      const { container } = render(<Spinner size="lg" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-8");
      expect(svg).toHaveClass("w-8");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<Spinner className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("has muted color styling", () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("text-zinc-400");
    });
  });
});

describe("FullPageSpinner", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<FullPageSpinner />);
      const spinner = container.querySelector("svg");
      expect(spinner).toBeInTheDocument();
    });

    it("shows large spinner", () => {
      const { container } = render(<FullPageSpinner />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-8");
      expect(svg).toHaveClass("w-8");
    });
  });

  describe("Message", () => {
    it("shows message when provided", () => {
      render(<FullPageSpinner message="Loading data..." />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("does not show message when not provided", () => {
      const { container } = render(<FullPageSpinner />);
      // Only the spinner should be present, no text
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs).toHaveLength(0);
    });

    it("message has correct styling", () => {
      render(<FullPageSpinner message="Please wait..." />);
      const message = screen.getByText("Please wait...");
      expect(message).toHaveClass("text-sm");
      expect(message).toHaveClass("text-zinc-500");
      expect(message).toHaveClass("mt-4");
    });
  });

  describe("Layout", () => {
    it("centers content vertically", () => {
      const { container } = render(<FullPageSpinner />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("justify-center");
    });

    it("has minimum height", () => {
      const { container } = render(<FullPageSpinner />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("min-h-[400px]");
    });
  });
});

describe("Skeleton", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
    });

    it("has pulse animation", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("has rounded corners", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("rounded-md");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<Skeleton className="h-4 w-full" />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-full");
    });

    it("has background color", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass("bg-zinc-200");
    });
  });
});

describe("CardSkeleton", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders correct number of lines by default (3)", () => {
      const { container } = render(<CardSkeleton />);
      // Default is 3 lines, first line is always rendered + (lines - 1) additional lines
      // So for 3 lines: 1 main line + 2 additional = 3 skeleton elements
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(3);
    });

    it("renders correct number of lines when specified", () => {
      const { container } = render(<CardSkeleton lines={5} />);
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(5);
    });

    it("renders 1 line correctly", () => {
      const { container } = render(<CardSkeleton lines={1} />);
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBe(1);
    });
  });

  describe("Avatar", () => {
    it("shows avatar when showAvatar is true", () => {
      const { container } = render(<CardSkeleton showAvatar />);
      const avatar = container.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-10");
      expect(avatar).toHaveClass("w-10");
    });

    it("does not show avatar by default", () => {
      const { container } = render(<CardSkeleton />);
      const avatar = container.querySelector(".rounded-full");
      expect(avatar).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<CardSkeleton className="custom-class" />);
      const card = container.firstChild;
      expect(card).toHaveClass("custom-class");
    });

    it("has card styling", () => {
      const { container } = render(<CardSkeleton />);
      const card = container.firstChild;
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("p-4");
    });
  });
});

describe("ListSkeleton", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<ListSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders correct number of items by default (5)", () => {
      const { container } = render(<ListSkeleton />);
      // Each item has a border class
      const items = container.querySelectorAll(".border-zinc-200");
      expect(items.length).toBe(5);
    });

    it("renders correct number of items when specified", () => {
      const { container } = render(<ListSkeleton items={3} />);
      const listItems = container.querySelectorAll(".border-zinc-200");
      expect(listItems.length).toBe(3);
    });

    it("renders 1 item correctly", () => {
      const { container } = render(<ListSkeleton items={1} />);
      const listItems = container.querySelectorAll(".border-zinc-200");
      expect(listItems.length).toBe(1);
    });

    it("renders 10 items correctly", () => {
      const { container } = render(<ListSkeleton items={10} />);
      const listItems = container.querySelectorAll(".border-zinc-200");
      expect(listItems.length).toBe(10);
    });
  });

  describe("Avatar", () => {
    it("shows avatar by default", () => {
      const { container } = render(<ListSkeleton items={1} />);
      const avatar = container.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
    });

    it("hides avatar when showAvatar is false", () => {
      const { container } = render(<ListSkeleton items={1} showAvatar={false} />);
      const avatar = container.querySelector(".rounded-full");
      expect(avatar).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<ListSkeleton className="custom-class" />);
      const list = container.firstChild;
      expect(list).toHaveClass("custom-class");
    });

    it("has spacing between items", () => {
      const { container } = render(<ListSkeleton />);
      const list = container.firstChild;
      expect(list).toHaveClass("space-y-3");
    });
  });
});

describe("TableSkeleton", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<TableSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders correct number of rows by default (5)", () => {
      const { container } = render(<TableSkeleton />);
      // Rows are the divs with bg-white (not the header which has bg-zinc-50)
      const rows = container.querySelectorAll(".bg-white");
      expect(rows.length).toBe(5);
    });

    it("renders correct number of rows when specified", () => {
      const { container } = render(<TableSkeleton rows={3} />);
      const tableRows = container.querySelectorAll(".bg-white");
      expect(tableRows.length).toBe(3);
    });

    it("renders correct number of columns by default (4)", () => {
      const { container } = render(<TableSkeleton rows={1} />);
      // In header row
      const headerRow = container.querySelector(".bg-zinc-50");
      const headerCells = headerRow?.querySelectorAll(".animate-pulse");
      expect(headerCells?.length).toBe(4);
    });

    it("renders correct number of columns when specified", () => {
      const { container } = render(<TableSkeleton rows={1} columns={6} />);
      const headerRow = container.querySelector(".bg-zinc-50");
      const headerCells = headerRow?.querySelectorAll(".animate-pulse");
      expect(headerCells?.length).toBe(6);
    });

    it("renders 1 row and 1 column correctly", () => {
      const { container } = render(<TableSkeleton rows={1} columns={1} />);
      const tableRows = container.querySelectorAll(".bg-white");
      expect(tableRows.length).toBe(1);
      const headerRow = container.querySelector(".bg-zinc-50");
      const headerCells = headerRow?.querySelectorAll(".animate-pulse");
      expect(headerCells?.length).toBe(1);
    });
  });

  describe("Structure", () => {
    it("has header row", () => {
      const { container } = render(<TableSkeleton />);
      const header = container.querySelector(".bg-zinc-50");
      expect(header).toBeInTheDocument();
    });

    it("header has border bottom", () => {
      const { container } = render(<TableSkeleton />);
      const header = container.querySelector(".bg-zinc-50");
      expect(header).toHaveClass("border-b");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<TableSkeleton className="custom-class" />);
      const table = container.firstChild;
      expect(table).toHaveClass("custom-class");
    });

    it("has rounded container", () => {
      const { container } = render(<TableSkeleton />);
      const table = container.firstChild;
      expect(table).toHaveClass("rounded-lg");
    });

    it("has overflow hidden", () => {
      const { container } = render(<TableSkeleton />);
      const table = container.firstChild;
      expect(table).toHaveClass("overflow-hidden");
    });
  });
});

describe("InlineLoading", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      const { container } = render(<InlineLoading />);
      const spinner = container.querySelector("svg");
      expect(spinner).toBeInTheDocument();
    });

    it("uses small spinner", () => {
      const { container } = render(<InlineLoading />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-4");
      expect(svg).toHaveClass("w-4");
    });
  });

  describe("Message", () => {
    it("shows message when provided", () => {
      render(<InlineLoading message="Saving..." />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("does not show message when not provided", () => {
      const { container } = render(<InlineLoading />);
      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(0);
    });

    it("message has correct styling", () => {
      render(<InlineLoading message="Loading..." />);
      const message = screen.getByText("Loading...");
      expect(message).toHaveClass("text-sm");
      expect(message).toHaveClass("text-zinc-500");
    });
  });

  describe("Layout", () => {
    it("has inline flex layout", () => {
      const { container } = render(<InlineLoading />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("gap-2");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<InlineLoading className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});
