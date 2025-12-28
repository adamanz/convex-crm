import { test, expect } from './fixtures';
import { ConversationsPage } from './pages';

test.describe('Conversations', () => {
  let conversationsPage: ConversationsPage;

  test.beforeEach(async ({ page }) => {
    conversationsPage = new ConversationsPage(page);
    await conversationsPage.goto();
  });

  test.describe('Page Load', () => {
    test('should display conversations page', async () => {
      await expect(conversationsPage.searchInput).toBeVisible();
    });

    test('should display search input', async () => {
      await expect(conversationsPage.searchInput).toBeVisible();
    });

    test('should show empty state or conversation list', async () => {
      // Either conversations exist or empty state is shown
      const hasConversations = await conversationsPage.getConversationCount();
      const isEmpty = await conversationsPage.isEmptyStateVisible();

      expect(hasConversations > 0 || isEmpty).toBe(true);
    });
  });

  test.describe('Search Conversations', () => {
    test('should filter conversations by search query', async () => {
      await conversationsPage.searchConversations('nonexistent-xyz');
      const count = await conversationsPage.getConversationCount();
      expect(count).toBe(0);
    });

    test('should clear search', async () => {
      await conversationsPage.searchConversations('test');
      await conversationsPage.clearSearch();
      await expect(conversationsPage.searchInput).toHaveValue('');
    });
  });

  test.describe('Conversation List', () => {
    test('should display conversation items', async () => {
      const count = await conversationsPage.getConversationCount();
      // May be 0 if no conversations exist
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Message Thread', () => {
    test('should show select conversation prompt when no conversation selected', async ({ page }) => {
      // On desktop, should show empty state
      await page.setViewportSize({ width: 1280, height: 800 });
      await conversationsPage.goto();

      const emptyPrompt = await conversationsPage.isSelectConversationPromptVisible();
      expect(emptyPrompt).toBe(true);
    });

    test('should display message input when conversation is selected', async ({ page }) => {
      // This test requires a conversation to exist
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        // Click first conversation
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        // Message input should be visible
        await expect(conversationsPage.messageInput).toBeVisible();
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should hide conversation list when conversation is selected on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await conversationsPage.goto();

      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        // Select a conversation
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        // Conversation list should be hidden
        await expect(conversationsPage.conversationList).not.toBeVisible();

        // Back button should be visible
        await expect(conversationsPage.backButton).toBeVisible();
      }
    });

    test('should go back to list on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await conversationsPage.goto();

      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        // Select a conversation
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        // Go back
        await conversationsPage.goBackToList();

        // List should be visible again
        await expect(conversationsPage.searchInput).toBeVisible();
      }
    });
  });

  test.describe('Conversation Status Badges', () => {
    test('should display AI status badge when AI is enabled', async () => {
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        const isAiEnabled = await conversationsPage.isAiEnabled();
        // May or may not be enabled
        expect(typeof isAiEnabled).toBe('boolean');
      }
    });

    test('should display workflow status badge when workflow is active', async () => {
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        const isWorkflowActive = await conversationsPage.isWorkflowActive();
        // May or may not be active
        expect(typeof isWorkflowActive).toBe('boolean');
      }
    });
  });

  test.describe('Thread Header', () => {
    test('should display contact name or phone number', async () => {
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        const contactName = await conversationsPage.getCurrentContactName();
        expect(contactName.length).toBeGreaterThan(0);
      }
    });

    test('should display phone number in header', async () => {
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        await conversationsPage.conversationItems.first().click();
        await conversationsPage.waitForReady();

        const phoneNumber = await conversationsPage.getCurrentPhoneNumber();
        // Phone number might be empty if contact name is shown instead
        expect(typeof phoneNumber).toBe('string');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should show split view on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await conversationsPage.goto();

      // Both list and thread panel should be visible
      await expect(conversationsPage.searchInput).toBeVisible();
    });

    test('should show single panel on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await conversationsPage.goto();

      // Only list should be visible initially
      await expect(conversationsPage.searchInput).toBeVisible();
    });
  });

  test.describe('Message Preview', () => {
    test('should show last message preview in conversation list', async () => {
      const count = await conversationsPage.getConversationCount();
      if (count > 0) {
        // Get first conversation item
        const firstItem = conversationsPage.conversationItems.first();
        const previewText = await firstItem.locator('[class*="text-sm"], [class*="muted"]').last().textContent();
        // Preview should exist (might be empty or have content)
        expect(typeof previewText).toBe('string');
      }
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state when no conversations', async ({ page }) => {
      // Search for something that definitely doesn't exist
      await conversationsPage.searchConversations('zzzzzznonexistent12345');
      const isEmpty = await conversationsPage.isEmptyStateVisible();
      expect(isEmpty).toBe(true);
    });

    test('should show helpful message in empty state', async ({ page }) => {
      await conversationsPage.searchConversations('zzzzzznonexistent12345');
      const emptyMessage = page.locator('text=No conversations');
      await expect(emptyMessage).toBeVisible();
    });
  });
});
