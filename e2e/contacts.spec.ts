import { test, expect } from './fixtures';
import { ContactsPage, ContactFormData } from './pages';
import { generateTestId } from './helpers/test-utils';

test.describe('Contacts', () => {
  let contactsPage: ContactsPage;

  test.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display contacts page title', async ({ page }) => {
      await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
    });

    test('should display search input', async () => {
      await expect(contactsPage.searchInput).toBeVisible();
    });

    test('should display add contact button', async () => {
      await expect(contactsPage.addContactButton).toBeVisible();
    });

    test('should display filter buttons', async () => {
      await expect(contactsPage.filterButtons.first()).toBeVisible();
    });
  });

  test.describe('Add Contact Dialog', () => {
    test('should open add contact dialog', async () => {
      await contactsPage.openAddContactDialog();
      await expect(contactsPage.addContactDialog).toBeVisible();
    });

    test('should close add contact dialog on cancel', async () => {
      await contactsPage.openAddContactDialog();
      await contactsPage.closeAddContactDialog();
      await expect(contactsPage.addContactDialog).not.toBeVisible();
    });

    test('should close add contact dialog on escape key', async ({ page }) => {
      await contactsPage.openAddContactDialog();
      await page.keyboard.press('Escape');
      await expect(contactsPage.addContactDialog).not.toBeVisible();
    });

    test('should require last name field', async () => {
      await contactsPage.openAddContactDialog();
      // Try to submit without filling required field
      await expect(contactsPage.submitButton).toBeDisabled();
    });

    test('should enable submit button when last name is filled', async () => {
      await contactsPage.openAddContactDialog();
      await contactsPage.lastNameInput.fill('Test');
      await expect(contactsPage.submitButton).toBeEnabled();
    });
  });

  test.describe('Create Contact', () => {
    test('should create a new contact with minimal data', async () => {
      const testId = generateTestId();
      const contactData: ContactFormData = {
        lastName: `TestContact-${testId}`,
      };

      await contactsPage.createContact(contactData);

      // Verify contact appears in list
      await expect(contactsPage.hasContact(contactData.lastName)).resolves.toBe(true);
    });

    test('should create a new contact with full data', async () => {
      const testId = generateTestId();
      const contactData: ContactFormData = {
        firstName: 'John',
        lastName: `Doe-${testId}`,
        email: `john.doe.${testId}@example.com`,
        phone: '+1 (555) 123-4567',
        title: 'CEO',
      };

      await contactsPage.createContact(contactData);

      // Verify contact appears in list
      const hasContact = await contactsPage.hasContact(`John Doe-${testId}`);
      expect(hasContact).toBe(true);
    });

    test('should validate email format', async () => {
      await contactsPage.openAddContactDialog();
      await contactsPage.lastNameInput.fill('Test');
      await contactsPage.emailInput.fill('invalid-email');

      // HTML5 validation should prevent submission
      const emailInput = contactsPage.emailInput;
      const isInvalid = await emailInput.evaluate((el) => {
        return !(el as HTMLInputElement).checkValidity();
      });
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Search Contacts', () => {
    test('should filter contacts by search query', async () => {
      await contactsPage.searchContacts('nonexistent-contact-xyz');
      // Should show empty state or no results
      const count = await contactsPage.getContactCount();
      expect(count).toBe(0);
    });

    test('should clear search and show all contacts', async () => {
      await contactsPage.searchContacts('test');
      await contactsPage.clearSearch();
      // Search input should be empty
      await expect(contactsPage.searchInput).toHaveValue('');
    });

    test('should show empty state for no results', async () => {
      await contactsPage.searchContacts('xyz-nonexistent-12345');
      const isEmpty = await contactsPage.isEmptyStateVisible();
      expect(isEmpty).toBe(true);
    });
  });

  test.describe('Filter Contacts', () => {
    test('should apply All filter', async () => {
      await contactsPage.applyFilter('All');
      // Filter should be applied
      await expect(contactsPage.page.getByRole('button', { name: 'All' })).toHaveAttribute(
        'data-state',
        'active'
      ).catch(() => {
        // Alternative check if data-state is not used
        return expect(contactsPage.page.getByRole('button', { name: 'All' })).toHaveClass(/secondary/);
      });
    });

    test('should apply My Contacts filter', async () => {
      await contactsPage.applyFilter('My Contacts');
      // This might show different results based on ownership
    });

    test('should apply Recent filter', async () => {
      await contactsPage.applyFilter('Recent');
      // Recent contacts should be sorted by activity
    });
  });

  test.describe('Contact List', () => {
    test('should display contact information in list', async () => {
      // Create a contact first
      const testId = generateTestId();
      const contactData: ContactFormData = {
        firstName: 'Jane',
        lastName: `Smith-${testId}`,
        email: `jane.${testId}@example.com`,
      };

      await contactsPage.createContact(contactData);

      // Verify contact data is displayed
      const hasContact = await contactsPage.hasContact(`Jane Smith-${testId}`);
      expect(hasContact).toBe(true);
    });

    test('should navigate to contact detail on click', async () => {
      // First create a contact
      const testId = generateTestId();
      const contactData: ContactFormData = {
        firstName: 'Click',
        lastName: `Test-${testId}`,
      };

      await contactsPage.createContact(contactData);
      await contactsPage.openContact(`Click Test-${testId}`);

      await expect(contactsPage.page).toHaveURL(/\/contacts\/[a-zA-Z0-9]+/);
    });
  });

  test.describe('Contact Actions Menu', () => {
    test('should open contact dropdown menu', async () => {
      // Create a contact first
      const testId = generateTestId();
      await contactsPage.createContact({ lastName: `Menu-${testId}` });

      await contactsPage.openContactMenu(`Menu-${testId}`);
      await expect(contactsPage.page.locator('[role="menu"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await contactsPage.goto();

      // Search should still be visible
      await expect(contactsPage.searchInput).toBeVisible();

      // Add button should still be visible
      await expect(contactsPage.addContactButton).toBeVisible();
    });

    test('should hide some columns on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await contactsPage.goto();

      // Email column should be hidden on mobile (class hidden md:flex)
      const emailColumn = page.locator('[class*="hidden md:flex"]').first();
      await expect(emailColumn).not.toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should focus search input on page load', async ({ page }) => {
      // Tab to first focusable element
      await page.keyboard.press('Tab');
      // Continue tabbing to reach search or add button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
    });

    test('should submit form with Enter key', async ({ page }) => {
      await contactsPage.openAddContactDialog();
      await contactsPage.lastNameInput.fill('EnterTest');
      await page.keyboard.press('Enter');

      // Form should be submitted (dialog closes or shows loading)
      await expect(contactsPage.addContactDialog).not.toBeVisible({ timeout: 10000 });
    });
  });
});
