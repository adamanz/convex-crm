import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Settings pages
 */
export class SettingsPage extends BasePage {
  // Main settings page elements
  readonly pageTitle: Locator;
  readonly settingsCards: Locator;
  readonly quickActions: Locator;

  // Navigation cards
  readonly profileCard: Locator;
  readonly teamCard: Locator;
  readonly pipelinesCard: Locator;
  readonly emailCard: Locator;

  // Settings sidebar
  readonly settingsSidebar: Locator;

  constructor(page: Page) {
    super(page);

    // Main page elements
    this.pageTitle = page.locator('h1:has-text("Settings")');
    this.settingsCards = page.locator('[class*="grid"]').locator('[class*="card"], a').filter({
      has: page.locator('h3, [class*="CardTitle"]'),
    });
    this.quickActions = page.locator('text=Quick Actions').locator('..').locator('..');

    // Navigation cards
    this.profileCard = page.locator('a[href*="/settings/profile"]');
    this.teamCard = page.locator('a[href*="/settings/team"]');
    this.pipelinesCard = page.locator('a[href*="/settings/pipelines"]');
    this.emailCard = page.locator('a[href*="/settings/email"]');

    // Settings sidebar (for sub-pages)
    this.settingsSidebar = page.locator('nav, [class*="sidebar"]').filter({
      has: page.locator('a[href*="/settings/"]'),
    });
  }

  /**
   * Navigate to settings page
   */
  async goto(): Promise<void> {
    await this.page.goto('/settings');
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
   * Navigate to profile settings
   */
  async goToProfile(): Promise<void> {
    await this.profileCard.click();
    await this.page.waitForURL(/\/settings\/profile/);
    await super.waitForReady();
  }

  /**
   * Navigate to team settings
   */
  async goToTeam(): Promise<void> {
    await this.teamCard.click();
    await this.page.waitForURL(/\/settings\/team/);
    await super.waitForReady();
  }

  /**
   * Navigate to pipeline settings
   */
  async goToPipelines(): Promise<void> {
    await this.pipelinesCard.click();
    await this.page.waitForURL(/\/settings\/pipelines/);
    await super.waitForReady();
  }

  /**
   * Navigate to email settings
   */
  async goToEmail(): Promise<void> {
    await this.emailCard.click();
    await this.page.waitForURL(/\/settings\/email/);
    await super.waitForReady();
  }

  /**
   * Get settings card count
   */
  async getSettingsCardCount(): Promise<number> {
    return this.settingsCards.count();
  }

  /**
   * Click a quick action
   */
  async clickQuickAction(actionName: string): Promise<void> {
    const action = this.quickActions.getByRole('link', { name: actionName, exact: false });
    await action.click();
    await super.waitForReady();
  }

  /**
   * Check if a settings section is available
   */
  async hasSettingsSection(sectionName: string): Promise<boolean> {
    const section = this.settingsCards.filter({ hasText: sectionName });
    return (await section.count()) > 0;
  }
}

/**
 * Page Object for the Profile Settings page
 */
export class ProfileSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly avatarUpload: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Profile"), h2:has-text("Profile")');
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.avatarUpload = page.locator('input[type="file"]');
    this.saveButton = page.getByRole('button', { name: /save/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/profile');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 30000 });
    await super.waitForReady();
  }

  async updateProfile(data: { firstName?: string; lastName?: string }): Promise<void> {
    if (data.firstName) {
      await this.firstNameInput.fill(data.firstName);
    }
    if (data.lastName) {
      await this.lastNameInput.fill(data.lastName);
    }
    await this.saveButton.click();
    await this.waitForSuccessToast();
  }
}

/**
 * Page Object for the Pipeline Settings page
 */
export class PipelineSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly pipelineList: Locator;
  readonly addPipelineButton: Locator;
  readonly stageList: Locator;
  readonly addStageButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Pipeline"), h2:has-text("Pipeline")');
    this.pipelineList = page.locator('[class*="list"], [data-testid="pipeline-list"]');
    this.addPipelineButton = page.getByRole('button', { name: /add pipeline|new pipeline/i });
    this.stageList = page.locator('[class*="stage"], [data-testid="stage-list"]');
    this.addStageButton = page.getByRole('button', { name: /add stage|new stage/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/pipelines');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 30000 });
    await super.waitForReady();
  }

  async getPipelineCount(): Promise<number> {
    const pipelines = this.page.locator('[class*="card"], [data-testid="pipeline-item"]');
    return pipelines.count();
  }
}

/**
 * Page Object for the Team Settings page
 */
export class TeamSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly teamMemberList: Locator;
  readonly inviteButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Team"), h2:has-text("Team")');
    this.teamMemberList = page.locator('[class*="list"], [data-testid="team-list"]');
    this.inviteButton = page.getByRole('button', { name: /invite|add member/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/team');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 30000 });
    await super.waitForReady();
  }

  async getTeamMemberCount(): Promise<number> {
    const members = this.page.locator('[class*="member"], [data-testid="team-member"]');
    return members.count();
  }
}

/**
 * Page Object for the Email Settings page
 */
export class EmailSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly providerSelect: Locator;
  readonly smtpHostInput: Locator;
  readonly smtpPortInput: Locator;
  readonly saveButton: Locator;
  readonly testButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Email"), h2:has-text("Email")');
    this.providerSelect = page.locator('[role="combobox"]').filter({
      has: page.locator('text=provider'),
    });
    this.smtpHostInput = page.getByLabel(/host/i);
    this.smtpPortInput = page.getByLabel(/port/i);
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.testButton = page.getByRole('button', { name: /test/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/email');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 30000 });
    await super.waitForReady();
  }

  async selectProvider(provider: string): Promise<void> {
    await this.providerSelect.click();
    await this.page.locator('[role="option"]').filter({ hasText: provider }).click();
    await super.waitForReady();
  }
}
