import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { TagInput } from "../tag-input";

describe("TagInput", () => {
  const defaultProps = {
    value: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<TagInput {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders with placeholder when empty", () => {
      render(<TagInput {...defaultProps} placeholder="Add a tag..." />);
      expect(screen.getByPlaceholderText("Add a tag...")).toBeInTheDocument();
    });

    it("renders default placeholder", () => {
      render(<TagInput {...defaultProps} />);
      expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument();
    });

    it("renders existing tags", () => {
      render(<TagInput {...defaultProps} value={["tag1", "tag2", "tag3"]} />);
      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.getByText("tag3")).toBeInTheDocument();
    });

    it("does not show placeholder when tags exist", () => {
      render(
        <TagInput
          {...defaultProps}
          value={["existing"]}
          placeholder="Add tag..."
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("placeholder", "Add tag...");
    });
  });

  describe("Adding Tags", () => {
    it("adds tag on Enter key", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "newtag{Enter}");

      expect(onChange).toHaveBeenCalledWith(["newtag"]);
    });

    it("trims whitespace from tag", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "  spacedtag  {Enter}");

      expect(onChange).toHaveBeenCalledWith(["spacedtag"]);
    });

    it("does not add empty tag", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "   {Enter}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add duplicate tag", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput {...defaultProps} value={["existing"]} onChange={onChange} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "existing{Enter}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("clears input after adding tag", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "newtag{Enter}");

      expect(input).toHaveValue("");
    });
  });

  describe("Removing Tags", () => {
    it("removes tag when X button is clicked", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput
          {...defaultProps}
          value={["tag1", "tag2"]}
          onChange={onChange}
        />
      );

      // Find the remove button for tag1
      const removeButton = screen.getByRole("button", { name: /remove tag1/i });
      await user.click(removeButton);

      expect(onChange).toHaveBeenCalledWith(["tag2"]);
    });

    it("removes last tag on Backspace when input is empty", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput
          {...defaultProps}
          value={["tag1", "tag2"]}
          onChange={onChange}
        />
      );

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("{Backspace}");

      expect(onChange).toHaveBeenCalledWith(["tag1"]);
    });

    it("does not remove tag on Backspace when input has text", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput
          {...defaultProps}
          value={["tag1", "tag2"]}
          onChange={onChange}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "text");
      await user.keyboard("{Backspace}");

      // Should not have been called to remove a tag
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Suggestions", () => {
    const suggestions = ["react", "vue", "angular", "svelte"];

    it("shows suggestions when typing", async () => {
      const { user } = render(
        <TagInput {...defaultProps} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "re");

      await waitFor(() => {
        expect(screen.getByText("react")).toBeInTheDocument();
      });
    });

    it("filters suggestions based on input", async () => {
      const { user } = render(
        <TagInput {...defaultProps} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "ang");

      await waitFor(() => {
        expect(screen.getByText("angular")).toBeInTheDocument();
        expect(screen.queryByText("react")).not.toBeInTheDocument();
        expect(screen.queryByText("vue")).not.toBeInTheDocument();
      });
    });

    it("excludes already selected tags from suggestions", async () => {
      const { user } = render(
        <TagInput
          {...defaultProps}
          value={["react"]}
          suggestions={suggestions}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "r");

      await waitFor(() => {
        // react should not appear in the suggestions dropdown (it's already a tag)
        // The suggestions dropdown should only show angular
        const suggestionsDropdown = document.querySelector(".absolute");
        expect(suggestionsDropdown).toBeInTheDocument();
        // Check that "react" is not in the suggestions list (only in the tags)
        const suggestionButtons = suggestionsDropdown?.querySelectorAll("button");
        const suggestionTexts = Array.from(suggestionButtons || []).map(
          (btn) => btn.textContent
        );
        expect(suggestionTexts).not.toContain("react");
      });
    });

    it("adds tag when suggestion is clicked", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput {...defaultProps} onChange={onChange} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "vue");

      const suggestion = await screen.findByRole("button", { name: "vue" });
      await user.click(suggestion);

      expect(onChange).toHaveBeenCalledWith(["vue"]);
    });

    it("navigates suggestions with arrow keys", async () => {
      const { user } = render(
        <TagInput {...defaultProps} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "r");

      await user.keyboard("{ArrowDown}");

      // The first suggestion should be highlighted
      const reactButton = await screen.findByRole("button", { name: "react" });
      expect(reactButton).toHaveClass("bg-zinc-100");
    });

    it("selects highlighted suggestion on Enter", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput {...defaultProps} onChange={onChange} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "ang");

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(onChange).toHaveBeenCalledWith(["angular"]);
    });

    it("closes suggestions on Escape", async () => {
      const { user } = render(
        <TagInput {...defaultProps} suggestions={suggestions} />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "r");

      await waitFor(() => {
        expect(screen.getByText("react")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByText("react")).not.toBeInTheDocument();
      });
    });

    it("does not show suggestions when input is empty", async () => {
      render(<TagInput {...defaultProps} suggestions={suggestions} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");

      // Suggestions should not be visible
      expect(screen.queryByText("react")).not.toBeInTheDocument();
    });
  });

  describe("Max Tags Limit", () => {
    it("respects max tags limit", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput
          {...defaultProps}
          value={["tag1", "tag2"]}
          onChange={onChange}
          maxTags={2}
        />
      );

      const input = screen.queryByRole("textbox");
      // Input should not be present when max is reached
      expect(input).not.toBeInTheDocument();
    });

    it("shows tags count when maxTags is set", () => {
      render(
        <TagInput {...defaultProps} value={["tag1"]} maxTags={5} />
      );

      expect(screen.getByText("1/5 tags")).toBeInTheDocument();
    });

    it("shows correct count as tags are added", async () => {
      const { rerender } = render(
        <TagInput {...defaultProps} value={["tag1", "tag2"]} maxTags={5} />
      );

      expect(screen.getByText("2/5 tags")).toBeInTheDocument();

      rerender(
        <TagInput {...defaultProps} value={["tag1", "tag2", "tag3"]} maxTags={5} />
      );

      expect(screen.getByText("3/5 tags")).toBeInTheDocument();
    });

    it("hides input when max tags reached", () => {
      render(
        <TagInput
          {...defaultProps}
          value={["tag1", "tag2", "tag3"]}
          maxTags={3}
        />
      );

      const input = screen.queryByRole("textbox");
      expect(input).not.toBeInTheDocument();
    });

    it("shows input when under max tags", () => {
      render(
        <TagInput {...defaultProps} value={["tag1", "tag2"]} maxTags={3} />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled", () => {
      render(<TagInput {...defaultProps} disabled />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("hides remove buttons when disabled", () => {
      render(
        <TagInput {...defaultProps} value={["tag1"]} disabled />
      );

      // The remove button should not be present
      const removeButton = screen.queryByRole("button", { name: /remove/i });
      expect(removeButton).not.toBeInTheDocument();
    });

    it("applies disabled styling", () => {
      const { container } = render(<TagInput {...defaultProps} disabled />);

      const wrapper = container.querySelector(".opacity-50");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <TagInput {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("has focus ring on focus", () => {
      const { container } = render(<TagInput {...defaultProps} />);

      const inputWrapper = container.querySelector(".focus-within\\:ring-1");
      expect(inputWrapper).toBeInTheDocument();
    });

    it("tags are rendered as badges", () => {
      render(<TagInput {...defaultProps} value={["tag1"]} />);

      // Tags should be rendered inside Badge components with specific styling
      const tag = screen.getByText("tag1");
      // The Badge component uses inline-flex styling
      expect(tag.closest(".inline-flex")).toBeInTheDocument();
      expect(tag.closest(".rounded-md")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("input is focusable", async () => {
      const { user } = render(<TagInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.tab();

      expect(input).toHaveFocus();
    });

    it("focuses input when clicking container", async () => {
      const { user, container } = render(<TagInput {...defaultProps} />);

      const inputWrapper = container.querySelector(".flex.min-h-9");
      await user.click(inputWrapper!);

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });

    it("remove buttons have accessible names", () => {
      render(<TagInput {...defaultProps} value={["important"]} />);

      const removeButton = screen.getByRole("button", {
        name: /remove important/i,
      });
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid tag additions", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a{Enter}b{Enter}c{Enter}");

      // Should have been called 3 times
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("handles special characters in tags", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "tag-with-dashes{Enter}");

      expect(onChange).toHaveBeenCalledWith(["tag-with-dashes"]);
    });

    it("handles very long tag names", async () => {
      const onChange = vi.fn();
      const { user } = render(<TagInput {...defaultProps} onChange={onChange} />);

      const longTag = "this-is-a-very-long-tag-name-that-might-cause-issues";
      const input = screen.getByRole("textbox");
      await user.type(input, `${longTag}{Enter}`);

      expect(onChange).toHaveBeenCalledWith([longTag]);
    });

    it("handles case sensitivity correctly", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TagInput {...defaultProps} value={["Tag"]} onChange={onChange} />
      );

      const input = screen.getByRole("textbox");
      // "tag" (lowercase) should be allowed since it's different from "Tag"
      await user.type(input, "tag{Enter}");

      expect(onChange).toHaveBeenCalledWith(["Tag", "tag"]);
    });
  });
});
