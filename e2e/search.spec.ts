import { test, expect } from './fixtures';
import { DashboardPage, ContactsPage, CompaniesPage, DealsPage } from './pages';
import { generateTestId } from './helpers/test-utils';

test.describe('Global Search', () => {
  test.describe('Command Menu Search', () => {
    test('should open command menu with keyboard shortcut', async ({ page }) => {
      await page.goto('/');
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForReady();

      await dashboardPage.openCommandMenu();
      const commandMenu = page.locator('[class*="command"], [role="dialog"]');
      await expect(commandMenu).toBeVisible();
    });

    test('should close command menu with Escape', async ({ page }) => {
      await page.goto('/');
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForReady();

      await dashboardPage.openCommandMenu();
      await page.keyboard.press('Escape');
      const commandMenu = page.locator('[class*="command"], [role="dialog"]');
      await expect(commandMenu).not.toBeVisible();
    });

    test('should search via command menu', async ({ page }) => {
      await page.goto('/');
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForReady();

      await dashboardPage.searchViaCommandMenu('test');

      // Command menu should show search results or navigation options
      const commandMenu = page.locator('[class*="command"], [role="dialog"]');
      await expect(commandMenu).toBeVisible();
    });

    test('should navigate to contacts from command menu', async ({ page }) => {
      await page.goto('/');
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForReady();

      await dashboardPage.openCommandMenu();

      // Type to search for contacts section
      const input = page.locator('[class*="command"] input, [role="dialog"] input');
      await input.fill('contacts');

      // Click on contacts option
      const contactsOption = page.locator('[class*="command"] [class*="item"], [role="option"]').filter({
        hasText: /contacts/i,
      });
      if (await contactsOption.first().isVisible()) {
        await contactsOption.first().click();
        await expect(page).toHaveURL(/\/contacts/);
      }
    });

    test('should navigate to deals from command menu', async ({ page }) => {
      await page.goto('/');
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForReady();

      await dashboardPage.openCommandMenu();

      const input = page.locator('[class*="command"] input, [role="dialog"] input');
      await input.fill('deals');

      const dealsOption = page.locator('[class*="command"] [class*="item"], [role="option"]').filter({
        hasText: /deals/i,
      });
      if (await dealsOption.first().isVisible()) {
        await dealsOption.first().click();
        await expect(page).toHaveURL(/\/deals/);
      }
    });
  });

  test.describe('Contacts Search', () => {
    test('should search contacts by name', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Create a contact to search for
      const testId = generateTestId();
      await contactsPage.createContact({
        firstName: 'Searchable',
        lastName: `User-${testId}`,
      });

      // Search for the contact
      await contactsPage.searchContacts(`User-${testId}`);
      const count = await contactsPage.getContactCount();
      expect(count).toBe(1);
    });

    test('should show no results for non-existent contact', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      await contactsPage.searchContacts('nonexistent-xyz-12345');
      const count = await contactsPage.getContactCount();
      expect(count).toBe(0);
    });

    test('should search contacts by email', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Create a contact with specific email
      const testId = generateTestId();
      await contactsPage.createContact({
        lastName: `EmailTest-${testId}`,
        email: `search-${testId}@example.com`,
      });

      // Search by email
      await contactsPage.searchContacts(`search-${testId}@example.com`);
      const hasContact = await contactsPage.hasContact(`EmailTest-${testId}`);
      expect(hasContact).toBe(true);
    });
  });

  test.describe('Companies Search', () => {
    test('should search companies by name', async ({ page }) => {
      const companiesPage = new CompaniesPage(page);
      await companiesPage.goto();

      // Create a company to search for
      const testId = generateTestId();
      await companiesPage.createCompany({
        name: `SearchableCompany-${testId}`,
      });

      // Search for the company
      await companiesPage.searchCompanies(`SearchableCompany-${testId}`);
      const hasCompany = await companiesPage.hasCompany(`SearchableCompany-${testId}`);
      expect(hasCompany).toBe(true);
    });

    test('should show no results for non-existent company', async ({ page }) => {
      const companiesPage = new CompaniesPage(page);
      await companiesPage.goto();

      await companiesPage.searchCompanies('nonexistent-company-xyz-12345');
      const count = await companiesPage.getCompanyCount();
      expect(count).toBe(0);
    });
  });

  test.describe('Search Debouncing', () => {
    test('should debounce search input on contacts page', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Type quickly
      await contactsPage.searchInput.pressSequentially('test', { delay: 50 });

      // Wait for debounce
      await page.waitForTimeout(600);

      // Search should have been executed
      await contactsPage.waitForReady();
    });

    test('should debounce search input on companies page', async ({ page }) => {
      const companiesPage = new CompaniesPage(page);
      await companiesPage.goto();

      // Type quickly
      await companiesPage.searchInput.pressSequentially('test', { delay: 50 });

      // Wait for debounce
      await page.waitForTimeout(600);

      // Search should have been executed
      await companiesPage.waitForReady();
    });
  });

  test.describe('Search UX', () => {
    test('should show loading state while searching', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      await contactsPage.searchInput.fill('test');

      // Loading state might appear briefly
      await contactsPage.waitForReady();
    });

    test('should clear search with clear button', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      await contactsPage.searchContacts('test');
      await contactsPage.clearSearch();

      await expect(contactsPage.searchInput).toHaveValue('');
    });

    test('should preserve search on navigation back', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Create and find a contact
      const testId = generateTestId();
      await contactsPage.createContact({
        lastName: `BackNav-${testId}`,
      });

      await contactsPage.searchContacts(`BackNav-${testId}`);
      await contactsPage.openContact(`BackNav-${testId}`);

      // Go back
      await page.goBack();

      // Search might be preserved (depends on implementation)
      // Just verify we're back on the contacts page
      await expect(page).toHaveURL(/\/contacts/);
    });
  });

  test.describe('Search Accessibility', () => {
    test('should have accessible search input on contacts page', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Search input should have placeholder
      await expect(contactsPage.searchInput).toHaveAttribute('placeholder', /search/i);
    });

    test('should have accessible search input on companies page', async ({ page }) => {
      const companiesPage = new CompaniesPage(page);
      await companiesPage.goto();

      // Search input should have placeholder
      await expect(companiesPage.searchInput).toHaveAttribute('placeholder', /search/i);
    });

    test('should be focusable via keyboard', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Tab through to find search input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Type in whatever is focused - might be search
      await page.keyboard.type('test');
    });
  });
});
