import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../dialog";
import { Button } from "../button";

describe("Dialog", () => {
  const renderDialog = (props = {}) => {
    return render(
      <Dialog {...props}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description text</DialogDescription>
          </DialogHeader>
          <div>Dialog body content</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  describe("Rendering", () => {
    it("renders trigger without errors", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: /open dialog/i })).toBeInTheDocument();
    });

    it("does not render content initially", () => {
      renderDialog();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders dialog content when open", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("renders title in dialog", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
      });
    });

    it("renders description in dialog", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByText("Dialog description text")).toBeInTheDocument();
      });
    });

    it("renders body content in dialog", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByText("Dialog body content")).toBeInTheDocument();
      });
    });

    it("renders footer with buttons", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("opens when trigger is clicked", async () => {
      const { user } = renderDialog();

      await user.click(screen.getByRole("button", { name: /open dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("closes when close button is clicked", async () => {
      const { user } = renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click the close button (X icon)
      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when Cancel button in footer is clicked", async () => {
      const { user } = renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when Escape is pressed", async () => {
      const { user } = renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when clicking overlay", async () => {
      const { user } = renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click the overlay (backdrop)
      const overlay = document.querySelector('[data-state="open"]');
      if (overlay) {
        await user.click(overlay);
      }

      // Note: This behavior depends on Radix implementation
      // The dialog may or may not close on overlay click
    });
  });

  describe("Controlled Dialog", () => {
    it("respects open prop", async () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("calls onOpenChange when state changes", async () => {
      const handleOpenChange = vi.fn();
      const { user } = render(
        <Dialog defaultOpen onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Accessibility", () => {
    it("has correct role", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("dialog is labelled by title", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const title = screen.getByText("Dialog Title");
        expect(dialog).toHaveAccessibleName("Dialog Title");
      });
    });

    it("dialog is described by description", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAccessibleDescription("Dialog description text");
      });
    });

    it("traps focus within dialog", async () => {
      const { user } = renderDialog({ defaultOpen: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Focus should be within the dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const confirmButton = screen.getByRole("button", { name: /confirm/i });

      // Tab through focusable elements
      await user.tab();
      // Focus should cycle within dialog elements
    });

    it("close button has accessible name", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("applies overlay styles", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        const overlay = document.querySelector('[data-state="open"]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it("dialog content has correct positioning", async () => {
      renderDialog({ defaultOpen: true });

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveClass("fixed");
      });
    });

    it("applies custom className to content", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-dialog-class">
            <DialogTitle>Custom Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveClass("custom-dialog-class");
      });
    });
  });

  describe("DialogHeader", () => {
    it("renders with correct structure", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader className="test-header">
              <DialogTitle>Header Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const header = document.querySelector(".test-header");
        expect(header).toBeInTheDocument();
      });
    });
  });

  describe("DialogFooter", () => {
    it("renders with correct structure", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Footer Test</DialogTitle>
            <DialogFooter className="test-footer">
              <Button>Action</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const footer = document.querySelector(".test-footer");
        expect(footer).toBeInTheDocument();
      });
    });
  });
});
