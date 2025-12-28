import { Page, Locator, expect } from '@playwright/test';
import { waitForLoadingComplete, waitForToast } from '../helpers/test-utils';

/**
 * Base Page Object that other pages extend from
 * Contains common elements and actions
 */
export abstract class BasePage {
  readonly page: Page;

  // Common elements
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly mainContent: Locator;
  readonly loadingSpinner: Locator;
  readonly commandMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav, [class*="sidebar"], [data-testid="sidebar"]');
    this.header = page.locator('header, [class*="header"], [data-testid="header"]');
    this.mainContent = page.locator('main, [role="main"]');
    this.loadingSpinner = page.locator('[class*="spinner"], [class*="Loader"], .animate-spin');
    this.commandMenu = page.locator('[class*="command"], [role="dialog"][class*="Command"]');
  }

  /**
   * Navigate to this page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for the page to be ready
   */
  async waitForReady(): Promise<void> {
    await waitForLoadingComplete(this.page);
  }

  /**
   * Navigate using sidebar
   */
  async navigateTo(linkName: string): Promise<void> {
    const link = this.sidebar.getByRole('link', { name: linkName, exact: false });
    await link.click();
    await this.waitForReady();
  }

  /**
   * Open the command menu (Cmd+K)
   */
  async openCommandMenu(): Promise<void> {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await this.page.keyboard.press(`${modifier}+k`);
    await expect(this.commandMenu).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close the command menu
   */
  async closeCommandMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.commandMenu).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Search using the command menu
   */
  async searchViaCommandMenu(query: string): Promise<void> {
    await this.openCommandMenu();
    await this.commandMenu.locator('input').fill(query);
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Wait for a success toast notification
   */
  async waitForSuccessToast(message?: string): Promise<Locator> {
    return waitForToast(this.page, message);
  }

  /**
   * Wait for an error toast notification
   */
  async waitForErrorToast(message?: string): Promise<Locator> {
    return waitForToast(this.page, message);
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    const title = this.mainContent.locator('h1').first();
    await expect(title).toBeVisible();
    return (await title.textContent()) || '';
  }

  /**
   * Check if page is loading
   */
  async isLoading(): Promise<boolean> {
    const spinners = await this.loadingSpinner.count();
    const skeletons = await this.page.locator('[class*="skeleton"], .animate-pulse').count();
    return spinners > 0 || skeletons > 0;
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Get viewport size
   */
  async getViewportSize(): Promise<{ width: number; height: number } | null> {
    return this.page.viewportSize();
  }

  /**
   * Check if on mobile viewport
   */
  async isMobileViewport(): Promise<boolean> {
    const size = await this.getViewportSize();
    return size ? size.width < 768 : false;
  }
}
