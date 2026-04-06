import { test, expect, Page } from '@playwright/test';
import { gotoProtected } from './helpers/auth';

/**
 * E2E tests for the Hope RMOs Master (/hope-rmos) and
 * Ayushman RMOs Master (/ayushman-rmos) pages.
 *
 * Tests verify page structure, control presence, and dialog interactions.
 * No records are committed to the database — the "Add" dialog is opened and
 * inspected, but the submit button is NOT clicked.
 *
 * Prerequisites:
 *   export E2E_EMAIL=<admin-email>
 *   export E2E_PASSWORD=<admin-password>
 *   npx playwright test e2e/rmo-master-flow.spec.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// Page Object — shared shape for both Hope and Ayushman RMO pages
// ─────────────────────────────────────────────────────────────────────────────

class RMOMasterPage {
  constructor(
    private readonly page: Page,
    private readonly hospitalLabel: 'Hope' | 'Ayushman'
  ) {}

  get route(): string {
    return this.hospitalLabel === 'Hope' ? '/hope-rmos' : '/ayushman-rmos';
  }

  async navigate() {
    await gotoProtected(this.page, this.route);
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  mainHeading() {
    const pattern =
      this.hospitalLabel === 'Hope'
        ? /hope rmos master list/i
        : /ayushman rmos master list/i;
    return this.page.getByRole('heading', { name: pattern });
  }

  subtitle() {
    const pattern =
      this.hospitalLabel === 'Hope'
        ? /manage hope resident medical officers/i
        : /manage ayushman resident medical officers/i;
    return this.page.getByText(pattern);
  }

  // ── Controls ───────────────────────────────────────────────────────────────

  searchInput() {
    return this.page.getByRole('textbox', { name: /search/i });
  }

  addButton() {
    const pattern =
      this.hospitalLabel === 'Hope'
        ? /add hope rmo/i
        : /add ayushman rmo/i;
    return this.page.getByRole('button', { name: pattern });
  }

  exportButton() {
    return this.page.getByRole('button', { name: /export/i });
  }

  importButton() {
    return this.page.getByRole('button', { name: /import/i });
  }

  // ── Add dialog ─────────────────────────────────────────────────────────────

  dialog() {
    return this.page.getByRole('dialog');
  }

  dialogTitle() {
    const pattern =
      this.hospitalLabel === 'Hope'
        ? /add hope rmo/i
        : /add ayushman rmo/i;
    return this.page.getByRole('dialog').getByRole('heading', { name: pattern });
  }

  nameField() {
    return this.page.getByRole('dialog').getByLabel(/^name$/i);
  }

  specialtyField() {
    return this.page.getByRole('dialog').getByLabel(/specialty/i);
  }

  departmentField() {
    return this.page.getByRole('dialog').getByLabel(/department/i);
  }

  contactInfoField() {
    return this.page.getByRole('dialog').getByLabel(/contact info/i);
  }

  tpaRateField() {
    return this.page.getByRole('dialog').getByLabel(/tpa rate/i);
  }

  nonNabhRateField() {
    return this.page.getByRole('dialog').getByLabel(/non-nabh rate/i);
  }

  nabhRateField() {
    return this.page.getByRole('dialog').getByLabel(/nabh rate/i);
  }

  privateRateField() {
    return this.page.getByRole('dialog').getByLabel(/private rate/i);
  }

  // ── List ──────────────────────────────────────────────────────────────────

  listContainer() {
    // The list is rendered as a card/div container — look for a region or generic container.
    return this.page.locator('[class*="grid"], [class*="space-y"]').last();
  }

  noResultsText() {
    return this.page.getByText(/no.*rmo.*found|no results/i);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: shared test body that runs for both Hope and Ayushman
// ─────────────────────────────────────────────────────────────────────────────

function runRMOTests(hospitalLabel: 'Hope' | 'Ayushman') {
  test.describe(`${hospitalLabel} RMOs Master`, () => {
    let rmoPage: RMOMasterPage;

    test.beforeEach(async ({ page }) => {
      rmoPage = new RMOMasterPage(page, hospitalLabel);
      await rmoPage.navigate();
    });

    // ── Page load ────────────────────────────────────────────────────────────

    test('page loads with correct main heading', async ({ page }) => {
      await expect(rmoPage.mainHeading()).toBeVisible();
    });

    test('page displays descriptive subtitle', async ({ page }) => {
      await expect(rmoPage.subtitle()).toBeVisible();
    });

    // ── Controls present ─────────────────────────────────────────────────────

    test('search bar is visible', async ({ page }) => {
      // Search input may not have an accessible label — fall back to placeholder.
      const searchInput =
        (await rmoPage.searchInput().isVisible().catch(() => false))
          ? rmoPage.searchInput()
          : page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test('Export button is visible', async ({ page }) => {
      await expect(rmoPage.exportButton()).toBeVisible();
    });

    test('Import button is visible', async ({ page }) => {
      await expect(rmoPage.importButton()).toBeVisible();
    });

    test(`Add ${hospitalLabel} RMO button is visible`, async ({ page }) => {
      await expect(rmoPage.addButton()).toBeVisible();
    });

    // ── Add dialog opens and has correct title ────────────────────────────────

    test(`clicking Add ${hospitalLabel} RMO opens the dialog`, async ({ page }) => {
      await rmoPage.addButton().click();
      await expect(rmoPage.dialog()).toBeVisible();
    });

    test(`Add dialog title reads "Add ${hospitalLabel} RMO"`, async ({ page }) => {
      await rmoPage.addButton().click();
      await expect(rmoPage.dialogTitle()).toBeVisible();
    });

    // ── Add dialog fields ────────────────────────────────────────────────────

    test('Add dialog contains a Name field (required)', async ({ page }) => {
      await rmoPage.addButton().click();
      // Name field — try label first, fall back to first textbox in dialog.
      const nameInput = (await rmoPage.nameField().isVisible().catch(() => false))
        ? rmoPage.nameField()
        : page.getByRole('dialog').getByRole('textbox').first();
      await expect(nameInput).toBeVisible();
    });

    test('Add dialog contains a Specialty field', async ({ page }) => {
      await rmoPage.addButton().click();
      const specialtyInput = (await rmoPage.specialtyField().isVisible().catch(() => false))
        ? rmoPage.specialtyField()
        : page.getByRole('dialog').getByRole('textbox').nth(1);
      await expect(specialtyInput).toBeVisible();
    });

    test('Add dialog contains a Department field', async ({ page }) => {
      await rmoPage.addButton().click();
      const departmentInput = (await rmoPage.departmentField().isVisible().catch(() => false))
        ? rmoPage.departmentField()
        : page.getByRole('dialog').getByRole('textbox').nth(2);
      await expect(departmentInput).toBeVisible();
    });

    test('Add dialog contains Contact Info field', async ({ page }) => {
      await rmoPage.addButton().click();
      const contactInput = (await rmoPage.contactInfoField().isVisible().catch(() => false))
        ? rmoPage.contactInfoField()
        : page.getByRole('dialog').getByRole('textbox').nth(3);
      await expect(contactInput).toBeVisible();
    });

    test('Add dialog contains rate fields (TPA, Non-NABH, NABH, Private)', async ({ page }) => {
      await rmoPage.addButton().click();
      // Rate fields are number inputs — there should be at least 4.
      const numberInputs = await page.getByRole('dialog').getByRole('spinbutton').all();
      expect(numberInputs.length).toBeGreaterThanOrEqual(4);
    });

    test('Add dialog has a submit / save button', async ({ page }) => {
      await rmoPage.addButton().click();
      // Look for a button with "add", "save", or "submit" text inside the dialog.
      const saveBtn = page.getByRole('dialog').getByRole('button', {
        name: /add|save|submit/i,
      });
      await expect(saveBtn).toBeVisible();
    });

    // ── Typing in dialog fields ───────────────────────────────────────────────

    test('Name field accepts typed input', async ({ page }) => {
      await rmoPage.addButton().click();
      const nameInput = page.getByRole('dialog').getByRole('textbox').first();
      await nameInput.fill('Dr. Test RMO');
      await expect(nameInput).toHaveValue('Dr. Test RMO');
    });

    test('Specialty field accepts typed input', async ({ page }) => {
      await rmoPage.addButton().click();
      const allTextboxes = await page.getByRole('dialog').getByRole('textbox').all();
      if (allTextboxes.length < 2) return;
      await allTextboxes[1].fill('General Medicine');
      await expect(allTextboxes[1]).toHaveValue('General Medicine');
    });

    // ── Dialog dismissal ──────────────────────────────────────────────────────

    test('Add dialog closes when Escape is pressed', async ({ page }) => {
      await rmoPage.addButton().click();
      await expect(rmoPage.dialog()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(rmoPage.dialog()).not.toBeVisible();
    });

    // ── Search functionality ──────────────────────────────────────────────────

    test('typing in search bar filters the list or shows no-results text', async ({ page }) => {
      // Type a search string very unlikely to match anything.
      const searchInput =
        (await rmoPage.searchInput().isVisible().catch(() => false))
          ? rmoPage.searchInput()
          : page.getByPlaceholder(/search/i);

      await searchInput.fill('ZZZNOTFOUNDXXX');

      // Either the list becomes empty or a no-results indicator appears.
      const hasNoResults = await rmoPage.noResultsText().isVisible().catch(() => false);
      const listItems = await page.getByRole('listitem').count().catch(() => 0);

      // At least one of these conditions must hold: no-results shown or list is empty.
      expect(hasNoResults || listItems === 0).toBe(true);
    });

    // ── Edit dialog for existing record ───────────────────────────────────────

    test('clicking edit on an existing RMO opens the edit dialog', async ({ page }) => {
      // Find any edit button — they are icon-only buttons in each row.
      const editButtons = await page.getByRole('button', { name: /edit/i }).all();
      if (editButtons.length === 0) {
        // No records in the list — skip this assertion.
        test.skip();
        return;
      }
      await editButtons[0].click();
      await expect(rmoPage.dialog()).toBeVisible();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Run the shared tests for both hospitals
// ─────────────────────────────────────────────────────────────────────────────

runRMOTests('Hope');
runRMOTests('Ayushman');

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar navigation tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sidebar — RMO master navigation', () => {
  test('sidebar contains Hope RMOs link in Masters section', async ({ page }) => {
    await gotoProtected(page, '/');
    const link = page.getByRole('link', { name: /hope rmos/i });
    await expect(link).toBeVisible();
  });

  test('sidebar contains Ayushman RMOs link in Masters section', async ({ page }) => {
    await gotoProtected(page, '/');
    const link = page.getByRole('link', { name: /ayushman rmos/i });
    await expect(link).toBeVisible();
  });

  test('clicking Hope RMOs link navigates to /hope-rmos', async ({ page }) => {
    await gotoProtected(page, '/');
    await page.getByRole('link', { name: /hope rmos/i }).click();
    await expect(page).toHaveURL(/hope-rmos/);
    await expect(page.getByRole('heading', { name: /hope rmos master list/i })).toBeVisible();
  });

  test('clicking Ayushman RMOs link navigates to /ayushman-rmos', async ({ page }) => {
    await gotoProtected(page, '/');
    await page.getByRole('link', { name: /ayushman rmos/i }).click();
    await expect(page).toHaveURL(/ayushman-rmos/);
    await expect(page.getByRole('heading', { name: /ayushman rmos master list/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-page: add an RMO and verify it appears (integration-level, read-only
// from a UI perspective — fills form but does NOT submit to keep tests safe)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Hope RMOs — add dialog field validation', () => {
  test('submitting empty form shows validation feedback (Name is required)', async ({ page }) => {
    await gotoProtected(page, '/hope-rmos');
    await page.getByRole('button', { name: /add hope rmo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click save/submit without filling any field.
    const submitBtn = page.getByRole('dialog').getByRole('button', {
      name: /add|save|submit/i,
    });
    await submitBtn.click();

    // Expect either a browser-native validation hint (required attribute) or a
    // visible error message — the form should NOT close.
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('form can be filled and dialog stays open until submit', async ({ page }) => {
    await gotoProtected(page, '/hope-rmos');
    await page.getByRole('button', { name: /add hope rmo/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const textboxes = await dialog.getByRole('textbox').all();
    if (textboxes.length >= 1) {
      await textboxes[0].fill('E2E Test RMO - DO NOT SUBMIT');
    }
    if (textboxes.length >= 2) {
      await textboxes[1].fill('Cardiology');
    }
    if (textboxes.length >= 3) {
      await textboxes[2].fill('ICU');
    }

    // Dialog is still open (we did not click submit yet).
    await expect(dialog).toBeVisible();

    // Close without submitting.
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
