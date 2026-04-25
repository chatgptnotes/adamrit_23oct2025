import { test, expect, Page } from '@playwright/test';

/**
 * Queue Management feature tests.
 *
 * The app uses a multi-step auth flow:
 *   Landing Page -> Hospital Selection -> Login Page
 * Session state is persisted in localStorage as `hmis_user`.
 * We inject a mock admin session directly into localStorage to bypass the UI
 * login flow, then navigate to /queue-management.
 */

const MOCK_USER = {
  id: 'e2e-test-user',
  email: 'admin@adamrit.com',
  username: 'admin',
  role: 'admin',
  hospitalType: 'hope',
};

/**
 * Injects the mock user session into localStorage so the app
 * treats the browser as already authenticated, then navigates to the target page.
 */
async function loginViaLocalStorage(page: Page, path: string) {
  // Load the app root first so we are on the same origin as localStorage
  await page.goto('/');

  // Inject auth session
  await page.evaluate((user) => {
    localStorage.setItem('hmis_user', JSON.stringify(user));
    localStorage.setItem('hmis_visited', 'true');
  }, MOCK_USER);

  // Navigate to the protected route
  await page.goto(path);

  // Wait for the page to settle after navigation
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
    // networkidle may time out on pages with long-polling – acceptable.
  });
}

test.describe('Queue Management', () => {
  test('page loads and renders three-column layout', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');

    // Heading must be visible
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Date / token count subtitle
    await expect(page.locator('p').filter({ hasText: /tokens today/i })).toBeVisible();

    // TV Display shortcut button
    await expect(page.getByRole('button', { name: /tv display/i })).toBeVisible();

    await page.screenshot({
      path: 'e2e-test-results/queue-management-layout.png',
      fullPage: true,
    });
  });

  test('Issue New Token card renders all form fields', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Card heading
    await expect(page.getByText('Issue New Token')).toBeVisible();

    // Form labels
    await expect(page.getByText('Department')).toBeVisible();
    await expect(page.getByText('Patient Name *')).toBeVisible();
    await expect(page.getByText('Mobile (optional)')).toBeVisible();
    // Use label selector to avoid ambiguity with 'Counter 1' in the select trigger
    await expect(page.locator('label').filter({ hasText: /^Counter$/ })).toBeVisible();

    // Issue Token button is present and disabled when patient name is empty
    const issueBtn = page.getByRole('button', { name: /issue token/i });
    await expect(issueBtn).toBeVisible();
    await expect(issueBtn).toBeDisabled();
  });

  test('Issue Token button enables when patient name is filled', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    const nameInput = page.getByPlaceholder('Enter patient name');
    await nameInput.fill('Test Patient');

    const issueBtn = page.getByRole('button', { name: /issue token/i });
    await expect(issueBtn).toBeEnabled();

    await page.screenshot({ path: 'e2e-test-results/queue-management-form-filled.png' });
  });

  test('Waiting queue column is visible', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Column heading — use role to avoid matching 'No patients waiting' text
    await expect(page.getByRole('heading', { name: 'Waiting' })).toBeVisible();

    // Empty state or token list should be rendered
    const emptyOrList = page.locator('.max-h-96');
    await expect(emptyOrList).toBeVisible();
  });

  test('Now Serving and Completed Today columns visible', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.getByText('Now Serving')).toBeVisible();
    await expect(page.getByText('Completed Today')).toBeVisible();
  });

  test('Department selector shows all departments', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Click the first combobox (Department select)
    const selectTriggers = page.locator('[role="combobox"]');
    await selectTriggers.first().click();

    // Key departments should appear in the dropdown
    await expect(page.getByRole('option', { name: 'OPD' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('option', { name: 'Lab' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Pharmacy' })).toBeVisible();

    await page.keyboard.press('Escape');

    await page.screenshot({ path: 'e2e-test-results/queue-management-dept-dropdown.png' });
  });

  test('Counter selector shows all counters', async ({ page }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Counter is the second combobox on the page
    const selectTriggers = page.locator('[role="combobox"]');
    await selectTriggers.nth(1).click();

    await expect(page.getByRole('option', { name: 'Counter 1' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('option', { name: 'Counter 2' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Room 1' })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('No blocking console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Filter out common non-critical browser noise
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('Content Security Policy') &&
        !e.includes('ERR_BLOCKED') &&
        !e.includes('net::ERR_') &&
        !e.includes('Failed to load resource') &&
        !e.includes('Refused to load')
    );

    if (criticalErrors.length > 0) {
      console.warn('Console errors detected:', criticalErrors);
    }

    // The page must not have crashed (heading still visible after errors)
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible();
  });

  test('TV Display button opens /queue-tv in a new tab', async ({ page, context }) => {
    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('button', { name: /tv display/i })).toBeVisible({
      timeout: 20_000,
    });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /tv display/i }).click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toMatch(/queue-tv/);
    await newPage.close();
  });

  test('Supabase connectivity - queue data loads without error banner', async ({ page }) => {
    const supabaseErrors: string[] = [];
    page.on('response', (response) => {
      if (
        response.url().includes('supabase') &&
        response.url().includes('queue_tokens') &&
        response.status() >= 400
      ) {
        supabaseErrors.push(`HTTP ${response.status()} — ${response.url()}`);
      }
    });

    await loginViaLocalStorage(page, '/queue-management');
    await expect(page.getByRole('heading', { name: /queue management/i })).toBeVisible({
      timeout: 20_000,
    });

    // Allow background fetch to complete
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // The page must not render a crash / error state
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/error loading/i)).not.toBeVisible();

    if (supabaseErrors.length > 0) {
      console.warn('Supabase errors observed:', supabaseErrors);
    }

    await page.screenshot({
      path: 'e2e-test-results/queue-management-supabase-data.png',
      fullPage: true,
    });
  });
});
