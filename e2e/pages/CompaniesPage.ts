import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Company data interface
 */
export interface CompanyFormData {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  description?: string;
  phone?: string;
  website?: string;
}

/**
 * Page Object for the Companies page
 */
export class CompaniesPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly addCompanyButton: Locator;
  readonly companyGrid: Locator;
  readonly industryFilter: Locator;
  readonly clearFiltersButton: Locator;
  readonly emptyState: Locator;

  // Company Form elements (slideout)
  readonly companyForm: Locator;
  readonly nameInput: Locator;
  readonly domainInput: Locator;
  readonly industryInput: Locator;
  readonly sizeInput: Locator;
  readonly descriptionInput: Locator;
  readonly phoneInput: Locator;
  readonly websiteInput: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Companies")');
    this.searchInput = page.locator('input[placeholder*="search" i]');
    this.addCompanyButton = page.getByRole('button', { name: /add company/i });
    this.companyGrid = page.locator('[class*="grid"][class*="gap"]').filter({
      has: page.locator('[class*="card"], [class*="Card"]'),
    });
    this.industryFilter = page.locator('button[role="combobox"], [data-testid="industry-filter"]').filter({
      has: page.locator('text=All industries, text=industry'),
    });
    this.clearFiltersButton = page.getByRole('button', { name: /clear/i });
    this.emptyState = page.locator('text=No companies').first();

    // Form elements (slideout panel)
    this.companyForm = page.locator('[class*="fixed"][class*="right-0"]');
    this.nameInput = page.getByLabel(/^name$/i).or(page.getByLabel(/company name/i));
    this.domainInput = page.getByLabel(/domain/i);
    this.industryInput = page.getByLabel(/industry/i);
    this.sizeInput = page.getByLabel(/size/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.websiteInput = page.getByLabel(/website/i);
  }

  /**
   * Navigate to companies page
   */
  async goto(): Promise<void> {
    await this.page.goto('/companies');
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
   * Open add company form
   */
  async openAddCompanyForm(): Promise<void> {
    await this.addCompanyButton.click();
    await expect(this.companyForm).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close company form
   */
  async closeCompanyForm(): Promise<void> {
    // Click the backdrop to close
    const backdrop = this.page.locator('[class*="fixed"][class*="bg-black"]');
    if (await backdrop.isVisible()) {
      await backdrop.click();
    } else {
      // Press Escape as fallback
      await this.page.keyboard.press('Escape');
    }
    await expect(this.companyForm).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Fill company form
   */
  async fillCompanyForm(data: CompanyFormData): Promise<void> {
    await this.nameInput.fill(data.name);
    if (data.domain) {
      await this.domainInput.fill(data.domain);
    }
    if (data.industry) {
      await this.industryInput.fill(data.industry);
    }
    if (data.size) {
      await this.sizeInput.fill(data.size);
    }
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    if (data.website) {
      await this.websiteInput.fill(data.website);
    }
  }

  /**
   * Create a new company
   */
  async createCompany(data: CompanyFormData): Promise<void> {
    await this.openAddCompanyForm();
    await this.fillCompanyForm(data);

    const submitButton = this.companyForm.getByRole('button', { name: /save|create|add/i });
    await submitButton.click();
    await expect(this.companyForm).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Search for a company
   */
  async searchCompanies(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounced search
    await super.waitForReady();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    const clearButton = this.searchInput.locator('..').locator('button:has(svg)');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      await this.searchInput.clear();
    }
    await super.waitForReady();
  }

  /**
   * Get company count in grid
   */
  async getCompanyCount(): Promise<number> {
    await super.waitForReady();
    // Get company cards
    const cards = this.page.locator('[class*="card"], a[href*="/companies/"]');
    return cards.count();
  }

  /**
   * Check if a company exists in the grid
   */
  async hasCompany(name: string): Promise<boolean> {
    await super.waitForReady();
    const company = this.page.locator(`text=${name}`);
    return (await company.count()) > 0;
  }

  /**
   * Click on a company to view details
   */
  async openCompany(name: string): Promise<void> {
    const companyCard = this.page.locator('a[href*="/companies/"]').filter({ hasText: name }).first();
    await companyCard.click();
    await this.page.waitForURL(/\/companies\/[a-zA-Z0-9]+/);
    await super.waitForReady();
  }

  /**
   * Filter by industry
   */
  async filterByIndustry(industry: string): Promise<void> {
    const trigger = this.page.locator('button[role="combobox"]').filter({
      has: this.page.locator('text=All industries'),
    }).or(this.page.getByRole('combobox', { name: /industry/i }));

    await trigger.click();
    await this.page.locator('[role="option"]').filter({ hasText: industry }).click();
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
   * Check if empty state is shown
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Get company card data by index
   */
  async getCompanyCardData(index: number): Promise<{
    name: string;
    industry: string | null;
    domain: string | null;
  }> {
    const card = this.page.locator('a[href*="/companies/"]').nth(index);
    const name = (await card.locator('h3, [class*="font-semibold"]').first().textContent()) || '';
    const industry = await card.locator('[class*="badge"], [class*="Badge"]').first().textContent().catch(() => null);
    const domain = await card.locator('[class*="muted"]').first().textContent().catch(() => null);

    return { name, industry, domain };
  }
}
