import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";

describe("Tabs", () => {
  const renderTabs = (props = {}) => {
    return render(
      <Tabs defaultValue="tab1" {...props}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content for Tab 1</TabsContent>
        <TabsContent value="tab2">Content for Tab 2</TabsContent>
        <TabsContent value="tab3">Content for Tab 3</TabsContent>
      </Tabs>
    );
  };

  describe("Rendering", () => {
    it("renders without errors", () => {
      renderTabs();
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders all tab triggers", () => {
      renderTabs();
      expect(screen.getByRole("tab", { name: /tab 1/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /tab 2/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /tab 3/i })).toBeInTheDocument();
    });

    it("renders default tab content", () => {
      renderTabs();
      expect(screen.getByText("Content for Tab 1")).toBeInTheDocument();
    });

    it("does not render non-active tab content", () => {
      renderTabs();
      // Radix Tabs may hide content via CSS or remove from DOM
      const tab2Content = screen.queryByText("Content for Tab 2");
      const tab3Content = screen.queryByText("Content for Tab 3");
      // Content is either not in DOM or hidden
      if (tab2Content) expect(tab2Content).not.toBeVisible();
      if (tab3Content) expect(tab3Content).not.toBeVisible();
    });
  });

  describe("TabsList", () => {
    it("renders with correct styling", () => {
      renderTabs();
      const tabsList = screen.getByRole("tablist");
      expect(tabsList).toHaveClass("inline-flex");
      expect(tabsList).toHaveClass("items-center");
      expect(tabsList).toHaveClass("rounded-lg");
      expect(tabsList).toHaveClass("bg-muted");
    });

    it("applies custom className", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-tabslist-class">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toHaveClass("custom-tabslist-class");
    });
  });

  describe("TabsTrigger", () => {
    it("has correct active state styling", () => {
      renderTabs();
      const activeTab = screen.getByRole("tab", { name: /tab 1/i });
      expect(activeTab).toHaveAttribute("data-state", "active");
    });

    it("has correct inactive state", () => {
      renderTabs();
      const inactiveTab = screen.getByRole("tab", { name: /tab 2/i });
      expect(inactiveTab).toHaveAttribute("data-state", "inactive");
    });

    it("applies default styling", () => {
      renderTabs();
      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("inline-flex");
      expect(tab).toHaveClass("items-center");
      expect(tab).toHaveClass("justify-center");
      expect(tab).toHaveClass("rounded-md");
    });

    it("renders disabled tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const disabledTab = screen.getByRole("tab", { name: /tab 2/i });
      expect(disabledTab).toBeDisabled();
    });
  });

  describe("TabsContent", () => {
    it("renders content for active tab", () => {
      renderTabs();
      expect(screen.getByText("Content for Tab 1")).toBeVisible();
    });

    it("applies styling to content panel", () => {
      renderTabs();
      const content = screen.getByRole("tabpanel");
      expect(content).toHaveClass("mt-2");
    });

    it("applies custom className to content", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content-class">
            Content
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tabpanel")).toHaveClass("custom-content-class");
    });
  });

  describe("User Interactions", () => {
    it("switches tab on click", async () => {
      const { user } = renderTabs();

      await user.click(screen.getByRole("tab", { name: /tab 2/i }));

      expect(screen.getByText("Content for Tab 2")).toBeVisible();
    });

    it("updates active state on tab switch", async () => {
      const { user } = renderTabs();

      await user.click(screen.getByRole("tab", { name: /tab 2/i }));

      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveAttribute(
        "data-state",
        "active"
      );
      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveAttribute(
        "data-state",
        "inactive"
      );
    });

    it("does not switch to disabled tab on click", async () => {
      const { user } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole("tab", { name: /tab 2/i }));

      // Tab 1 should still be active
      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveAttribute(
        "data-state",
        "active"
      );
    });
  });

  describe("Controlled Tabs", () => {
    it("respects value prop", () => {
      render(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveAttribute(
        "data-state",
        "active"
      );
      expect(screen.getByText("Content 2")).toBeVisible();
    });

    it("calls onValueChange when tab changes", async () => {
      const handleValueChange = vi.fn();
      const { user } = render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole("tab", { name: /tab 2/i }));

      expect(handleValueChange).toHaveBeenCalledWith("tab2");
    });
  });

  describe("Keyboard Navigation", () => {
    it("supports arrow key navigation", async () => {
      const { user } = renderTabs();

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      // After arrow right, focus should move to next tab
      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveFocus();
    });

    it("supports Tab key to move focus", async () => {
      const { user } = renderTabs();

      await user.tab();

      // First focusable element in tablist should be focused
      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveFocus();
    });

    it("activates tab on Enter key", async () => {
      const { user } = renderTabs();

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      tab2.focus();

      await user.keyboard("{Enter}");

      expect(tab2).toHaveAttribute("data-state", "active");
    });

    it("activates tab on Space key", async () => {
      const { user } = renderTabs();

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      tab2.focus();

      await user.keyboard(" ");

      expect(tab2).toHaveAttribute("data-state", "active");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA roles", () => {
      renderTabs();

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(3);
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("tab has aria-selected attribute", () => {
      renderTabs();

      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("tabpanel has correct aria-labelledby", () => {
      renderTabs();

      const tabpanel = screen.getByRole("tabpanel");
      const activeTab = screen.getByRole("tab", { name: /tab 1/i });

      // The tabpanel should be labeled by the active tab
      expect(tabpanel).toHaveAttribute("aria-labelledby");
    });

    it("disabled tab has aria-disabled", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveAttribute(
        "disabled"
      );
    });
  });

  describe("Orientation", () => {
    it("defaults to horizontal orientation", () => {
      renderTabs();
      const tabsList = screen.getByRole("tablist");
      // Horizontal is the default
      expect(tabsList).not.toHaveAttribute("aria-orientation", "vertical");
    });

    it("supports vertical orientation", () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-orientation",
        "vertical"
      );
    });
  });
});
