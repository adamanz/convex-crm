import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingComplete(page: Page, timeout = 15000): Promise<void> {
  // Wait for any skeleton loaders to disappear
  await page.waitForFunction(
    () => {
      const skeletons = document.querySelectorAll(
        '[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"], [class*="loading"]'
      );
      const spinners = document.querySelectorAll(
        '[class*="spinner"], [class*="Spinner"], .animate-spin, [class*="Loader"]'
      );
      return skeletons.length === 0 && spinners.length === 0;
    },
    { timeout }
  ).catch(() => {
    // Ignore timeout - some pages may not have loading states
  });

  // Small delay to ensure React has finished updating
  await page.waitForTimeout(100);
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    // Ignore timeout - Convex has persistent connections
  });
}

/**
 * Fill a form field by label
 */
export async function fillFormField(
  page: Page,
  labelText: string,
  value: string
): Promise<void> {
  const label = page.getByLabel(labelText, { exact: false });
  await label.fill(value);
}

/**
 * Click a button by text content
 */
export async function clickButton(page: Page, buttonText: string): Promise<void> {
  const button = page.getByRole('button', { name: buttonText, exact: false });
  await button.click();
}

/**
 * Wait for a toast notification to appear and optionally verify its message
 */
export async function waitForToast(page: Page, message?: string): Promise<Locator> {
  // Sonner toast library uses [data-sonner-toast] or similar
  const toastSelector = '[data-sonner-toast], [role="alert"], [class*="toast"]';
  const toast = page.locator(toastSelector).first();
  await expect(toast).toBeVisible({ timeout: 10000 });

  if (message) {
    await expect(toast).toContainText(message);
  }

  return toast;
}

/**
 * Dismiss any visible toast notifications
 */
export async function dismissToasts(page: Page): Promise<void> {
  const toasts = page.locator('[data-sonner-toast], [role="alert"], [class*="toast"]');
  const count = await toasts.count();

  for (let i = 0; i < count; i++) {
    const closeButton = toasts.nth(i).locator('button[aria-label*="close"], button[aria-label*="dismiss"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

/**
 * Wait for a dialog to open
 */
export async function waitForDialog(page: Page): Promise<Locator> {
  const dialog = page.locator('[role="dialog"], [class*="DialogContent"]');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

/**
 * Close a dialog
 */
export async function closeDialog(page: Page): Promise<void> {
  // Try various close button patterns
  const closeButton = page.locator(
    '[role="dialog"] button[aria-label*="close"], ' +
    '[role="dialog"] button[aria-label*="Close"], ' +
    '[class*="DialogContent"] button:has(svg[class*="X"]), ' +
    '[role="dialog"] button:first-child'
  ).first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Press Escape as fallback
    await page.keyboard.press('Escape');
  }

  // Wait for dialog to close
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
}

/**
 * Select an option from a dropdown (Radix Select)
 */
export async function selectOption(
  page: Page,
  triggerLabel: string,
  optionText: string
): Promise<void> {
  // Click the trigger
  const trigger = page.getByRole('combobox', { name: triggerLabel }).or(
    page.locator(`[data-testid="${triggerLabel}"]`)
  );
  await trigger.click();

  // Wait for dropdown content
  const content = page.locator('[role="listbox"]');
  await expect(content).toBeVisible({ timeout: 5000 });

  // Click the option
  const option = content.getByRole('option', { name: optionText, exact: false });
  await option.click();

  // Wait for dropdown to close
  await expect(content).not.toBeVisible({ timeout: 5000 });
}

/**
 * Search in a search input and wait for results
 */
export async function performSearch(
  page: Page,
  searchText: string,
  inputSelector = 'input[placeholder*="search" i], input[placeholder*="Search"]'
): Promise<void> {
  const searchInput = page.locator(inputSelector);
  await searchInput.fill(searchText);

  // Wait for search to complete
  await waitForLoadingComplete(page);
}

/**
 * Clear a search input
 */
export async function clearSearch(page: Page): Promise<void> {
  const clearButton = page.locator('button:has(svg[class*="X"]), button[aria-label*="clear"]').first();

  if (await clearButton.isVisible()) {
    await clearButton.click();
  } else {
    // Clear by selecting all and deleting
    const searchInput = page.locator('input[placeholder*="search" i]');
    await searchInput.clear();
  }

  await waitForLoadingComplete(page);
}

/**
 * Get the current count of items in a list
 */
export async function getListItemCount(page: Page, listSelector: string): Promise<number> {
  await waitForLoadingComplete(page);
  const items = page.locator(`${listSelector} > *`);
  return items.count();
}

/**
 * Navigate using the sidebar
 */
export async function navigateViaSidebar(page: Page, linkText: string): Promise<void> {
  const sidebarLink = page.locator('nav, [class*="sidebar"]').getByRole('link', { name: linkText, exact: false });
  await sidebarLink.click();
  await waitForLoadingComplete(page);
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeNamedScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png`, fullPage: true });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(locator: Locator): Promise<boolean> {
  const boundingBox = await locator.boundingBox();
  if (!boundingBox) return false;

  const viewportSize = await locator.page().viewportSize();
  if (!viewportSize) return false;

  return (
    boundingBox.x >= 0 &&
    boundingBox.y >= 0 &&
    boundingBox.x + boundingBox.width <= viewportSize.width &&
    boundingBox.y + boundingBox.height <= viewportSize.height
  );
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(200); // Allow scroll animation to complete
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create test data with unique identifiers
 */
export function createTestData<T extends Record<string, unknown>>(
  baseData: T,
  uniqueFields: (keyof T)[]
): T {
  const uniqueSuffix = generateTestId();
  const result = { ...baseData };

  for (const field of uniqueFields) {
    if (typeof result[field] === 'string') {
      (result[field] as string) = `${result[field]}-${uniqueSuffix}`;
    }
  }

  return result;
}

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(page: Page, pattern: string | RegExp): Promise<void> {
  await page.waitForURL(pattern, { timeout: 10000 });
}

/**
 * Check if page has any console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Assert no console errors on page
 */
export async function assertNoConsoleErrors(page: Page, errors: string[]): Promise<void> {
  // Filter out expected errors (like network errors in test environment)
  const unexpectedErrors = errors.filter(
    (error) =>
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR') &&
      !error.includes('[Fast Refresh]')
  );

  expect(unexpectedErrors).toHaveLength(0);
}
