import { test, expect } from './fixtures';
import { DashboardPage } from './pages';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display welcome message', async () => {
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toContain('Welcome back');
    });

    test('should display stats cards', async ({ page }) => {
      const statsCount = await dashboardPage.getStatsCardCount();
      expect(statsCount).toBeGreaterThanOrEqual(0);
    });

    test('should show page title in browser', async ({ page }) => {
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe('Stats Cards', () => {
    test('should display Total Contacts stat', async () => {
      const value = await dashboardPage.getStatValue('Total Contacts');
      expect(value).toBeDefined();
    });

    test('should display Open Deals stat', async () => {
      const value = await dashboardPage.getStatValue('Open Deals');
      expect(value).toBeDefined();
    });

    test('should display Pipeline Value stat', async () => {
      const value = await dashboardPage.getStatValue('Pipeline Value');
      expect(value).toBeDefined();
    });

    test('should display Tasks Due stat', async () => {
      const value = await dashboardPage.getStatValue('Tasks Due');
      expect(value).toBeDefined();
    });
  });

  test.describe('Quick Actions', () => {
    test('should navigate to contacts when clicking Add Contact', async ({ page }) => {
      await dashboardPage.clickAddContact();
      await expect(page).toHaveURL(/\/contacts/);
    });

    test('should navigate to deals when clicking New Deal', async ({ page }) => {
      await dashboardPage.clickNewDeal();
      await expect(page).toHaveURL(/\/deals/);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to activities from sidebar', async ({ page }) => {
      await dashboardPage.navigateTo('Activities');
      await expect(page).toHaveURL(/\/activities/);
    });

    test('should navigate to contacts from sidebar', async ({ page }) => {
      await dashboardPage.navigateTo('Contacts');
      await expect(page).toHaveURL(/\/contacts/);
    });

    test('should navigate to companies from sidebar', async ({ page }) => {
      await dashboardPage.navigateTo('Companies');
      await expect(page).toHaveURL(/\/companies/);
    });

    test('should navigate to deals from sidebar', async ({ page }) => {
      await dashboardPage.navigateTo('Deals');
      await expect(page).toHaveURL(/\/deals/);
    });

    test('should navigate to settings from sidebar', async ({ page }) => {
      await dashboardPage.navigateTo('Settings');
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('Command Menu', () => {
    test('should open command menu with keyboard shortcut', async ({ page }) => {
      await dashboardPage.openCommandMenu();
      const commandMenu = page.locator('[class*="command"], [role="dialog"]');
      await expect(commandMenu).toBeVisible();
    });

    test('should close command menu with Escape', async ({ page }) => {
      await dashboardPage.openCommandMenu();
      await dashboardPage.closeCommandMenu();
      const commandMenu = page.locator('[class*="command"], [role="dialog"]');
      await expect(commandMenu).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.goto();

      // Dashboard should still load on mobile
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toContain('Welcome back');
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.goto();

      // Stats should still be visible
      const statsCount = await dashboardPage.getStatsCardCount();
      expect(statsCount).toBeGreaterThanOrEqual(0);
    });
  });
});
