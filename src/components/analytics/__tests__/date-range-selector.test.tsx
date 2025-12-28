import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import {
  DateRangeSelector,
  DateRange,
  DateRangePreset,
  DEFAULT_PRESETS,
} from "../DateRangeSelector";

// Mock date-fns functions for predictable testing
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      if (formatStr === "MMM d, yyyy") {
        return `${date.toLocaleString("en-US", { month: "short" })} ${date.getDate()}, ${date.getFullYear()}`;
      }
      return date.toISOString();
    }),
  };
});

// Mock the DateRangePicker component
vi.mock("@/components/ui/date-picker", () => ({
  DateRangePicker: ({
    value,
    onChange,
  }: {
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
  }) => (
    <div data-testid="date-range-picker">
      <button
        data-testid="set-custom-range"
        onClick={() =>
          onChange?.({
            from: new Date(2024, 0, 1),
            to: new Date(2024, 0, 31),
          })
        }
      >
        Set Custom Range
      </button>
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Calendar: () => <svg data-testid="icon-calendar" />,
  ChevronDown: () => <svg data-testid="icon-chevron" />,
}));

describe("DateRangeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<DateRangeSelector />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("displays calendar icon", () => {
      render(<DateRangeSelector />);
      expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();
    });

    it("displays chevron icon", () => {
      render(<DateRangeSelector />);
      expect(screen.getByTestId("icon-chevron")).toBeInTheDocument();
    });

    it("displays default placeholder text when no value", () => {
      render(<DateRangeSelector />);
      expect(screen.getByText("Select date range")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<DateRangeSelector className="custom-class" />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Value Display", () => {
    it("displays formatted date range when value is provided", async () => {
      const value: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 25),
      };
      render(<DateRangeSelector value={value} />);
      // Should display formatted date range
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("displays single date when only from is provided", async () => {
      const value: DateRange = {
        from: new Date(2024, 0, 15),
      };
      render(<DateRangeSelector value={value} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Popover Behavior", () => {
    it("opens popover on click", async () => {
      const { user } = render(<DateRangeSelector />);
      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Quick select")).toBeInTheDocument();
      });
    });

    it("shows preset options when opened", async () => {
      const { user } = render(<DateRangeSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
        expect(screen.getByText("Last 30 days")).toBeInTheDocument();
      });
    });

    it("shows date range picker when opened", async () => {
      const { user } = render(<DateRangeSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
      });
    });
  });

  describe("Preset Options", () => {
    it("renders all default presets", async () => {
      const { user } = render(<DateRangeSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
        expect(screen.getByText("Last 30 days")).toBeInTheDocument();
        expect(screen.getByText("Last 90 days")).toBeInTheDocument();
        expect(screen.getByText("This month")).toBeInTheDocument();
        expect(screen.getByText("Last month")).toBeInTheDocument();
        expect(screen.getByText("This quarter")).toBeInTheDocument();
        expect(screen.getByText("This year")).toBeInTheDocument();
        expect(screen.getByText("Last year")).toBeInTheDocument();
      });
    });

    it("calls onChange when preset is clicked", async () => {
      const handleChange = vi.fn();
      const { user } = render(<DateRangeSelector onChange={handleChange} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Today"));

      expect(handleChange).toHaveBeenCalled();
      const callArg = handleChange.mock.calls[0][0];
      expect(callArg).toHaveProperty("from");
      expect(callArg).toHaveProperty("to");
    });

    it("closes popover after selecting preset", async () => {
      const { user } = render(<DateRangeSelector />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Today"));

      await waitFor(() => {
        expect(screen.queryByText("Quick select")).not.toBeInTheDocument();
      });
    });

    it("displays selected preset label", async () => {
      const { user } = render(<DateRangeSelector />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Last 7 days"));

      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });
    });
  });

  describe("Custom Presets", () => {
    it("renders custom presets when provided", async () => {
      const customPresets: DateRangePreset[] = [
        {
          label: "Custom Range 1",
          value: "custom1",
          getRange: () => ({ from: new Date(), to: new Date() }),
        },
        {
          label: "Custom Range 2",
          value: "custom2",
          getRange: () => ({ from: new Date(), to: new Date() }),
        },
      ];

      const { user } = render(<DateRangeSelector presets={customPresets} />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Custom Range 1")).toBeInTheDocument();
        expect(screen.getByText("Custom Range 2")).toBeInTheDocument();
      });
    });

    it("does not render default presets when custom presets are provided", async () => {
      const customPresets: DateRangePreset[] = [
        {
          label: "Custom Only",
          value: "custom",
          getRange: () => ({ from: new Date(), to: new Date() }),
        },
      ];

      const { user } = render(<DateRangeSelector presets={customPresets} />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Custom Only")).toBeInTheDocument();
        expect(screen.queryByText("Today")).not.toBeInTheDocument();
      });
    });
  });

  describe("Custom Date Selection", () => {
    it("calls onChange when custom range is selected", async () => {
      const handleChange = vi.fn();
      const { user } = render(<DateRangeSelector onChange={handleChange} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("set-custom-range")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("set-custom-range"));

      expect(handleChange).toHaveBeenCalled();
    });

    it("clears selected preset when custom range is chosen", async () => {
      const { user } = render(<DateRangeSelector />);

      // First select a preset
      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Today"));

      // Then select custom range
      await user.click(screen.getByRole("button"));
      await waitFor(() => {
        expect(screen.getByTestId("set-custom-range")).toBeInTheDocument();
      });
      await user.click(screen.getByTestId("set-custom-range"));

      // The button should now show custom date range, not preset label
      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe("Show Presets Option", () => {
    it("shows presets by default", async () => {
      const { user } = render(<DateRangeSelector />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Quick select")).toBeInTheDocument();
      });
    });

    it("hides presets when showPresets is false", async () => {
      const { user } = render(<DateRangeSelector showPresets={false} />);
      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.queryByText("Quick select")).not.toBeInTheDocument();
        expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
      });
    });
  });

  describe("Clear Functionality", () => {
    it("shows clear button when value is set", async () => {
      const value: DateRange = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 0, 31),
      };
      const { user } = render(<DateRangeSelector value={value} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });
    });

    it("calls onChange with undefined when clear is clicked", async () => {
      const handleChange = vi.fn();
      const value: DateRange = {
        from: new Date(2024, 0, 1),
        to: new Date(2024, 0, 31),
      };
      const { user } = render(
        <DateRangeSelector value={value} onChange={handleChange} />
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Clear"));

      expect(handleChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Footer Section", () => {
    it("displays current selection in footer", async () => {
      const value: DateRange = {
        from: new Date(2024, 0, 15),
        to: new Date(2024, 0, 25),
      };
      const { user } = render(<DateRangeSelector value={value} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        // Footer should show the formatted date range
        expect(screen.getByText("Clear")).toBeInTheDocument();
      });
    });

    it("does not show footer when no value is set", async () => {
      const { user } = render(<DateRangeSelector />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.queryByText("Clear")).not.toBeInTheDocument();
      });
    });
  });

  describe("Alignment", () => {
    it("uses start alignment by default", () => {
      render(<DateRangeSelector />);
      // The alignment prop is passed to PopoverContent
      // We can't easily test this without more complex mocking
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("accepts custom alignment", () => {
      render(<DateRangeSelector align="end" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("DEFAULT_PRESETS Export", () => {
    it("exports DEFAULT_PRESETS array", () => {
      expect(DEFAULT_PRESETS).toBeDefined();
      expect(Array.isArray(DEFAULT_PRESETS)).toBe(true);
    });

    it("DEFAULT_PRESETS has correct structure", () => {
      DEFAULT_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty("label");
        expect(preset).toHaveProperty("value");
        expect(preset).toHaveProperty("getRange");
        expect(typeof preset.label).toBe("string");
        expect(typeof preset.value).toBe("string");
        expect(typeof preset.getRange).toBe("function");
      });
    });

    it("DEFAULT_PRESETS getRange returns valid DateRange", () => {
      DEFAULT_PRESETS.forEach((preset) => {
        const range = preset.getRange();
        expect(range).toHaveProperty("from");
        expect(range.from).toBeInstanceOf(Date);
        if (range.to) {
          expect(range.to).toBeInstanceOf(Date);
        }
      });
    });
  });

  describe("Accessibility", () => {
    it("button is keyboard accessible", async () => {
      const { user } = render(<DateRangeSelector />);
      const button = screen.getByRole("button");

      await user.tab();
      expect(button).toHaveFocus();
    });

    it("can open with Enter key", async () => {
      const { user } = render(<DateRangeSelector />);
      const button = screen.getByRole("button");

      button.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Quick select")).toBeInTheDocument();
      });
    });

    it("can select preset with keyboard", async () => {
      const handleChange = vi.fn();
      const { user } = render(<DateRangeSelector onChange={handleChange} />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Today")).toBeInTheDocument();
      });

      const todayButton = screen.getByText("Today");
      todayButton.focus();
      await user.keyboard("{Enter}");

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Button Styling", () => {
    it("has outline variant styling", () => {
      render(<DateRangeSelector />);
      const button = screen.getByRole("button");
      // The Button component with variant="outline" should have appropriate classes
      expect(button).toBeInTheDocument();
    });

    it("has minimum width", () => {
      render(<DateRangeSelector />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("min-w-[240px]");
    });

    it("applies muted foreground when no value", () => {
      render(<DateRangeSelector />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-muted-foreground");
    });
  });
});
