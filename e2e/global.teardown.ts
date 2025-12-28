import { test as teardown } from '@playwright/test';

/**
 * Global teardown that runs after all tests
 * This can be used to clean up test data, close connections, etc.
 */
teardown('global teardown', async ({}) => {
  console.log('Running global teardown...');

  // In a real app, you might:
  // 1. Clean up test data created during tests
  // 2. Reset database state
  // 3. Clear caches

  console.log('Global teardown complete.');
});
