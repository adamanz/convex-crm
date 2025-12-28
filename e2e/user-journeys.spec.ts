import { test, expect } from './fixtures';
import {
  DashboardPage,
  ContactsPage,
  CompaniesPage,
  DealsPage,
  ActivitiesPage,
} from './pages';
import { generateTestId } from './helpers/test-utils';

test.describe('User Journeys', () => {
  test.describe('Complete Sales Workflow', () => {
    test('should create contact, add to company, create deal, and mark as won', async ({ page }) => {
      const testId = generateTestId();

      // 1. Create a company
      const companiesPage = new CompaniesPage(page);
      await companiesPage.goto();

      await companiesPage.createCompany({
        name: `Journey Company-${testId}`,
        industry: 'Technology',
      });

      // Verify company was created
      const hasCompany = await companiesPage.hasCompany(`Journey Company-${testId}`);
      expect(hasCompany).toBe(true);

      // 2. Create a contact
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      await contactsPage.createContact({
        firstName: 'John',
        lastName: `Journey-${testId}`,
        email: `john.journey.${testId}@example.com`,
        title: 'CEO',
      });

      // Verify contact was created
      const hasContact = await contactsPage.hasContact(`John Journey-${testId}`);
      expect(hasContact).toBe(true);

      // 3. Create a deal
      const dealsPage = new DealsPage(page);
      await dealsPage.goto();

      await dealsPage.createDeal({
        name: `Journey Deal-${testId}`,
        amount: 100000,
      });

      // Verify deal was created (form should close)
      await expect(dealsPage.dealForm).not.toBeVisible({ timeout: 10000 });

      // 4. Mark deal as won (from list view)
      await dealsPage.switchToListView();
      await dealsPage.markDealAsWon(`Journey Deal-${testId}`);
    });
  });

  test.describe('Lead Qualification Workflow', () => {
    test('should create lead contact, add notes, and convert to opportunity', async ({ page }) => {
      const testId = generateTestId();

      // 1. Create a lead contact
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      await contactsPage.createContact({
        firstName: 'Lead',
        lastName: `User-${testId}`,
        email: `lead.${testId}@example.com`,
      });

      // Verify contact was created
      const hasContact = await contactsPage.hasContact(`Lead User-${testId}`);
      expect(hasContact).toBe(true);

      // 2. Create a note about the lead
      const activitiesPage = new ActivitiesPage(page);
      await activitiesPage.goto();

      await activitiesPage.createNote({
        subject: `Lead Note-${testId}`,
        description: 'Initial conversation with the lead. Interested in our product.',
      });

      // Verify note was created
      await activitiesPage.switchToTab('Notes');
      const hasNote = await activitiesPage.hasActivity(`Lead Note-${testId}`);
      expect(hasNote).toBe(true);

      // 3. Create a task for follow-up
      await activitiesPage.createTask({
        subject: `Follow up with Lead-${testId}`,
        priority: 'high',
      });

      // Verify task was created
      await activitiesPage.switchToTab('Tasks');
      const hasTask = await activitiesPage.hasActivity(`Follow up with Lead-${testId}`);
      expect(hasTask).toBe(true);

      // 4. Create an opportunity/deal
      const dealsPage = new DealsPage(page);
      await dealsPage.goto();

      await dealsPage.createDeal({
        name: `Lead Opportunity-${testId}`,
        amount: 50000,
      });

      // Verify deal was created
      await expect(dealsPage.dealForm).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Dashboard to Detail Navigation', () => {
    test('should navigate from dashboard to contacts and back', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Click on Contacts in sidebar
      await dashboardPage.navigateTo('Contacts');
      await expect(page).toHaveURL(/\/contacts/);

      // Navigate back to dashboard
      await dashboardPage.navigateTo('Dashboard');
      await expect(page).toHaveURL(/\/$/);
    });

    test('should navigate from dashboard to deals and back', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Click New Deal button
      await dashboardPage.clickNewDeal();
      await expect(page).toHaveURL(/\/deals/);

      // Navigate back to dashboard
      const dealsPage = new DealsPage(page);
      await dealsPage.navigateTo('Dashboard');
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe('Task Management Workflow', () => {
    test('should create, complete, and reopen a task', async ({ page }) => {
      const testId = generateTestId();
      const activitiesPage = new ActivitiesPage(page);
      await activitiesPage.goto();

      // 1. Create a task
      await activitiesPage.createTask({
        subject: `Workflow Task-${testId}`,
        description: 'A task to test the workflow',
        priority: 'medium',
      });

      // Verify task was created
      await activitiesPage.switchToTab('Tasks');
      const hasTask = await activitiesPage.hasActivity(`Workflow Task-${testId}`);
      expect(hasTask).toBe(true);

      // 2. Complete the task
      await activitiesPage.completeTask(`Workflow Task-${testId}`);

      // 3. Reopen the task
      await activitiesPage.reopenTask(`Workflow Task-${testId}`);
    });
  });

  test.describe('Cross-Entity Navigation', () => {
    test('should navigate between contacts, companies, and deals', async ({ page }) => {
      // Start at dashboard
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();

      // Navigate to contacts
      await dashboardPage.navigateTo('Contacts');
      await expect(page).toHaveURL(/\/contacts/);

      // Navigate to companies
      const contactsPage = new ContactsPage(page);
      await contactsPage.navigateTo('Companies');
      await expect(page).toHaveURL(/\/companies/);

      // Navigate to deals
      const companiesPage = new CompaniesPage(page);
      await companiesPage.navigateTo('Deals');
      await expect(page).toHaveURL(/\/deals/);

      // Navigate to activities
      const dealsPage = new DealsPage(page);
      await dealsPage.navigateTo('Activities');
      await expect(page).toHaveURL(/\/activities/);

      // Navigate back to dashboard
      const activitiesPage = new ActivitiesPage(page);
      await activitiesPage.navigateTo('Dashboard');
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test.describe('Filter and Search Workflow', () => {
    test('should filter contacts and clear filters', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Apply filter
      await contactsPage.applyFilter('Recent');

      // Search for something
      await contactsPage.searchContacts('test');

      // Clear search
      await contactsPage.clearSearch();

      // Apply another filter
      await contactsPage.applyFilter('All');
    });

    test('should filter deals by status and owner', async ({ page }) => {
      const dealsPage = new DealsPage(page);
      await dealsPage.goto();

      // Filter by status
      await dealsPage.filterByStatus('Open');

      // Clear filters
      await dealsPage.clearFilters();
    });
  });

  test.describe('Mobile User Journey', () => {
    test('should complete basic workflow on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const testId = generateTestId();

      // Dashboard
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await expect(dashboardPage.welcomeHeader).toBeVisible();

      // Contacts
      await dashboardPage.navigateTo('Contacts');
      const contactsPage = new ContactsPage(page);
      await contactsPage.createContact({
        lastName: `Mobile-${testId}`,
      });

      // Deals
      await contactsPage.navigateTo('Deals');
      const dealsPage = new DealsPage(page);
      await dealsPage.createDeal({
        name: `Mobile Deal-${testId}`,
      });

      // Navigate mobile pipeline
      await dealsPage.switchToKanbanView();
      await dealsPage.navigateToNextStage();
      await dealsPage.navigateToPreviousStage();
    });
  });

  test.describe('Settings Navigation Journey', () => {
    test('should navigate through all settings pages', async ({ page }) => {
      await page.goto('/settings');

      // Profile
      await page.click('a[href*="/settings/profile"]');
      await expect(page).toHaveURL(/\/settings\/profile/);

      // Back to settings
      await page.goto('/settings');

      // Team
      await page.click('a[href*="/settings/team"]');
      await expect(page).toHaveURL(/\/settings\/team/);

      // Back to settings
      await page.goto('/settings');

      // Pipelines
      await page.click('a[href*="/settings/pipelines"]');
      await expect(page).toHaveURL(/\/settings\/pipelines/);

      // Back to settings
      await page.goto('/settings');

      // Email
      await page.click('a[href*="/settings/email"]');
      await expect(page).toHaveURL(/\/settings\/email/);
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle navigation to non-existent page', async ({ page }) => {
      await page.goto('/non-existent-page');
      // Should show 404 or redirect to dashboard
      await page.waitForTimeout(1000);
    });

    test('should handle form validation errors', async ({ page }) => {
      const contactsPage = new ContactsPage(page);
      await contactsPage.goto();

      // Open form
      await contactsPage.openAddContactDialog();

      // Try to submit without required fields
      await expect(contactsPage.submitButton).toBeDisabled();

      // Close form
      await contactsPage.closeAddContactDialog();
    });
  });
});
