import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Task data interface
 */
export interface TaskFormData {
  subject: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  relatedToType?: 'contact' | 'company' | 'deal';
  relatedToId?: string;
}

/**
 * Note data interface
 */
export interface NoteFormData {
  subject: string;
  description?: string;
  relatedToType?: 'contact' | 'company' | 'deal';
  relatedToId?: string;
}

/**
 * Page Object for the Activities page
 */
export class ActivitiesPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly addTaskButton: Locator;
  readonly addNoteButton: Locator;
  readonly activityTabs: Locator;
  readonly dateFilter: Locator;
  readonly activityTimeline: Locator;
  readonly activityItems: Locator;
  readonly upcomingTasksSidebar: Locator;
  readonly loadMoreButton: Locator;
  readonly emptyState: Locator;

  // Task Form elements
  readonly taskForm: Locator;
  readonly taskSubjectInput: Locator;
  readonly taskDescriptionInput: Locator;
  readonly taskDueDateInput: Locator;
  readonly taskPrioritySelect: Locator;

  // Note Form elements
  readonly noteForm: Locator;
  readonly noteSubjectInput: Locator;
  readonly noteDescriptionInput: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Activities")');
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.addNoteButton = page.getByRole('button', { name: /add note/i });
    this.activityTabs = page.locator('[role="tablist"]');
    this.dateFilter = page.locator('[role="combobox"]').filter({
      has: page.locator('text=All time, text=Today, text=week'),
    });
    this.activityTimeline = page.locator('[class*="relative"]').filter({
      has: page.locator('[class*="absolute"][class*="h-full"]'),
    });
    this.activityItems = page.locator('[class*="activity"], [data-testid="activity-item"]');
    this.upcomingTasksSidebar = page.locator('[class*="border-l"]').filter({
      has: page.locator('text=Upcoming Tasks'),
    });
    this.loadMoreButton = page.getByRole('button', { name: /load more/i });
    this.emptyState = page.locator('text=No activities found').or(page.locator('text=No activities'));

    // Task Form elements
    this.taskForm = page.locator('[role="dialog"]').filter({
      has: page.locator('text=Create Task'),
    });
    this.taskSubjectInput = page.getByLabel(/subject/i);
    this.taskDescriptionInput = page.getByLabel(/description/i);
    this.taskDueDateInput = page.getByLabel(/due date/i);
    this.taskPrioritySelect = page.locator('[role="combobox"]').filter({
      has: page.locator('text=Priority'),
    });

    // Note Form elements
    this.noteForm = page.locator('[role="dialog"]').filter({
      has: page.locator('text=Add Quick Note'),
    });
    this.noteSubjectInput = this.noteForm.getByLabel(/subject/i);
    this.noteDescriptionInput = this.noteForm.getByLabel(/description|content|note/i);
  }

  /**
   * Navigate to activities page
   */
  async goto(): Promise<void> {
    await this.page.goto('/activities');
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
   * Open add task dialog
   */
  async openAddTaskDialog(): Promise<void> {
    await this.addTaskButton.click();
    await expect(this.page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Open add note dialog
   */
  async openAddNoteDialog(): Promise<void> {
    await this.addNoteButton.click();
    await expect(this.page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close any open dialog
   */
  async closeDialog(): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      await this.page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Fill task form
   */
  async fillTaskForm(data: TaskFormData): Promise<void> {
    await this.taskSubjectInput.fill(data.subject);
    if (data.description) {
      await this.taskDescriptionInput.fill(data.description);
    }
    if (data.priority) {
      await this.taskPrioritySelect.click();
      await this.page.locator('[role="option"]').filter({
        hasText: new RegExp(data.priority, 'i'),
      }).click();
    }
  }

  /**
   * Create a new task
   */
  async createTask(data: TaskFormData): Promise<void> {
    await this.openAddTaskDialog();
    await this.fillTaskForm(data);

    const submitButton = this.page.locator('[role="dialog"]').getByRole('button', { name: /create|save|add/i });
    await submitButton.click();
    await expect(this.page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill note form
   */
  async fillNoteForm(data: NoteFormData): Promise<void> {
    await this.noteSubjectInput.fill(data.subject);
    if (data.description) {
      await this.noteDescriptionInput.fill(data.description);
    }
  }

  /**
   * Create a new note
   */
  async createNote(data: NoteFormData): Promise<void> {
    await this.openAddNoteDialog();
    await this.fillNoteForm(data);

    const submitButton = this.page.locator('[role="dialog"]').getByRole('button', { name: /create|save|add/i });
    await submitButton.click();
    await expect(this.page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Switch to a specific activity tab
   */
  async switchToTab(tabName: 'All' | 'Tasks' | 'Calls' | 'Emails' | 'Meetings' | 'Notes'): Promise<void> {
    const tab = this.activityTabs.getByRole('tab', { name: tabName, exact: false });
    await tab.click();
    await super.waitForReady();
  }

  /**
   * Filter by date range
   */
  async filterByDateRange(range: 'All time' | 'Today' | 'This week' | 'This month'): Promise<void> {
    await this.dateFilter.click();
    await this.page.locator('[role="option"]').filter({ hasText: range }).click();
    await super.waitForReady();
  }

  /**
   * Get activity count
   */
  async getActivityCount(): Promise<number> {
    await super.waitForReady();
    return this.activityItems.count();
  }

  /**
   * Check if an activity exists
   */
  async hasActivity(subjectText: string): Promise<boolean> {
    await super.waitForReady();
    const activity = this.page.locator(`text=${subjectText}`);
    return (await activity.count()) > 0;
  }

  /**
   * Mark a task as complete
   */
  async completeTask(subject: string): Promise<void> {
    const taskItem = this.activityItems.filter({ hasText: subject });
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]');
    await checkbox.check();
    await super.waitForReady();
  }

  /**
   * Mark a task as incomplete (reopen)
   */
  async reopenTask(subject: string): Promise<void> {
    const taskItem = this.activityItems.filter({ hasText: subject });
    const checkbox = taskItem.locator('input[type="checkbox"], [role="checkbox"]');
    await checkbox.uncheck();
    await super.waitForReady();
  }

  /**
   * Load more activities
   */
  async loadMore(): Promise<void> {
    if (await this.loadMoreButton.isVisible()) {
      await this.loadMoreButton.click();
      await super.waitForReady();
    }
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Get upcoming tasks from sidebar
   */
  async getUpcomingTasksCount(): Promise<number> {
    const isMobile = await this.isMobileViewport();
    if (isMobile) {
      return 0; // Sidebar is hidden on mobile
    }
    const tasks = this.upcomingTasksSidebar.locator('[class*="rounded-lg"][class*="border"]');
    return tasks.count();
  }

  /**
   * Click on an activity to expand/view details
   */
  async expandActivity(subject: string): Promise<void> {
    const activity = this.activityItems.filter({ hasText: subject });
    await activity.click();
    await super.waitForReady();
  }

  /**
   * View all tasks from sidebar
   */
  async viewAllTasksFromSidebar(): Promise<void> {
    const viewAllButton = this.upcomingTasksSidebar.getByRole('button', { name: /view all tasks/i });
    await viewAllButton.click();
    // Should switch to tasks tab
    await expect(this.activityTabs.getByRole('tab', { name: /tasks/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  }
}
