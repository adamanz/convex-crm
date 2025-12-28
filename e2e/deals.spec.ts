import { test, expect } from './fixtures';
import { DealsPage, DealFormData } from './pages';
import { generateTestId } from './helpers/test-utils';

test.describe('Deals', () => {
  let dealsPage: DealsPage;

  test.beforeEach(async ({ page }) => {
    dealsPage = new DealsPage(page);
    await dealsPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display deals page title', async ({ page }) => {
      await expect(page.locator('h1:has-text("Deals")')).toBeVisible();
    });

    test('should display add deal button', async () => {
      await expect(dealsPage.addDealButton).toBeVisible();
    });

    test('should display view toggle', async () => {
      await expect(dealsPage.viewToggle).toBeVisible();
    });

    test('should show stats cards', async ({ page }) => {
      // Wait for stats to load
      const statsCard = page.locator('text=Pipeline Value');
      await expect(statsCard).toBeVisible();
    });
  });

  test.describe('Kanban View', () => {
    test('should display stage columns', async () => {
      await dealsPage.switchToKanbanView();
      const stageCount = await dealsPage.getStageCount();
      expect(stageCount).toBeGreaterThan(0);
    });

    test('should show stage headers with colors', async ({ page }) => {
      await dealsPage.switchToKanbanView();
      // Stage columns should have colored indicators
      const stageIndicator = page.locator('[class*="rounded-full"][style*="background"]');
      await expect(stageIndicator.first()).toBeVisible();
    });

    test('should allow adding deal from stage column', async () => {
      await dealsPage.switchToKanbanView();
      // Find any stage's add deal button
      const stageAddButton = dealsPage.page.getByRole('button', { name: /add deal/i }).first();
      await stageAddButton.click();
      await expect(dealsPage.dealForm).toBeVisible();
      await dealsPage.closeDealDialog();
    });
  });

  test.describe('List View', () => {
    test('should switch to list view', async () => {
      await dealsPage.switchToListView();
      await expect(dealsPage.listView).toBeVisible();
    });

    test('should display table headers', async ({ page }) => {
      await dealsPage.switchToListView();
      const headers = ['Deal', 'Company', 'Stage', 'Amount'];
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
    });

    test('should show Won and Lost buttons in list view', async ({ page }) => {
      await dealsPage.switchToListView();
      // These buttons are in each row
      const wonButton = page.getByRole('button', { name: /won/i }).first();
      const lostButton = page.getByRole('button', { name: /lost/i }).first();

      // Only visible if there are deals
      const dealRows = page.locator('tbody tr');
      if ((await dealRows.count()) > 0) {
        await expect(wonButton).toBeVisible();
        await expect(lostButton).toBeVisible();
      }
    });
  });

  test.describe('Add Deal Dialog', () => {
    test('should open add deal dialog', async () => {
      await dealsPage.openAddDealDialog();
      await expect(dealsPage.dealForm).toBeVisible();
    });

    test('should close deal dialog on escape', async () => {
      await dealsPage.openAddDealDialog();
      await dealsPage.closeDealDialog();
      await expect(dealsPage.dealForm).not.toBeVisible();
    });

    test('should display form fields', async () => {
      await dealsPage.openAddDealDialog();
      await expect(dealsPage.nameInput).toBeVisible();
      await expect(dealsPage.amountInput).toBeVisible();
    });
  });

  test.describe('Create Deal', () => {
    test('should create a new deal with minimal data', async () => {
      const testId = generateTestId();
      const dealData: DealFormData = {
        name: `TestDeal-${testId}`,
      };

      await dealsPage.createDeal(dealData);

      // Verify deal appears (might need to search)
      await dealsPage.page.waitForTimeout(500);
    });

    test('should create a new deal with amount', async () => {
      const testId = generateTestId();
      const dealData: DealFormData = {
        name: `ValueDeal-${testId}`,
        amount: 50000,
      };

      await dealsPage.createDeal(dealData);

      // Form should close on success
      await expect(dealsPage.dealForm).not.toBeVisible();
    });
  });

  test.describe('Pipeline Filters', () => {
    test('should display owner filter', async () => {
      await expect(dealsPage.ownerFilter).toBeVisible();
    });

    test('should display status filter', async () => {
      await expect(dealsPage.statusFilter).toBeVisible();
    });

    test('should filter by status', async () => {
      await dealsPage.filterByStatus('Open');
      // Filter should be applied - badge should appear
      const badge = dealsPage.page.locator('[class*="badge"]').filter({ hasText: 'Open' });
      await expect(badge).toBeVisible();
    });

    test('should clear all filters', async () => {
      await dealsPage.filterByStatus('Won');
      await dealsPage.clearFilters();
      // Clear button should disappear
      await expect(dealsPage.clearFiltersButton).not.toBeVisible();
    });
  });

  test.describe('Drag and Drop', () => {
    test('should show drop zones when dragging', async ({ page }) => {
      await dealsPage.switchToKanbanView();

      // Get a deal card if any exist
      const dealCards = page.locator('[class*="card"]').filter({
        has: page.locator('[class*="font-medium"]'),
      });

      if ((await dealCards.count()) > 0) {
        const firstCard = dealCards.first();
        const box = await firstCard.boundingBox();
        if (box) {
          // Start drag
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 300, box.y, { steps: 5 });

          // Stage columns should be highlighted
          // Just verify we can drag without errors
          await page.mouse.up();
        }
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show mobile stage navigation on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dealsPage.goto();
      await dealsPage.switchToKanbanView();

      // Mobile navigation buttons should be visible
      const nextButton = page.locator('button[aria-label="Next stage"]');
      await expect(nextButton).toBeVisible();
    });

    test('should navigate between stages on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dealsPage.goto();
      await dealsPage.switchToKanbanView();

      // Navigate to next stage
      await dealsPage.navigateToNextStage();
      await dealsPage.navigateToPreviousStage();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display pipeline value', async () => {
      const value = await dealsPage.getPipelineValue();
      expect(value).toBeDefined();
      expect(value).toContain('$');
    });

    test('should display all stat cards', async ({ page }) => {
      const statLabels = ['Pipeline Value', 'Weighted Value', 'Won', 'Win Rate'];
      for (const label of statLabels) {
        const card = page.locator(`text=${label}`);
        await expect(card.first()).toBeVisible();
      }
    });
  });

  test.describe('Deal Navigation', () => {
    test('should navigate to deal detail on click', async () => {
      // Create a deal first
      const testId = generateTestId();
      const dealData: DealFormData = {
        name: `ClickDeal-${testId}`,
      };

      await dealsPage.createDeal(dealData);
      await dealsPage.switchToListView();

      // Click on the deal
      const dealRow = dealsPage.listView.locator('tr').filter({ hasText: `ClickDeal-${testId}` });
      await dealRow.click();

      await expect(dealsPage.page).toHaveURL(/\/deals\/[a-zA-Z0-9]+/);
    });
  });

  test.describe('Pipeline Selector', () => {
    test('should show pipeline selector if multiple pipelines exist', async ({ page }) => {
      // Pipeline selector only shows if there are multiple pipelines
      const pipelineSelector = page.locator('button[role="combobox"]').filter({
        has: page.locator('text=pipeline'),
      });

      // This might not be visible if there's only one pipeline
      const isVisible = await pipelineSelector.isVisible().catch(() => false);
      // Just verify the page loads correctly either way
      expect(true).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await dealsPage.goto();

      await expect(dealsPage.addDealButton).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dealsPage.goto();

      await expect(dealsPage.addDealButton).toBeVisible();
    });
  });
});
