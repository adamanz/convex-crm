import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Input } from "../input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter text..." />);
      expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
    });

    it("renders with default styles", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
      expect(input).toHaveClass("border-input");
    });
  });

  describe("Types", () => {
    it("renders text input by default", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      // Default input type is text (either explicit or implicit)
      expect(input.getAttribute("type") ?? "text").toBe("text");
    });

    it("renders email input", () => {
      render(<Input type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders password input", () => {
      render(<Input type="password" />);
      // Password inputs don't have textbox role
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("renders number input", () => {
      render(<Input type="number" />);
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("type", "number");
    });

    it("renders tel input", () => {
      render(<Input type="tel" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "tel");
    });
  });

  describe("User Interactions", () => {
    it("accepts user input", async () => {
      const { user } = render(<Input />);
      const input = screen.getByRole("textbox");

      await user.type(input, "Hello World");
      expect(input).toHaveValue("Hello World");
    });

    it("calls onChange when typing", async () => {
      const handleChange = vi.fn();
      const { user } = render(<Input onChange={handleChange} />);
      const input = screen.getByRole("textbox");

      await user.type(input, "a");
      expect(handleChange).toHaveBeenCalled();
    });

    it("calls onBlur when focus leaves", async () => {
      const handleBlur = vi.fn();
      const { user } = render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it("calls onFocus when focused", async () => {
      const handleFocus = vi.fn();
      const { user } = render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole("textbox");

      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it("clears input correctly", async () => {
      const { user } = render(<Input defaultValue="Initial" />);
      const input = screen.getByRole("textbox");

      await user.clear(input);
      expect(input).toHaveValue("");
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("works as controlled input", async () => {
      // For controlled input, verify it accepts value prop
      render(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("controlled");
    });

    it("works as uncontrolled input with defaultValue", async () => {
      const { user } = render(<Input defaultValue="default" />);
      const input = screen.getByRole("textbox");

      expect(input).toHaveValue("default");
      await user.clear(input);
      await user.type(input, "new value");
      expect(input).toHaveValue("new value");
    });
  });

  describe("States", () => {
    it("renders disabled state correctly", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("disabled:cursor-not-allowed");
      expect(input).toHaveClass("disabled:opacity-50");
    });

    it("renders readonly state correctly", () => {
      render(<Input readOnly value="Read only" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");
    });

    it("renders required state correctly", () => {
      render(<Input required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });
  });

  describe("Accessibility", () => {
    it("is focusable via keyboard", async () => {
      const { user } = render(<Input />);
      const input = screen.getByRole("textbox");

      await user.tab();
      expect(input).toHaveFocus();
    });

    it("supports aria-label", () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText("Search")).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <span id="helper-text">Enter your email address</span>
        </>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "helper-text");
    });

    it("supports aria-invalid for error states", () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("Ref forwarding", () => {
    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
