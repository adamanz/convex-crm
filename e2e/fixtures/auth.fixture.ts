import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user credentials and data for E2E tests
 */
export interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
}

export const testUser: TestUser = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

/**
 * Extended test fixture with authentication helpers
 */
export interface AuthFixture {
  authenticatedPage: Page;
  testUser: TestUser;
}

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Wait for the app to be fully loaded
   * Since this is a Convex app without traditional auth, we wait for the dashboard
   */
  async waitForAppLoad(): Promise<void> {
    // Wait for the sidebar or main content to be visible
    await this.page.waitForSelector('[data-testid="app-sidebar"], [class*="sidebar"], nav', {
      timeout: 30000,
    }).catch(() => {
      // If no sidebar, wait for any main content
      return this.page.waitForSelector('main, [role="main"]', { timeout: 30000 });
    });
  }

  /**
   * Navigate to the app and ensure it's loaded
   */
  async navigateToApp(): Promise<void> {
    await this.page.goto('/');
    await this.waitForAppLoad();
  }

  /**
   * Check if the user is on the dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/') && !url.includes('/login');
  }

  /**
   * Wait for Convex data to load
   */
  async waitForDataLoad(selector: string, timeout = 10000): Promise<void> {
    // First wait for loading states to disappear
    await this.page.waitForFunction(
      () => {
        const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]');
        return skeletons.length === 0;
      },
      { timeout }
    ).catch(() => {
      // Ignore if no skeletons found
    });

    // Then wait for the actual selector
    await this.page.waitForSelector(selector, { timeout });
  }
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await authHelper.navigateToApp();
    await use(page);
  },
  testUser: async ({}, use) => {
    await use(testUser);
  },
});

export { expect };
