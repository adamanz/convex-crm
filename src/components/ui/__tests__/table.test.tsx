import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "../table";

describe("Table", () => {
  const renderTable = () => {
    return render(
      <Table>
        <TableCaption>A list of users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>Inactive</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total: 2 users</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  };

  describe("Rendering", () => {
    it("renders table without errors", () => {
      renderTable();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders table caption", () => {
      renderTable();
      expect(screen.getByText("A list of users")).toBeInTheDocument();
    });

    it("renders table headers", () => {
      renderTable();
      expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
    });

    it("renders table rows", () => {
      renderTable();
      const rows = screen.getAllByRole("row");
      // Header row + 2 body rows + footer row = 4 rows
      expect(rows.length).toBeGreaterThanOrEqual(3);
    });

    it("renders table cells with data", () => {
      renderTable();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("renders table footer", () => {
      renderTable();
      expect(screen.getByText("Total: 2 users")).toBeInTheDocument();
    });
  });

  describe("Table Component", () => {
    it("renders with wrapper div for overflow", () => {
      render(
        <Table data-testid="test-table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByTestId("test-table");
      const wrapper = table.parentElement;
      expect(wrapper).toHaveClass("relative");
      expect(wrapper).toHaveClass("w-full");
      expect(wrapper).toHaveClass("overflow-auto");
    });

    it("applies default styling", () => {
      render(
        <Table data-testid="test-table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByTestId("test-table");
      expect(table).toHaveClass("w-full");
      expect(table).toHaveClass("caption-bottom");
      expect(table).toHaveClass("text-sm");
    });

    it("applies custom className", () => {
      render(
        <Table className="custom-table-class">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole("table")).toHaveClass("custom-table-class");
    });
  });

  describe("TableHeader", () => {
    it("renders thead element", () => {
      render(
        <Table>
          <TableHeader data-testid="header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByTestId("header").tagName).toBe("THEAD");
    });

    it("applies border styling to rows", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const thead = screen.getByRole("rowgroup");
      expect(thead).toHaveClass("[&_tr]:border-b");
    });
  });

  describe("TableBody", () => {
    it("renders tbody element", () => {
      render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("body").tagName).toBe("TBODY");
    });

    it("applies styling for last row", () => {
      render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Cell 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cell 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("body")).toHaveClass("[&_tr:last-child]:border-0");
    });
  });

  describe("TableRow", () => {
    it("renders tr element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("row").tagName).toBe("TR");
    });

    it("applies hover styling", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("row")).toHaveClass("hover:bg-muted/50");
    });

    it("applies selected state styling", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row" data-state="selected">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("row")).toHaveClass("data-[state=selected]:bg-muted");
    });

    it("applies border styling", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("row")).toHaveClass("border-b");
    });
  });

  describe("TableHead", () => {
    it("renders th element", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByTestId("head").tagName).toBe("TH");
    });

    it("applies header styling", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const head = screen.getByTestId("head");
      expect(head).toHaveClass("h-10");
      expect(head).toHaveClass("px-2");
      expect(head).toHaveClass("text-left");
      expect(head).toHaveClass("font-medium");
      expect(head).toHaveClass("text-muted-foreground");
    });

    it("applies custom className", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head-class">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByRole("columnheader")).toHaveClass("custom-head-class");
    });
  });

  describe("TableCell", () => {
    it("renders td element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByTestId("cell").tagName).toBe("TD");
    });

    it("applies cell styling", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = screen.getByTestId("cell");
      expect(cell).toHaveClass("p-2");
      expect(cell).toHaveClass("align-middle");
    });

    it("applies custom className", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell-class">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole("cell")).toHaveClass("custom-cell-class");
    });

    it("supports colSpan attribute", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>Spanning Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole("cell")).toHaveAttribute("colspan", "3");
    });
  });

  describe("TableFooter", () => {
    it("renders tfoot element", () => {
      render(
        <Table>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByTestId("footer").tagName).toBe("TFOOT");
    });

    it("applies footer styling", () => {
      render(
        <Table>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("border-t");
      expect(footer).toHaveClass("bg-muted/50");
      expect(footer).toHaveClass("font-medium");
    });
  });

  describe("TableCaption", () => {
    it("renders caption element", () => {
      render(
        <Table>
          <TableCaption data-testid="caption">Table Caption</TableCaption>
        </Table>
      );

      expect(screen.getByTestId("caption").tagName).toBe("CAPTION");
    });

    it("applies caption styling", () => {
      render(
        <Table>
          <TableCaption data-testid="caption">Table Caption</TableCaption>
        </Table>
      );

      const caption = screen.getByTestId("caption");
      expect(caption).toHaveClass("mt-4");
      expect(caption).toHaveClass("text-sm");
      expect(caption).toHaveClass("text-muted-foreground");
    });
  });

  describe("Accessibility", () => {
    it("table has proper structure", () => {
      renderTable();

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("rowgroup")).toHaveLength(3); // thead, tbody, tfoot
    });

    it("headers are properly associated", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(3);
    });

    it("cells are accessible", () => {
      renderTable();

      const cells = screen.getAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
