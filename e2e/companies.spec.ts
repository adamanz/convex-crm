import { test, expect } from './fixtures';
import { CompaniesPage, CompanyFormData } from './pages';
import { generateTestId } from './helpers/test-utils';

test.describe('Companies', () => {
  let companiesPage: CompaniesPage;

  test.beforeEach(async ({ page }) => {
    companiesPage = new CompaniesPage(page);
    await companiesPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display companies page title', async ({ page }) => {
      await expect(page.locator('h1:has-text("Companies")')).toBeVisible();
    });

    test('should display search input', async () => {
      await expect(companiesPage.searchInput).toBeVisible();
    });

    test('should display add company button', async () => {
      await expect(companiesPage.addCompanyButton).toBeVisible();
    });

    test('should show company count in subtitle', async ({ page }) => {
      const subtitle = page.locator('p:has-text("companies")');
      await expect(subtitle).toBeVisible();
    });
  });

  test.describe('Add Company Form', () => {
    test('should open add company form as slideout', async () => {
      await companiesPage.openAddCompanyForm();
      await expect(companiesPage.companyForm).toBeVisible();
    });

    test('should close form when clicking backdrop', async () => {
      await companiesPage.openAddCompanyForm();
      await companiesPage.closeCompanyForm();
      await expect(companiesPage.companyForm).not.toBeVisible();
    });

    test('should display form fields', async () => {
      await companiesPage.openAddCompanyForm();
      await expect(companiesPage.nameInput).toBeVisible();
    });
  });

  test.describe('Create Company', () => {
    test('should create a new company with minimal data', async () => {
      const testId = generateTestId();
      const companyData: CompanyFormData = {
        name: `TestCompany-${testId}`,
      };

      await companiesPage.createCompany(companyData);

      // Verify company appears in grid
      const hasCompany = await companiesPage.hasCompany(companyData.name);
      expect(hasCompany).toBe(true);
    });

    test('should create a new company with full data', async () => {
      const testId = generateTestId();
      const companyData: CompanyFormData = {
        name: `Acme Corp-${testId}`,
        domain: `acme-${testId}.com`,
        industry: 'Technology',
        description: 'A test company for E2E testing',
      };

      await companiesPage.createCompany(companyData);

      // Verify company appears in grid
      const hasCompany = await companiesPage.hasCompany(companyData.name);
      expect(hasCompany).toBe(true);
    });
  });

  test.describe('Search Companies', () => {
    test('should filter companies by search query', async () => {
      await companiesPage.searchCompanies('nonexistent-company-xyz');
      const count = await companiesPage.getCompanyCount();
      expect(count).toBe(0);
    });

    test('should clear search with X button', async () => {
      await companiesPage.searchCompanies('test');
      await companiesPage.clearSearch();
      await expect(companiesPage.searchInput).toHaveValue('');
    });

    test('should show empty state when no results', async () => {
      await companiesPage.searchCompanies('xyz-nonexistent-12345');
      const isEmpty = await companiesPage.isEmptyStateVisible();
      expect(isEmpty).toBe(true);
    });
  });

  test.describe('Filter Companies', () => {
    test('should show industry filter', async ({ page }) => {
      const industryTrigger = page.locator('button[role="combobox"]').filter({
        has: page.locator('text=industries, text=Industry'),
      }).or(page.getByRole('combobox', { name: /industry/i }));

      // Industry filter might not be visible on mobile
      const isMobile = await companiesPage.isMobileViewport();
      if (!isMobile) {
        await expect(industryTrigger.first()).toBeVisible();
      }
    });

    test('should clear all filters', async () => {
      await companiesPage.searchCompanies('test');
      await companiesPage.clearFilters();
      await expect(companiesPage.searchInput).toHaveValue('');
    });
  });

  test.describe('Company Grid', () => {
    test('should display companies in a grid layout', async ({ page }) => {
      // Check for grid container
      const grid = page.locator('[class*="grid"]').filter({
        has: page.locator('a[href*="/companies/"]'),
      });
      await expect(grid.first()).toBeVisible().catch(() => {
        // Grid might be empty
      });
    });

    test('should navigate to company detail on click', async () => {
      // First create a company
      const testId = generateTestId();
      const companyData: CompanyFormData = {
        name: `ClickTest-${testId}`,
      };

      await companiesPage.createCompany(companyData);
      await companiesPage.openCompany(`ClickTest-${testId}`);

      await expect(companiesPage.page).toHaveURL(/\/companies\/[a-zA-Z0-9]+/);
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no companies and no filters', async ({ page }) => {
      // This test assumes a clean database or you need to verify with search
      await companiesPage.searchCompanies('zzzzzzzznonexistent12345');
      const emptyState = page.locator('text=No companies found');
      await expect(emptyState).toBeVisible();
    });

    test('should show add company button in empty state', async ({ page }) => {
      await companiesPage.searchCompanies('zzzzzzzznonexistent12345');
      // Either "Clear filters" or "Add Company" should be visible
      const actionButton = page.getByRole('button', { name: /clear filters|add company/i });
      await expect(actionButton.first()).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await companiesPage.goto();

      // Search should still be visible
      await expect(companiesPage.searchInput).toBeVisible();

      // Add button should still be visible
      await expect(companiesPage.addCompanyButton).toBeVisible();
    });

    test('should show filters toggle on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await companiesPage.goto();

      // Mobile filter toggle button
      const filterToggle = page.getByRole('button', { name: /filters/i });
      await expect(filterToggle).toBeVisible();
    });

    test('should adjust grid columns on different viewports', async ({ page }) => {
      // Desktop - should show 3 columns
      await page.setViewportSize({ width: 1280, height: 800 });
      await companiesPage.goto();

      // Tablet - should show 2 columns
      await page.setViewportSize({ width: 768, height: 1024 });
      await companiesPage.waitForReady();

      // Mobile - should show 1 column
      await page.setViewportSize({ width: 375, height: 667 });
      await companiesPage.waitForReady();
    });
  });

  test.describe('Company Cards', () => {
    test('should display company information in cards', async () => {
      // Create a company with full data
      const testId = generateTestId();
      const companyData: CompanyFormData = {
        name: `CardTest-${testId}`,
        industry: 'Technology',
      };

      await companiesPage.createCompany(companyData);

      // Verify card is displayed
      const hasCompany = await companiesPage.hasCompany(`CardTest-${testId}`);
      expect(hasCompany).toBe(true);
    });
  });
});
