import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Contact data interface
 */
export interface ContactFormData {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
}

/**
 * Page Object for the Contacts page
 */
export class ContactsPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly addContactButton: Locator;
  readonly contactList: Locator;
  readonly filterButtons: Locator;
  readonly emptyState: Locator;

  // Add Contact Dialog elements
  readonly addContactDialog: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly titleInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Contacts")');
    this.searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search"]');
    this.addContactButton = page.getByRole('button', { name: /add contact/i });
    this.contactList = page.locator('[class*="divide-y"]');
    this.filterButtons = page.locator('button:has-text("All"), button:has-text("My Contacts"), button:has-text("Recent")');
    this.emptyState = page.locator('text=No contacts').first();

    // Dialog elements
    this.addContactDialog = page.locator('[role="dialog"]');
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = this.addContactDialog.getByLabel(/email/i);
    this.phoneInput = this.addContactDialog.getByLabel(/phone/i);
    this.titleInput = this.addContactDialog.getByLabel(/title|job title/i);
    this.submitButton = this.addContactDialog.getByRole('button', { name: /add contact/i });
    this.cancelButton = this.addContactDialog.getByRole('button', { name: /cancel/i });
  }

  /**
   * Navigate to contacts page
   */
  async goto(): Promise<void> {
    await this.page.goto('/contacts');
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
   * Open add contact dialog
   */
  async openAddContactDialog(): Promise<void> {
    await this.addContactButton.click();
    await expect(this.addContactDialog).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close add contact dialog
   */
  async closeAddContactDialog(): Promise<void> {
    if (await this.addContactDialog.isVisible()) {
      await this.cancelButton.click();
      await expect(this.addContactDialog).not.toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Fill contact form
   */
  async fillContactForm(data: ContactFormData): Promise<void> {
    if (data.firstName) {
      await this.firstNameInput.fill(data.firstName);
    }
    await this.lastNameInput.fill(data.lastName);
    if (data.email) {
      await this.emailInput.fill(data.email);
    }
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    if (data.title) {
      await this.titleInput.fill(data.title);
    }
  }

  /**
   * Create a new contact
   */
  async createContact(data: ContactFormData): Promise<void> {
    await this.openAddContactDialog();
    await this.fillContactForm(data);
    await this.submitButton.click();
    await expect(this.addContactDialog).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Search for a contact
   */
  async searchContacts(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounced search
    await super.waitForReady();
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await super.waitForReady();
  }

  /**
   * Get contact count in list
   */
  async getContactCount(): Promise<number> {
    await super.waitForReady();
    const contacts = this.contactList.locator('a[href*="/contacts/"]');
    return contacts.count();
  }

  /**
   * Check if a contact exists in the list
   */
  async hasContact(name: string): Promise<boolean> {
    await super.waitForReady();
    const contact = this.contactList.locator(`text=${name}`);
    return (await contact.count()) > 0;
  }

  /**
   * Click on a contact to view details
   */
  async openContact(name: string): Promise<void> {
    const contact = this.contactList.locator('a').filter({ hasText: name }).first();
    await contact.click();
    await this.page.waitForURL(/\/contacts\/[a-zA-Z0-9]+/);
    await super.waitForReady();
  }

  /**
   * Apply filter
   */
  async applyFilter(filterName: 'All' | 'My Contacts' | 'Recent'): Promise<void> {
    const filterButton = this.page.getByRole('button', { name: filterName });
    await filterButton.click();
    await super.waitForReady();
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Get contact row data by index
   */
  async getContactRowData(index: number): Promise<{
    name: string;
    email: string | null;
    company: string | null;
  }> {
    const row = this.contactList.locator('a[href*="/contacts/"]').nth(index);
    const name = (await row.locator('[class*="font-medium"]').first().textContent()) || '';
    const email = await row.locator('text=@').textContent().catch(() => null);
    const company = await row.locator('[class*="muted"]').first().textContent().catch(() => null);

    return { name, email, company };
  }

  /**
   * Open contact dropdown menu
   */
  async openContactMenu(name: string): Promise<void> {
    const row = this.contactList.locator('a').filter({ hasText: name }).first();
    const menuButton = row.locator('button:has(svg)').last();
    await menuButton.click();
    await expect(this.page.locator('[role="menu"]')).toBeVisible();
  }

  /**
   * Delete a contact from the menu
   */
  async deleteContact(name: string): Promise<void> {
    await this.openContactMenu(name);
    const deleteOption = this.page.locator('[role="menuitem"]:has-text("Delete")');
    await deleteOption.click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }
}
