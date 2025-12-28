import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Deal data interface
 */
export interface DealFormData {
  name: string;
  amount?: number;
  currency?: string;
  companyId?: string;
  contactIds?: string[];
  stageId?: string;
  expectedCloseDate?: string;
}

/**
 * Page Object for the Deals page
 */
export class DealsPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly addDealButton: Locator;
  readonly kanbanView: Locator;
  readonly listView: Locator;
  readonly viewToggle: Locator;
  readonly pipelineSelector: Locator;
  readonly ownerFilter: Locator;
  readonly statusFilter: Locator;
  readonly clearFiltersButton: Locator;
  readonly stageColumns: Locator;
  readonly dealCards: Locator;
  readonly statsCards: Locator;

  // Deal Form elements
  readonly dealForm: Locator;
  readonly nameInput: Locator;
  readonly amountInput: Locator;
  readonly currencySelect: Locator;
  readonly companySelect: Locator;
  readonly stageSelect: Locator;
  readonly closeDateInput: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Deals")');
    this.addDealButton = page.getByRole('button', { name: /add deal/i });
    this.kanbanView = page.locator('[class*="flex"][class*="gap"]').filter({
      has: page.locator('[class*="min-w-"]'),
    });
    this.listView = page.locator('table');
    this.viewToggle = page.locator('[class*="rounded-lg"][class*="border"]').filter({
      has: page.locator('button:has(svg)'),
    }).first();
    this.pipelineSelector = page.locator('[role="combobox"]').filter({
      has: page.locator('text=pipeline'),
    });
    this.ownerFilter = page.locator('[role="combobox"]').filter({
      has: page.locator('text=Owner'),
    });
    this.statusFilter = page.locator('[role="combobox"]').filter({
      has: page.locator('text=Status'),
    });
    this.clearFiltersButton = page.getByRole('button', { name: /clear all/i });
    this.stageColumns = page.locator('[class*="min-w-"][class*="flex-col"]');
    this.dealCards = page.locator('[class*="card"], [class*="Card"]').filter({
      has: page.locator('[class*="font-medium"]'),
    });
    this.statsCards = page.locator('[class*="grid"]').filter({
      has: page.locator('text=Pipeline Value'),
    }).locator('[class*="card"]');

    // Form elements
    this.dealForm = page.locator('[role="dialog"]');
    this.nameInput = this.dealForm.getByLabel(/name/i);
    this.amountInput = this.dealForm.getByLabel(/amount/i);
    this.currencySelect = this.dealForm.locator('[role="combobox"]').filter({
      has: page.locator('text=USD, text=EUR'),
    });
    this.companySelect = this.dealForm.locator('[role="combobox"]').filter({
      has: page.locator('text=company'),
    });
    this.stageSelect = this.dealForm.locator('[role="combobox"]').filter({
      has: page.locator('text=stage'),
    });
    this.closeDateInput = this.dealForm.getByLabel(/close date|expected/i);
  }

  /**
   * Navigate to deals page
   */
  async goto(): Promise<void> {
    await this.page.goto('/deals');
    await this.waitForReady();
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 30000 });
    await super.waitForReady();
  }

  /**
   * Open add deal dialog
   */
  async openAddDealDialog(): Promise<void> {
    await this.addDealButton.click();
    await expect(this.dealForm).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close deal dialog
   */
  async closeDealDialog(): Promise<void> {
    if (await this.dealForm.isVisible()) {
      await this.page.keyboard.press('Escape');
      await expect(this.dealForm).not.toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Fill deal form
   */
  async fillDealForm(data: DealFormData): Promise<void> {
    await this.nameInput.fill(data.name);
    if (data.amount !== undefined) {
      await this.amountInput.fill(data.amount.toString());
    }
    if (data.stageId) {
      await this.stageSelect.click();
      await this.page.locator('[role="option"]').filter({ hasText: new RegExp(data.stageId, 'i') }).click();
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(data: DealFormData): Promise<void> {
    await this.openAddDealDialog();
    await this.fillDealForm(data);

    const submitButton = this.dealForm.getByRole('button', { name: /create|save|add/i });
    await submitButton.click();
    await expect(this.dealForm).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Switch to kanban view
   */
  async switchToKanbanView(): Promise<void> {
    const kanbanButton = this.viewToggle.locator('button').first();
    await kanbanButton.click();
    await super.waitForReady();
  }

  /**
   * Switch to list view
   */
  async switchToListView(): Promise<void> {
    const listButton = this.viewToggle.locator('button').last();
    await listButton.click();
    await super.waitForReady();
  }

  /**
   * Get stage count
   */
  async getStageCount(): Promise<number> {
    return this.stageColumns.count();
  }

  /**
   * Get deals in a stage
   */
  async getDealsInStage(stageName: string): Promise<Locator> {
    const stageColumn = this.page.locator('[class*="min-w-"]').filter({
      has: this.page.locator(`text=${stageName}`),
    });
    return stageColumn.locator('[class*="card"]');
  }

  /**
   * Get deal count in a stage
   */
  async getDealCountInStage(stageName: string): Promise<number> {
    const deals = await this.getDealsInStage(stageName);
    return deals.count();
  }

  /**
   * Drag a deal to a new stage
   */
  async moveDealToStage(dealName: string, targetStageName: string): Promise<void> {
    const dealCard = this.page.locator('[class*="card"]').filter({ hasText: dealName }).first();
    const targetStage = this.stageColumns.filter({
      has: this.page.locator(`text=${targetStageName}`),
    });

    // Get bounding boxes
    const dealBox = await dealCard.boundingBox();
    const stageBox = await targetStage.boundingBox();

    if (!dealBox || !stageBox) {
      throw new Error('Could not get element positions for drag and drop');
    }

    // Perform drag and drop
    await this.page.mouse.move(dealBox.x + dealBox.width / 2, dealBox.y + dealBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + 100, { steps: 10 });
    await this.page.mouse.up();

    await super.waitForReady();
  }

  /**
   * Click on a deal to view details
   */
  async openDeal(dealName: string): Promise<void> {
    const dealCard = this.dealCards.filter({ hasText: dealName }).first();
    await dealCard.click();
    await this.page.waitForURL(/\/deals\/[a-zA-Z0-9]+/);
    await super.waitForReady();
  }

  /**
   * Filter by owner
   */
  async filterByOwner(ownerName: string): Promise<void> {
    await this.ownerFilter.click();
    await this.page.locator('[role="option"]').filter({ hasText: ownerName }).click();
    await super.waitForReady();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: 'Open' | 'Won' | 'Lost'): Promise<void> {
    await this.statusFilter.click();
    await this.page.locator('[role="option"]').filter({ hasText: status }).click();
    await super.waitForReady();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    if (await this.clearFiltersButton.isVisible()) {
      await this.clearFiltersButton.click();
      await super.waitForReady();
    }
  }

  /**
   * Get pipeline value from stats card
   */
  async getPipelineValue(): Promise<string> {
    const valueCard = this.statsCards.filter({
      has: this.page.locator('text=Pipeline Value'),
    });
    const value = valueCard.locator('[class*="text-2xl"], [class*="font-bold"]').first();
    return (await value.textContent()) || '$0';
  }

  /**
   * Mark a deal as won from list view
   */
  async markDealAsWon(dealName: string): Promise<void> {
    await this.switchToListView();
    const dealRow = this.listView.locator('tr').filter({ hasText: dealName });
    const wonButton = dealRow.getByRole('button', { name: /won/i });
    await wonButton.click();
    await this.waitForSuccessToast();
  }

  /**
   * Mark a deal as lost from list view
   */
  async markDealAsLost(dealName: string): Promise<void> {
    await this.switchToListView();
    const dealRow = this.listView.locator('tr').filter({ hasText: dealName });
    const lostButton = dealRow.getByRole('button', { name: /lost/i });
    await lostButton.click();
    await this.waitForSuccessToast();
  }

  /**
   * Add deal to a specific stage (from the stage's add button)
   */
  async addDealToStage(stageName: string): Promise<void> {
    const stageColumn = this.stageColumns.filter({
      has: this.page.locator(`text=${stageName}`),
    });
    const addButton = stageColumn.getByRole('button', { name: /add deal/i });
    await addButton.click();
    await expect(this.dealForm).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate between stages on mobile
   */
  async navigateToNextStage(): Promise<void> {
    const nextButton = this.page.locator('button[aria-label="Next stage"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await super.waitForReady();
    }
  }

  /**
   * Navigate to previous stage on mobile
   */
  async navigateToPreviousStage(): Promise<void> {
    const prevButton = this.page.locator('button[aria-label="Previous stage"]');
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await super.waitForReady();
    }
  }
}
