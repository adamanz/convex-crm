import { test as setup } from '@playwright/test';

/**
 * Global setup that runs before all tests
 * This can be used to seed test data, authenticate, etc.
 */
setup('global setup', async ({ page }) => {
  console.log('Running global setup...');

  // Navigate to the app to ensure it's running
  await page.goto('/');

  // Wait for the app to load
  await page.waitForSelector('main, [role="main"], nav', { timeout: 60000 });

  console.log('Global setup complete. App is running.');

  // In a real app with authentication, you might:
  // 1. Login with a test user
  // 2. Save the authentication state
  // await page.context().storageState({ path: 'e2e/.auth/user.json' });

  // For now, we just verify the app is running
});
