import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../select";

describe("Select", () => {
  const renderSelect = (props = {}) => {
    return render(
      <Select {...props}>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  describe("Rendering", () => {
    it("renders without errors", () => {
      renderSelect();
      expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      renderSelect();
      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("renders trigger with correct default styles", () => {
      renderSelect();
      const trigger = screen.getByTestId("select-trigger");
      expect(trigger).toHaveClass("rounded-md");
      expect(trigger).toHaveClass("border");
    });

    it("renders with custom className", () => {
      render(
        <Select>
          <SelectTrigger className="custom-class">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveClass("custom-class");
    });
  });

  describe("User Interactions", () => {
    it("opens dropdown when trigger is clicked", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByTestId("select-trigger");

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });
    });

    it("displays all options when opened", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByTestId("select-trigger");

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
        expect(screen.getByText("Option 3")).toBeInTheDocument();
      });
    });

    it("selects an option when clicked", async () => {
      const handleValueChange = vi.fn();
      const { user } = render(
        <Select onValueChange={handleValueChange}>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId("select-trigger");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Option 1"));
      expect(handleValueChange).toHaveBeenCalledWith("option1");
    });

    it("closes dropdown after selection", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByTestId("select-trigger");

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Option 1"));

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Controlled Select", () => {
    it("displays selected value when controlled", () => {
      render(
        <Select value="option2">
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("calls onValueChange with new value", async () => {
      const handleChange = vi.fn();
      const { user } = render(
        <Select value="option1" onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole("combobox"));
      await waitFor(() => {
        expect(screen.getByText("Option 2")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Option 2"));
      expect(handleChange).toHaveBeenCalledWith("option2");
    });
  });

  describe("States", () => {
    it("renders disabled state correctly", () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDisabled();
    });

    it("renders disabled item correctly", async () => {
      const { user } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled" disabled>
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const disabledItem = screen.getByText("Disabled");
        expect(disabledItem.closest("[data-disabled]")).toBeInTheDocument();
      });
    });
  });

  describe("SelectGroup and SelectLabel", () => {
    it("renders groups with labels", async () => {
      const { user } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("Fruits")).toBeInTheDocument();
        expect(screen.getByText("Vegetables")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes on trigger", () => {
      renderSelect();
      const trigger = screen.getByRole("combobox");

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("updates aria-expanded when opened", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByRole("combobox");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("is keyboard navigable", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByRole("combobox");

      // Focus and open with keyboard
      trigger.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });
    });

    it("closes on Escape key", async () => {
      const { user } = renderSelect();
      const trigger = screen.getByRole("combobox");

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    });
  });
});
