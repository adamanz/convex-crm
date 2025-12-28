import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Conversations page (SMS/iMessage)
 */
export class ConversationsPage extends BasePage {
  // Page elements
  readonly searchInput: Locator;
  readonly conversationList: Locator;
  readonly conversationItems: Locator;
  readonly messageThread: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly backButton: Locator;
  readonly emptyState: Locator;
  readonly threadHeader: Locator;
  readonly aiStatusBadge: Locator;
  readonly workflowStatusBadge: Locator;

  constructor(page: Page) {
    super(page);

    // Conversation list panel
    this.searchInput = page.locator('input[placeholder*="search" i]');
    this.conversationList = page.locator('[class*="overflow-y-auto"]').filter({
      has: page.locator('[class*="cursor-pointer"]'),
    });
    this.conversationItems = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator('[class*="rounded-full"]'),
    });

    // Message thread panel
    this.messageThread = page.locator('[class*="flex-1"]').filter({
      has: page.locator('[class*="message"], [class*="bubble"]'),
    }).or(page.locator('[class*="messages"]'));
    this.messageInput = page.locator('textarea, input[type="text"]').filter({
      has: page.locator('[placeholder*="message" i]'),
    }).or(page.locator('textarea[placeholder*="message" i]'));
    this.sendButton = page.getByRole('button', { name: /send/i }).or(
      page.locator('button:has(svg[class*="Send"])').first()
    );
    this.backButton = page.locator('button').filter({ has: page.locator('svg') }).filter({
      has: page.locator('path[d*="15.75 19.5L8.25"]'),
    });
    this.emptyState = page.locator('text=No conversations').or(page.locator('text=Select a conversation'));
    this.threadHeader = page.locator('[class*="border-b"]').filter({
      has: page.locator('[class*="rounded-full"]'),
    }).first();
    this.aiStatusBadge = page.locator('text=AI Active').or(page.locator('[class*="purple"]').filter({
      hasText: 'AI',
    }));
    this.workflowStatusBadge = page.locator('text=Workflow').or(page.locator('[class*="blue"]').filter({
      hasText: 'Workflow',
    }));
  }

  /**
   * Navigate to conversations page
   */
  async goto(): Promise<void> {
    await this.page.goto('/conversations');
    await this.waitForReady();
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    // Wait for either conversations to load or empty state
    await Promise.race([
      this.searchInput.waitFor({ state: 'visible', timeout: 30000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 30000 }),
    ]);
    await super.waitForReady();
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for search debounce
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
   * Get conversation count
   */
  async getConversationCount(): Promise<number> {
    await super.waitForReady();
    return this.conversationItems.count();
  }

  /**
   * Select a conversation by contact name or phone number
   */
  async selectConversation(identifier: string): Promise<void> {
    const conversation = this.conversationItems.filter({ hasText: identifier });
    await conversation.first().click();
    await super.waitForReady();
  }

  /**
   * Check if a conversation is selected
   */
  async isConversationSelected(): Promise<boolean> {
    // On desktop, message thread should be visible
    // On mobile, we should have navigated away from the list
    const isMobile = await this.isMobileViewport();
    if (isMobile) {
      return this.backButton.isVisible();
    }
    return this.threadHeader.isVisible();
  }

  /**
   * Get messages in current thread
   */
  async getMessageCount(): Promise<number> {
    const messages = this.page.locator('[class*="message"], [class*="bubble"]').or(
      this.messageThread.locator('[class*="rounded-lg"]').filter({
        has: this.page.locator('p'),
      })
    );
    return messages.count();
  }

  /**
   * Send a message
   */
  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
    await super.waitForReady();
  }

  /**
   * Go back to conversation list (mobile)
   */
  async goBackToList(): Promise<void> {
    if (await this.backButton.isVisible()) {
      await this.backButton.click();
      await super.waitForReady();
    }
  }

  /**
   * Check if AI is enabled for current conversation
   */
  async isAiEnabled(): Promise<boolean> {
    return this.aiStatusBadge.isVisible();
  }

  /**
   * Check if workflow is active for current conversation
   */
  async isWorkflowActive(): Promise<boolean> {
    return this.workflowStatusBadge.isVisible();
  }

  /**
   * Get contact name from thread header
   */
  async getCurrentContactName(): Promise<string> {
    const nameElement = this.threadHeader.locator('h2, [class*="font-semibold"]').first();
    return (await nameElement.textContent()) || '';
  }

  /**
   * Get phone number from thread header
   */
  async getCurrentPhoneNumber(): Promise<string> {
    const phoneElement = this.threadHeader.locator('p, [class*="text-sm"]').filter({
      hasText: /\+?\d/,
    }).first();
    return (await phoneElement.textContent()) || '';
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Check if message thread empty state is visible
   */
  async isSelectConversationPromptVisible(): Promise<boolean> {
    return this.page.locator('text=Select a conversation').isVisible();
  }

  /**
   * Get last message preview from conversation list item
   */
  async getLastMessagePreview(identifier: string): Promise<string> {
    const conversation = this.conversationItems.filter({ hasText: identifier });
    const preview = conversation.locator('[class*="text-sm"], [class*="muted"]').last();
    return (await preview.textContent()) || '';
  }

  /**
   * Check if a conversation has unread messages
   */
  async hasUnreadMessages(identifier: string): Promise<boolean> {
    const conversation = this.conversationItems.filter({ hasText: identifier });
    const unreadIndicator = conversation.locator('[class*="bg-blue"], [class*="unread"]');
    return (await unreadIndicator.count()) > 0;
  }
}
