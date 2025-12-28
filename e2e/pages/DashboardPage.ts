import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Dashboard page
 */
export class DashboardPage extends BasePage {
  // Page elements
  readonly welcomeHeader: Locator;
  readonly statsCards: Locator;
  readonly activityFeed: Locator;
  readonly upcomingTasks: Locator;
  readonly pipelineChart: Locator;
  readonly quickActions: Locator;
  readonly addContactButton: Locator;
  readonly newDealButton: Locator;

  constructor(page: Page) {
    super(page);

    // Welcome section
    this.welcomeHeader = page.locator('h1:has-text("Welcome back")');

    // Stats cards
    this.statsCards = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="text-2xl"], [class*="text-3xl"]'),
    });

    // Activity feed
    this.activityFeed = page.locator('[class*="activity"], [data-testid="activity-feed"]').or(
      page.locator('text=Recent Activity').locator('..').locator('..')
    );

    // Upcoming tasks
    this.upcomingTasks = page.locator('[class*="task"], [data-testid="upcoming-tasks"]').or(
      page.locator('text=Upcoming Tasks').locator('..').locator('..')
    );

    // Pipeline chart
    this.pipelineChart = page.locator('[class*="chart"], [data-testid="pipeline-chart"]').or(
      page.locator('canvas').first()
    );

    // Quick actions
    this.quickActions = page.locator('text=Quick Actions').locator('..').locator('..');

    // Quick action buttons
    this.addContactButton = page.getByRole('link', { name: /add contact/i });
    this.newDealButton = page.getByRole('link', { name: /new deal/i });
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForReady();
  }

  /**
   * Wait for dashboard to be ready
   */
  async waitForReady(): Promise<void> {
    // Wait for welcome header or any stat card
    await Promise.race([
      this.welcomeHeader.waitFor({ state: 'visible', timeout: 30000 }),
      this.statsCards.first().waitFor({ state: 'visible', timeout: 30000 }),
    ]).catch(() => {
      // Dashboard might be in loading state, wait for it
    });
    await super.waitForReady();
  }

  /**
   * Get the welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    const text = await this.welcomeHeader.textContent();
    return text || '';
  }

  /**
   * Get the count of stat cards
   */
  async getStatsCardCount(): Promise<number> {
    return this.statsCards.count();
  }

  /**
   * Get stat value by label
   */
  async getStatValue(label: string): Promise<string> {
    const card = this.page.locator(`text=${label}`).locator('..').locator('..');
    const value = card.locator('[class*="text-2xl"], [class*="text-3xl"], [class*="font-bold"]').first();
    return (await value.textContent()) || '';
  }

  /**
   * Click Add Contact quick action
   */
  async clickAddContact(): Promise<void> {
    await this.addContactButton.click();
    await this.page.waitForURL(/\/contacts/);
  }

  /**
   * Click New Deal quick action
   */
  async clickNewDeal(): Promise<void> {
    await this.newDealButton.click();
    await this.page.waitForURL(/\/deals/);
  }

  /**
   * Check if activity feed has items
   */
  async hasActivityItems(): Promise<boolean> {
    const items = this.page.locator('[class*="activity"] a, [data-testid="activity-item"]');
    const count = await items.count();
    return count > 0;
  }

  /**
   * Check if upcoming tasks section has items
   */
  async hasUpcomingTasks(): Promise<boolean> {
    const items = this.page.locator('[class*="task"], [data-testid="task-item"]');
    const count = await items.count();
    return count > 0;
  }

  /**
   * Navigate to activities page from View All link
   */
  async viewAllActivities(): Promise<void> {
    const viewAllLink = this.activityFeed.getByRole('button', { name: /view all/i });
    await viewAllLink.click();
    await this.page.waitForURL(/\/activities/);
  }

  /**
   * Navigate to tasks from View All link
   */
  async viewAllTasks(): Promise<void> {
    const viewAllLink = this.upcomingTasks.getByRole('button', { name: /view all/i });
    await viewAllLink.click();
    await this.page.waitForURL(/\/activities/);
  }

  /**
   * Check if pipeline chart is visible
   */
  async isPipelineChartVisible(): Promise<boolean> {
    try {
      await this.pipelineChart.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
