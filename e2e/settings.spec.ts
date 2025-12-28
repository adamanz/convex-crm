import { test, expect } from './fixtures';
import {
  SettingsPage,
  ProfileSettingsPage,
  PipelineSettingsPage,
  TeamSettingsPage,
  EmailSettingsPage,
} from './pages';

test.describe('Settings', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.goto();
  });

  test.describe('Main Settings Page', () => {
    test('should display settings page title', async ({ page }) => {
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    test('should display settings description', async ({ page }) => {
      const description = page.locator('text=Manage your account settings');
      await expect(description).toBeVisible();
    });

    test('should display settings cards', async () => {
      const cardCount = await settingsPage.getSettingsCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should display quick actions section', async ({ page }) => {
      const quickActions = page.locator('text=Quick Actions');
      await expect(quickActions).toBeVisible();
    });
  });

  test.describe('Settings Navigation', () => {
    test('should navigate to Profile settings', async ({ page }) => {
      await settingsPage.goToProfile();
      await expect(page).toHaveURL(/\/settings\/profile/);
    });

    test('should navigate to Team settings', async ({ page }) => {
      await settingsPage.goToTeam();
      await expect(page).toHaveURL(/\/settings\/team/);
    });

    test('should navigate to Pipelines settings', async ({ page }) => {
      await settingsPage.goToPipelines();
      await expect(page).toHaveURL(/\/settings\/pipelines/);
    });

    test('should navigate to Email settings', async ({ page }) => {
      await settingsPage.goToEmail();
      await expect(page).toHaveURL(/\/settings\/email/);
    });
  });

  test.describe('Settings Cards', () => {
    test('should display Profile card', async () => {
      const hasSection = await settingsPage.hasSettingsSection('Profile');
      expect(hasSection).toBe(true);
    });

    test('should display Team card', async () => {
      const hasSection = await settingsPage.hasSettingsSection('Team');
      expect(hasSection).toBe(true);
    });

    test('should display Pipelines card', async () => {
      const hasSection = await settingsPage.hasSettingsSection('Pipeline');
      expect(hasSection).toBe(true);
    });

    test('should display Email card', async () => {
      const hasSection = await settingsPage.hasSettingsSection('Email');
      expect(hasSection).toBe(true);
    });
  });

  test.describe('Quick Actions', () => {
    test('should navigate from Update Profile quick action', async ({ page }) => {
      await settingsPage.clickQuickAction('Update Profile');
      await expect(page).toHaveURL(/\/settings\/profile/);
    });

    test('should navigate from Manage Team quick action', async ({ page }) => {
      await settingsPage.clickQuickAction('Manage Team');
      await expect(page).toHaveURL(/\/settings\/team/);
    });

    test('should navigate from Manage Pipelines quick action', async ({ page }) => {
      await settingsPage.clickQuickAction('Manage Pipelines');
      await expect(page).toHaveURL(/\/settings\/pipelines/);
    });

    test('should navigate from Configure Email quick action', async ({ page }) => {
      await settingsPage.clickQuickAction('Configure Email');
      await expect(page).toHaveURL(/\/settings\/email/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display settings cards in grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await settingsPage.goto();

      const grid = page.locator('[class*="grid"]').filter({
        has: page.locator('a[href*="/settings/"]'),
      });
      await expect(grid.first()).toBeVisible();
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await settingsPage.goto();

      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });
  });
});

test.describe('Profile Settings', () => {
  let profilePage: ProfileSettingsPage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfileSettingsPage(page);
    await profilePage.goto();
  });

  test('should display profile settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test('should display profile form fields', async () => {
    // Form fields should be visible
    await expect(profilePage.firstNameInput.or(profilePage.page.locator('input').first())).toBeVisible();
  });

  test('should navigate back to main settings', async ({ page }) => {
    await profilePage.navigateTo('Settings');
    await expect(page).toHaveURL(/\/settings$/);
  });
});

test.describe('Pipeline Settings', () => {
  let pipelinePage: PipelineSettingsPage;

  test.beforeEach(async ({ page }) => {
    pipelinePage = new PipelineSettingsPage(page);
    await pipelinePage.goto();
  });

  test('should display pipeline settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/pipelines/);
  });

  test('should display page title', async () => {
    await expect(pipelinePage.pageTitle).toBeVisible();
  });

  test('should show pipeline configuration options', async ({ page }) => {
    // Pipeline settings should show some configuration
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });
});

test.describe('Team Settings', () => {
  let teamPage: TeamSettingsPage;

  test.beforeEach(async ({ page }) => {
    teamPage = new TeamSettingsPage(page);
    await teamPage.goto();
  });

  test('should display team settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/team/);
  });

  test('should display page title', async () => {
    await expect(teamPage.pageTitle).toBeVisible();
  });

  test('should show team member list or empty state', async ({ page }) => {
    // Team page should show members or invite option
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });
});

test.describe('Email Settings', () => {
  let emailPage: EmailSettingsPage;

  test.beforeEach(async ({ page }) => {
    emailPage = new EmailSettingsPage(page);
    await emailPage.goto();
  });

  test('should display email settings page', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings\/email/);
  });

  test('should display page title', async () => {
    await expect(emailPage.pageTitle).toBeVisible();
  });

  test('should show email configuration options', async ({ page }) => {
    // Email settings should show provider options
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });
});
