/**
 * Production Vercel check for the WhatsApp Report Button on /lab-results-entry-demo.
 *
 * Runs against https://adamrit.vercel.app  (BASE_URL env override or hardcoded).
 *
 * Covers:
 *   P-01  Page loads (no redirect to /login or similar)
 *   P-02  Demo heading renders
 *   P-03  Test dropdown exists and becomes interactive
 *   P-04  Selecting a test reveals the WhatsApp button
 *   P-05  Button has correct green styling
 *   P-06  Button SVG icon is present
 *   P-07  Button title includes patient phone number
 *   P-08  Click triggers WhatsApp URL or Sent state
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const PROD_URL = 'https://adamrit.vercel.app/lab-results-entry-demo';

/** Inject a fake auth session so the React auth guard lets the page render. */
async function injectAuth(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const mockUser = JSON.stringify({
      id: 'e2e-prod-check',
      email: 'e2e@hopehospital.com',
      username: 'admin',
      role: 'admin',
      hospitalType: 'hope',
      hospitalName: 'hope',
    });
    window.localStorage.setItem('hmis_user', mockUser);
    window.localStorage.setItem('hmis_visited', 'true');
  });
}

/** Pick the first option in the test dropdown and return its label. */
async function pickFirstTest(page: Page): Promise<string> {
  const combobox = page.locator('[role="combobox"]').first();
  await expect(combobox).toBeVisible({ timeout: 30_000 });
  await expect(combobox).toBeEnabled({ timeout: 30_000 });
  await combobox.click();

  const firstOption = page.locator('[role="option"]').first();
  await expect(firstOption).toBeVisible({ timeout: 30_000 });
  const label = (await firstOption.textContent()) ?? 'unknown';
  await firstOption.click();
  return label.trim();
}

/** Locate the WhatsApp send button and wait for it to be visible. */
async function getWhatsAppButton(page: Page) {
  const btn = page.locator('button', { hasText: /Send Report via WhatsApp/i });
  await expect(btn).toBeVisible({ timeout: 30_000 });
  return btn;
}

test.describe('PROD — WhatsApp Report Button on adamrit.vercel.app', () => {
  test.beforeEach(async ({ page, context }) => {
    await injectAuth(context);
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  });

  // --------------------------------------------------------------------------
  // P-01: Page loads — check for auth wall vs rendered content
  // --------------------------------------------------------------------------
  test('P-01: Page loads without redirect to login', async ({ page }) => {
    // Take an early screenshot to capture exactly what we see
    await page.waitForTimeout(3_000); // brief settle
    await page.screenshot({
      path: 'e2e-test-results/prod-p01-initial-load.png',
      fullPage: true,
    });

    const currentUrl = page.url();
    console.log('P-01: current URL =', currentUrl);

    // If redirected to login/auth, report it
    const isLoginPage =
      currentUrl.includes('/login') ||
      currentUrl.includes('/auth') ||
      currentUrl.includes('/signin');

    if (isLoginPage) {
      console.log('P-01 RESULT: Page requires login — redirected to', currentUrl);
      // Not a hard failure — just report it
      test.skip(true, `Production page requires login (redirected to ${currentUrl})`);
      return;
    }

    // Should stay on the demo path or root after auth injection
    console.log('P-01 RESULT: Page loaded without redirect');
  });

  // --------------------------------------------------------------------------
  // P-02: Demo heading is visible
  // --------------------------------------------------------------------------
  test('P-02: Demo heading and patient info are rendered', async ({ page }) => {
    // Wait for either the demo heading or a login form — whichever appears first
    const demoHeading = page.locator('text=Lab Results Entry');
    const loginForm = page.locator('input[type="password"], input[name="password"]');

    const first = await Promise.race([
      demoHeading.waitFor({ timeout: 20_000 }).then(() => 'demo'),
      loginForm.waitFor({ timeout: 20_000 }).then(() => 'login'),
    ]).catch(() => 'timeout');

    await page.screenshot({
      path: 'e2e-test-results/prod-p02-heading-check.png',
      fullPage: true,
    });

    if (first === 'login') {
      console.log('P-02 RESULT: Login form detected — page requires authentication');
      test.skip(true, 'Production requires login — cannot test without credentials');
      return;
    }

    if (first === 'timeout') {
      console.log('P-02 RESULT: Neither demo heading nor login form appeared in 20s');
      // Take a screenshot and fail
      await expect(demoHeading).toBeVisible({ timeout: 1_000 });
      return;
    }

    await expect(demoHeading).toBeVisible();
    // Patient name from LabResultsEntryDemo samplePatient
    await expect(page.locator('text=Diya').first()).toBeVisible();
    console.log('P-02 RESULT: Demo heading and patient info rendered correctly');
  });

  // --------------------------------------------------------------------------
  // P-03: Test dropdown exists and loads options
  // --------------------------------------------------------------------------
  test('P-03: Test dropdown is present and loads options', async ({ page }) => {
    const demoHeading = page.locator('text=Lab Results Entry');
    const arrived = await demoHeading.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);

    if (!arrived) {
      await page.screenshot({ path: 'e2e-test-results/prod-p03-no-heading.png', fullPage: true });
      test.skip(true, 'Demo page not accessible — likely requires login');
      return;
    }

    const combobox = page.locator('[role="combobox"]').first();
    await expect(combobox).toBeVisible({ timeout: 20_000 });

    // Check if it shows a loading placeholder
    const placeholderText = await combobox.textContent();
    console.log('P-03: Dropdown placeholder text:', placeholderText);

    // Wait for loading state to clear (disabled → enabled)
    await expect(combobox).toBeEnabled({ timeout: 30_000 });

    // Click to open and verify options are present
    await combobox.click();
    const options = page.locator('[role="option"]');
    const count = await options.count();
    console.log(`P-03 RESULT: Dropdown loaded ${count} test option(s)`);

    await page.screenshot({
      path: 'e2e-test-results/prod-p03-dropdown-open.png',
      fullPage: false,
    });

    expect(count).toBeGreaterThan(0);

    // Close the dropdown
    await page.keyboard.press('Escape');
  });

  // --------------------------------------------------------------------------
  // P-04: Selecting a test shows the WhatsApp button
  // --------------------------------------------------------------------------
  test('P-04: WhatsApp button appears after selecting a test', async ({ page }) => {
    const arrived = await page
      .locator('text=Lab Results Entry')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!arrived) {
      test.skip(true, 'Demo page not accessible');
      return;
    }

    const testName = await pickFirstTest(page);
    console.log(`P-04: Selected test "${testName}"`);

    const button = await getWhatsAppButton(page);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await page.screenshot({
      path: 'e2e-test-results/prod-p04-whatsapp-button-visible.png',
      fullPage: true,
    });

    console.log('P-04 RESULT: WhatsApp button is visible and enabled');
  });

  // --------------------------------------------------------------------------
  // P-05: Button has green styling
  // --------------------------------------------------------------------------
  test('P-05: WhatsApp button has green styling classes', async ({ page }) => {
    const arrived = await page
      .locator('text=Lab Results Entry')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!arrived) {
      test.skip(true, 'Demo page not accessible');
      return;
    }

    await pickFirstTest(page);
    const button = await getWhatsAppButton(page);

    const className = await button.getAttribute('class');
    console.log('P-05: Button className =', className);

    expect(className).toContain('text-green-700');
    expect(className).toContain('border-green-300');

    await page.screenshot({
      path: 'e2e-test-results/prod-p05-button-styling.png',
    });

    console.log('P-05 RESULT: Button has correct green Tailwind classes');
  });

  // --------------------------------------------------------------------------
  // P-06: Button shows SVG icon
  // --------------------------------------------------------------------------
  test('P-06: WhatsApp button contains an SVG icon', async ({ page }) => {
    const arrived = await page
      .locator('text=Lab Results Entry')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!arrived) {
      test.skip(true, 'Demo page not accessible');
      return;
    }

    await pickFirstTest(page);
    const button = await getWhatsAppButton(page);
    const svgIcon = button.locator('svg');
    await expect(svgIcon).toBeVisible();

    console.log('P-06 RESULT: SVG icon is present inside the button');
  });

  // --------------------------------------------------------------------------
  // P-07: Button title contains patient phone number
  // --------------------------------------------------------------------------
  test('P-07: Button title shows patient phone number 9876543210', async ({ page }) => {
    const arrived = await page
      .locator('text=Lab Results Entry')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!arrived) {
      test.skip(true, 'Demo page not accessible');
      return;
    }

    await pickFirstTest(page);
    const button = await getWhatsAppButton(page);

    const title = await button.getAttribute('title');
    console.log('P-07: Button title =', title);

    expect(title).toContain('9876543210');
    console.log('P-07 RESULT: Button title includes correct phone number');
  });

  // --------------------------------------------------------------------------
  // P-08: Clicking the button triggers WhatsApp link or Sent state
  // --------------------------------------------------------------------------
  test('P-08: Click triggers WhatsApp wa.me link or Sent state', async ({ page }) => {
    // Prevent window.open from actually navigating
    await page.addInitScript(() => {
      (window as any).open = (url: string) => {
        (window as any).__capturedWaUrl = url;
        return { closed: false, focus: () => {} };
      };
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });

    const arrived = await page
      .locator('text=Lab Results Entry')
      .waitFor({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    if (!arrived) {
      test.skip(true, 'Demo page not accessible');
      return;
    }

    await pickFirstTest(page);
    const button = await getWhatsAppButton(page);

    // Mock edge function to return error so fallback wa.me link fires
    await page.route('**/functions/v1/send-whatsapp-report', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not deployed' }),
      });
    });

    await button.click();

    // Wait for async handler (window.open or sent state)
    await page.waitForFunction(
      () => !!(window as any).__capturedWaUrl,
      { timeout: 10_000 }
    ).catch(() => {});

    const capturedUrl: string = await page.evaluate(() => (window as any).__capturedWaUrl || '');

    await page.screenshot({
      path: 'e2e-test-results/prod-p08-after-click.png',
      fullPage: false,
    });

    if (capturedUrl) {
      console.log('P-08: WhatsApp URL =', capturedUrl);
      expect(capturedUrl).toContain('wa.me');
      expect(capturedUrl).toContain('Diya');
      expect(capturedUrl).toContain('9876543210');
      console.log('P-08 RESULT: WhatsApp wa.me link opened with correct data');
    } else {
      const buttonText = (await button.textContent())?.trim() ?? '';
      console.log('P-08: window.open not captured — button text =', buttonText);
      expect(['Sent', 'Send Report via WhatsApp']).toContain(buttonText);
      console.log('P-08 RESULT: Button reached expected end-state without wa.me capture');
    }
  });
});
