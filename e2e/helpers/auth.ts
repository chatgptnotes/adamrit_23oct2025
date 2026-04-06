import { Page } from '@playwright/test';

/**
 * Login helper for Adamrit Hospital Management System.
 *
 * Credentials are read from environment variables so they are never
 * hardcoded in source. Set them before running:
 *
 *   export E2E_EMAIL=admin@adamrit.com
 *   export E2E_PASSWORD=yourpassword
 *
 * Or create an .env.test file and load it via dotenv in the playwright config.
 */
export const TEST_EMAIL = process.env.E2E_EMAIL || '';
export const TEST_PASSWORD = process.env.E2E_PASSWORD || '';

/**
 * Performs login via the LoginPage form.
 * Waits for the dashboard to appear before returning.
 */
export async function login(page: Page): Promise<void> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      'E2E_EMAIL and E2E_PASSWORD environment variables must be set before running tests.'
    );
  }

  // The app redirects unauthenticated requests to /login.
  await page.goto('/');
  await page.waitForURL(/\/(login|$)/, { timeout: 15_000 });

  // If already on the dashboard (session preserved), skip re-login.
  if (!page.url().includes('login')) {
    return;
  }

  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Password').first().fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait until redirected away from /login
  await page.waitForURL((url) => !url.pathname.includes('login'), {
    timeout: 20_000,
  });
}

/**
 * Navigates to a protected page, performing login first if required.
 */
export async function gotoProtected(page: Page, path: string): Promise<void> {
  await page.goto(path);

  // If the app redirected to login, authenticate and then navigate again.
  if (page.url().includes('login')) {
    await login(page);
    await page.goto(path);
  }

  // Give the page time to finish rendering after navigation.
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
    // networkidle can time out on pages with long-polling — that is fine.
  });
}
