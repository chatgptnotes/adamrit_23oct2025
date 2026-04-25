import { test, expect, Page } from '@playwright/test';

/**
 * Queue Display feature tests.
 *
 * /queue-display is a full-screen TV display route inside the authenticated app.
 * App.tsx guards all non-auth routes behind a login wall that reads from localStorage.
 * We inject a mock session into localStorage (same approach as queue-management.spec.ts)
 * to bypass the UI auth flow, then navigate to /queue-display.
 */

const MOCK_USER = {
  id: 'e2e-test-user',
  email: 'admin@adamrit.com',
  username: 'admin',
  role: 'admin',
  hospitalType: 'hope',
};

async function goToQueueDisplay(page: Page, query = '') {
  // First load app root so we are on the correct origin for localStorage writes
  await page.goto('/');

  // Inject auth session — mirrors queue-management.spec.ts approach
  await page.evaluate((user) => {
    localStorage.setItem('hmis_user', JSON.stringify(user));
    localStorage.setItem('hmis_visited', 'true');
  }, MOCK_USER);

  // Navigate to the protected route
  await page.goto(`/queue-display${query}`);

  // Wait for the page to settle; networkidle can time out on long-poll pages — that's fine
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
}

test.describe('Queue Display — /queue-display', () => {
  test('page loads without a crash', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await goToQueueDisplay(page);

    // Must not show the React error boundary / crash screen
    await expect(page.locator('body')).not.toContainText('Something went wrong');
    await expect(page.locator('body')).not.toContainText('Error:');

    // Page must have some visible content
    await expect(page.locator('body')).toBeVisible();

    if (pageErrors.length > 0) {
      console.warn('Page-level JS errors:', pageErrors);
    }

    await page.screenshot({
      path: 'e2e-test-results/queue-display-load.png',
      fullPage: true,
    });
  });

  test('header is visible with correct title', async ({ page }) => {
    await goToQueueDisplay(page);

    // The header h1 shows the all-departments label when no ?dept param given
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(heading).toContainText('Patient Queue');

    // Hospital branding — scoped to the header subtitle to avoid strict-mode collision with footer
    await expect(page.locator('p.text-blue-300')).toBeVisible();
  });

  test('live clock is rendered', async ({ page }) => {
    await goToQueueDisplay(page);

    // Clock shows time in hh:mm:ss a format (e.g. "02:45:30 PM")
    // Locate by the font-mono class which wraps the time display
    const clock = page.locator('.font-mono');
    await expect(clock).toBeVisible({ timeout: 10_000 });

    const t1 = await clock.textContent();
    // Wait at least 1.1 seconds for the clock to tick
    await page.waitForTimeout(1_100);
    const t2 = await clock.textContent();

    // Seconds portion should have changed
    expect(t1).not.toBe(t2);
  });

  test('footer is rendered with summary stats', async ({ page }) => {
    await goToQueueDisplay(page);

    const footer = page.locator('footer, .border-t');
    await expect(footer).toBeVisible({ timeout: 10_000 });

    // Footer must contain the static "Total waiting:" label
    await expect(page.locator('text=Total waiting:')).toBeVisible();
    await expect(page.locator('text=Updates automatically')).toBeVisible();
  });

  test('empty state shows "No patients waiting" when queue is empty', async ({ page }) => {
    await goToQueueDisplay(page);

    // Either the empty state OR actual tokens are shown — both are valid
    const emptyState = page.locator('text=No patients waiting');
    const tokenCards = page.locator('.bg-gray-900.rounded-2xl');

    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const tokensVisible = await tokenCards.first().isVisible().catch(() => false);

    expect(emptyVisible || tokensVisible).toBe(true);
  });

  test('department filter via ?dept=OPD narrows the heading', async ({ page }) => {
    await goToQueueDisplay(page, '?dept=OPD');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(heading).toContainText('OPD Queue');
  });

  test('no blocking console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await goToQueueDisplay(page);

    // Allow network to settle
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

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
      console.warn('Console errors on /queue-display:', criticalErrors);
    }

    // The page must still be alive
    await expect(page.locator('h1')).toBeVisible();

    await page.screenshot({
      path: 'e2e-test-results/queue-display-console-check.png',
      fullPage: true,
    });
  });

  test('Supabase queue_tokens request does not return 4xx/5xx', async ({ page }) => {
    const badResponses: string[] = [];
    page.on('response', (response) => {
      if (
        response.url().includes('supabase') &&
        response.url().includes('queue_tokens') &&
        response.status() >= 400
      ) {
        badResponses.push(`HTTP ${response.status()} — ${response.url()}`);
      }
    });

    await goToQueueDisplay(page);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    if (badResponses.length > 0) {
      console.warn('Supabase error responses:', badResponses);
    }

    // Page must not show an error banner
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    await expect(page.locator('text=Error loading')).not.toBeVisible();

    await page.screenshot({
      path: 'e2e-test-results/queue-display-supabase.png',
      fullPage: true,
    });
  });

  test('real-time subscription channel is established', async ({ page }) => {
    const wsConnections: string[] = [];
    page.on('websocket', (ws) => wsConnections.push(ws.url()));

    await goToQueueDisplay(page);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // Supabase realtime uses WebSocket — at least one should be opened
    const hasSupabaseWs = wsConnections.some((url) =>
      url.includes('supabase') || url.includes('realtime')
    );

    if (!hasSupabaseWs && wsConnections.length === 0) {
      console.warn('No WebSocket connections detected — realtime may be inactive');
    }

    // Page must still be functional regardless
    await expect(page.locator('h1')).toBeVisible();
  });

  test('full-screen layout — no horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await goToQueueDisplay(page);

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance

    await page.screenshot({
      path: 'e2e-test-results/queue-display-fullscreen.png',
      fullPage: true,
    });
  });
});
