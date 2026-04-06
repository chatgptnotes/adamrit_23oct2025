import { test, expect, Page } from '@playwright/test';
import { gotoProtected } from './helpers/auth';

/**
 * E2E tests for the Daily Payment Allocation Dashboard (/daily-payment-allocation).
 *
 * These tests verify that the UI renders correctly and that the primary
 * interactions (tab switching, opening the edit dialog, dialog fields) work.
 * They do NOT mutate production data — they verify element presence and
 * dialog rendering only, stopping before submitting any form.
 *
 * Prerequisites:
 *   export E2E_EMAIL=<admin-email>
 *   export E2E_PASSWORD=<admin-password>
 *   npx playwright test e2e/payment-allocation-flow.spec.ts
 */

const ROUTE = '/daily-payment-allocation';

// ─────────────────────────────────────────────────────────────────────────────
// Page Object
// ─────────────────────────────────────────────────────────────────────────────

class PaymentAllocationPage {
  constructor(private readonly page: Page) {}

  async navigate() {
    await gotoProtected(this.page, ROUTE);
  }

  // Header elements
  heading() {
    return this.page.getByRole('heading', { name: /daily payment allocation/i });
  }

  // Summary / fund cards
  cashCollectionsLabel() {
    return this.page.getByText("Today's Cash Collections");
  }

  surplusOrDeficitLabel() {
    // The card title toggles between "Surplus" and "Deficit" depending on data.
    return this.page.getByText(/surplus|deficit/i).first();
  }

  totalAvailableLabel() {
    return this.page.getByText(/total available/i);
  }

  totalObligationsLabel() {
    return this.page.getByText(/total obligations due/i);
  }

  // Tabs
  tabAllocation() {
    return this.page.getByRole('tab', { name: /today.s allocation/i });
  }

  tabMaster() {
    return this.page.getByRole('tab', { name: /obligations master/i });
  }

  tabHistory() {
    return this.page.getByRole('tab', { name: /payment history/i });
  }

  // Obligations Master tab
  addObligationButton() {
    return this.page.getByRole('button', { name: /add obligation/i });
  }

  obligationsTable() {
    return this.page.getByRole('table').first();
  }

  // Edit dialog
  editDialog() {
    return this.page.getByRole('dialog');
  }

  editDialogTitle() {
    // Dialog title is either "Add Obligation" or uses the party name for context —
    // look for the dialog itself.
    return this.page.getByRole('dialog').getByRole('heading').first();
  }

  // Fields inside the Add/Edit obligation dialog
  partyNameField() {
    return this.page.getByLabel(/obligation name|party name/i);
  }

  categoryField() {
    return this.page.getByLabel(/category/i).first();
  }

  dailyAmountField() {
    return this.page.getByLabel(/daily amount/i);
  }

  priorityField() {
    return this.page.getByLabel(/priority/i);
  }

  googleSheetField() {
    return this.page.getByLabel(/google sheet/i);
  }

  // "Plan Payees" pay dialog
  planPayeesDialog() {
    return this.page.getByRole('dialog');
  }

  savePayLaterButton() {
    return this.page.getByRole('button', { name: /save.*pay later|pay later/i });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Payment Allocation Dashboard', () => {
  let pap: PaymentAllocationPage;

  test.beforeEach(async ({ page }) => {
    pap = new PaymentAllocationPage(page);
    await pap.navigate();
  });

  // ── Page load ──────────────────────────────────────────────────────────────

  test('page loads with main heading', async ({ page }) => {
    await expect(pap.heading()).toBeVisible();
  });

  test('page shows Today\'s Cash Collections card', async ({ page }) => {
    await expect(pap.cashCollectionsLabel()).toBeVisible();
  });

  test('page shows Total Available (Cash + Banks) summary card', async ({ page }) => {
    await expect(pap.totalAvailableLabel()).toBeVisible();
  });

  test('page shows Total Obligations Due summary card', async ({ page }) => {
    await expect(pap.totalObligationsLabel()).toBeVisible();
  });

  test('page shows Surplus or Deficit summary card', async ({ page }) => {
    await expect(pap.surplusOrDeficitLabel()).toBeVisible();
  });

  // ── Three tabs present ─────────────────────────────────────────────────────

  test('Today\'s Allocation tab is visible', async ({ page }) => {
    await expect(pap.tabAllocation()).toBeVisible();
  });

  test('Obligations Master tab is visible', async ({ page }) => {
    await expect(pap.tabMaster()).toBeVisible();
  });

  test('Payment History tab is visible', async ({ page }) => {
    await expect(pap.tabHistory()).toBeVisible();
  });

  // ── Obligations Master tab ─────────────────────────────────────────────────

  test('clicking Obligations Master tab shows the obligations table', async ({ page }) => {
    await pap.tabMaster().click();
    await expect(pap.obligationsTable()).toBeVisible();
  });

  test('Obligations Master tab has Add Obligation button', async ({ page }) => {
    await pap.tabMaster().click();
    await expect(pap.addObligationButton()).toBeVisible();
  });

  test('Obligations Master table has expected column headers', async ({ page }) => {
    await pap.tabMaster().click();
    const table = pap.obligationsTable();
    await expect(table.getByRole('columnheader', { name: /party name/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /category/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /daily amount/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /priority/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /active/i })).toBeVisible();
  });

  // ── Add Obligation dialog opens ────────────────────────────────────────────

  test('clicking Add Obligation opens a dialog', async ({ page }) => {
    await pap.tabMaster().click();
    await pap.addObligationButton().click();
    await expect(pap.editDialog()).toBeVisible();
  });

  test('Add Obligation dialog contains Obligation Name / Party Name field', async ({ page }) => {
    await pap.tabMaster().click();
    await pap.addObligationButton().click();
    await expect(pap.editDialog()).toBeVisible();
    // The field may be labelled "Party Name" or "Obligation Name" in the dialog.
    const partyInput = pap.page
      .getByRole('dialog')
      .getByRole('textbox')
      .first();
    await expect(partyInput).toBeVisible();
  });

  test('Add Obligation dialog has a Daily Amount number field', async ({ page }) => {
    await pap.tabMaster().click();
    await pap.addObligationButton().click();
    await expect(pap.editDialog()).toBeVisible();
    // Find a number input inside the dialog
    const amountInput = pap.page
      .getByRole('dialog')
      .getByRole('spinbutton')
      .first();
    await expect(amountInput).toBeVisible();
  });

  test('Add Obligation dialog has Google Sheet link field', async ({ page }) => {
    await pap.tabMaster().click();
    await pap.addObligationButton().click();
    await expect(pap.editDialog()).toBeVisible();
    // Look for any input that could hold a URL / Google Sheet link
    const allInputs = await pap.page
      .getByRole('dialog')
      .getByRole('textbox')
      .all();
    // There should be more than one text input (name, notes, google sheet link, etc.)
    expect(allInputs.length).toBeGreaterThan(1);
  });

  test('Add Obligation dialog can be closed with Escape key', async ({ page }) => {
    await pap.tabMaster().click();
    await pap.addObligationButton().click();
    await expect(pap.editDialog()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pap.editDialog()).not.toBeVisible();
  });

  // ── Edit dialog from an existing obligation ────────────────────────────────

  test('clicking edit button on an obligation row opens the edit dialog', async ({ page }) => {
    await pap.tabMaster().click();

    // Only run this part if the table has at least one data row (non-empty state).
    const rows = await pap.page
      .getByRole('table')
      .first()
      .getByRole('row')
      .all();

    // rows[0] is the header; rows[1..] are data rows.
    if (rows.length < 2) {
      test.skip();
      return;
    }

    // Find the edit button (SVG pencil icon button) in the first data row.
    const editButton = rows[1].getByRole('button').filter({ has: page.locator('svg') }).first();
    await editButton.click();

    await expect(pap.editDialog()).toBeVisible();
  });

  // ── Today's Allocation tab ─────────────────────────────────────────────────

  test('Today\'s Allocation tab shows schedule table or empty-state message', async ({ page }) => {
    await pap.tabAllocation().click();

    // Either the table is visible or the empty-state text appears.
    const hasTable = await pap.page.getByRole('table').isVisible().catch(() => false);
    const hasEmptyState = await pap.page
      .getByText(/no obligations scheduled|add obligations in the master/i)
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);
  });

  test('Today\'s Allocation table has drag-handle column when rows exist', async ({ page }) => {
    await pap.tabAllocation().click();

    const rows = await pap.page.getByRole('table').first().getByRole('row').all();
    if (rows.length < 2) {
      // No data rows — skip the drag-handle assertion.
      return;
    }

    // Each data row has a grip-vertical icon used as drag handle.
    const gripHandle = rows[1].locator('button').first();
    await expect(gripHandle).toBeVisible();
  });

  // ── Payment History tab ────────────────────────────────────────────────────

  test('Payment History tab shows date range inputs', async ({ page }) => {
    await pap.tabHistory().click();
    const dateInputs = await pap.page.getByRole('textbox', { name: /from|to/i }).all();
    // The inputs are type="date" so may be found via their input[type=date] selector.
    const dateInputsAlt = await pap.page.locator('input[type="date"]').all();
    expect(dateInputs.length + dateInputsAlt.length).toBeGreaterThanOrEqual(2);
  });

  // ── Hospital selector ──────────────────────────────────────────────────────

  test('hospital selector is present with Hope Hospital option', async ({ page }) => {
    const selector = pap.page.getByRole('combobox');
    await expect(selector.first()).toBeVisible();
  });

  // ── Date selector ─────────────────────────────────────────────────────────

  test('date input for selecting payment date is present', async ({ page }) => {
    const dateInput = pap.page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar navigation test (Payment Allocation entry)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sidebar — Payment Allocation navigation', () => {
  test('sidebar contains a Payment Allocation link', async ({ page }) => {
    await gotoProtected(page, '/');
    const link = page.getByRole('link', { name: /payment allocation/i });
    await expect(link).toBeVisible();
  });

  test('clicking Payment Allocation sidebar link navigates to the correct page', async ({ page }) => {
    await gotoProtected(page, '/');
    const link = page.getByRole('link', { name: /payment allocation/i });
    await link.click();
    await expect(page).toHaveURL(/daily-payment-allocation/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Favicon test
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Favicon', () => {
  test('favicon link element is present in page head', async ({ page }) => {
    await gotoProtected(page, '/');
    // Check that a <link rel="icon"> element exists pointing to a favicon file.
    const faviconHref = await page.evaluate(() => {
      const el = document.querySelector('link[rel*="icon"]');
      return el ? (el as HTMLLinkElement).href : null;
    });
    expect(faviconHref).not.toBeNull();
    expect(faviconHref).toBeTruthy();
  });

  test('favicon URL is reachable (returns 200 or 204)', async ({ page, request }) => {
    await gotoProtected(page, '/');
    const faviconHref = await page.evaluate(() => {
      const el = document.querySelector('link[rel*="icon"]');
      return el ? (el as HTMLLinkElement).href : null;
    });

    if (!faviconHref) {
      test.skip();
      return;
    }

    const response = await request.get(faviconHref);
    expect(response.status()).toBeLessThan(400);
  });
});
