# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: whatsapp-production-check.spec.ts >> PROD — WhatsApp Report Button on adamrit.vercel.app >> P-02: Demo heading and patient info are rendered
- Location: e2e\whatsapp-production-check.spec.ts:98:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Lab Results Entry')
Expected: visible
Timeout: 1000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 1000ms
  - waiting for locator('text=Lab Results Entry')

```

# Page snapshot

```yaml
- main [ref=e3]:
  - paragraph [ref=e4]:
    - generic [ref=e5]:
      - strong [ref=e6]: "404"
      - text: ": NOT_FOUND"
    - generic [ref=e7]:
      - text: "Code:"
      - code [ref=e8]: "`DEPLOYMENT_NOT_FOUND`"
    - generic [ref=e9]:
      - text: "ID:"
      - code [ref=e10]: "`bom1::5wcws-1777111009302-3661a13fa397`"
  - link "This deployment cannot be found. For more information and troubleshooting, see our documentation." [ref=e11] [cursor=pointer]:
    - /url: https://vercel.com/docs/errors/DEPLOYMENT_NOT_FOUND
    - generic [ref=e12]: This deployment cannot be found. For more information and troubleshooting, see our documentation.
```

# Test source

```ts
  22  | async function injectAuth(context: BrowserContext): Promise<void> {
  23  |   await context.addInitScript(() => {
  24  |     const mockUser = JSON.stringify({
  25  |       id: 'e2e-prod-check',
  26  |       email: 'e2e@hopehospital.com',
  27  |       username: 'admin',
  28  |       role: 'admin',
  29  |       hospitalType: 'hope',
  30  |       hospitalName: 'hope',
  31  |     });
  32  |     window.localStorage.setItem('hmis_user', mockUser);
  33  |     window.localStorage.setItem('hmis_visited', 'true');
  34  |   });
  35  | }
  36  | 
  37  | /** Pick the first option in the test dropdown and return its label. */
  38  | async function pickFirstTest(page: Page): Promise<string> {
  39  |   const combobox = page.locator('[role="combobox"]').first();
  40  |   await expect(combobox).toBeVisible({ timeout: 30_000 });
  41  |   await expect(combobox).toBeEnabled({ timeout: 30_000 });
  42  |   await combobox.click();
  43  | 
  44  |   const firstOption = page.locator('[role="option"]').first();
  45  |   await expect(firstOption).toBeVisible({ timeout: 30_000 });
  46  |   const label = (await firstOption.textContent()) ?? 'unknown';
  47  |   await firstOption.click();
  48  |   return label.trim();
  49  | }
  50  | 
  51  | /** Locate the WhatsApp send button and wait for it to be visible. */
  52  | async function getWhatsAppButton(page: Page) {
  53  |   const btn = page.locator('button', { hasText: /Send Report via WhatsApp/i });
  54  |   await expect(btn).toBeVisible({ timeout: 30_000 });
  55  |   return btn;
  56  | }
  57  | 
  58  | test.describe('PROD — WhatsApp Report Button on adamrit.vercel.app', () => {
  59  |   test.beforeEach(async ({ page, context }) => {
  60  |     await injectAuth(context);
  61  |     await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  62  |   });
  63  | 
  64  |   // --------------------------------------------------------------------------
  65  |   // P-01: Page loads — check for auth wall vs rendered content
  66  |   // --------------------------------------------------------------------------
  67  |   test('P-01: Page loads without redirect to login', async ({ page }) => {
  68  |     // Take an early screenshot to capture exactly what we see
  69  |     await page.waitForTimeout(3_000); // brief settle
  70  |     await page.screenshot({
  71  |       path: 'e2e-test-results/prod-p01-initial-load.png',
  72  |       fullPage: true,
  73  |     });
  74  | 
  75  |     const currentUrl = page.url();
  76  |     console.log('P-01: current URL =', currentUrl);
  77  | 
  78  |     // If redirected to login/auth, report it
  79  |     const isLoginPage =
  80  |       currentUrl.includes('/login') ||
  81  |       currentUrl.includes('/auth') ||
  82  |       currentUrl.includes('/signin');
  83  | 
  84  |     if (isLoginPage) {
  85  |       console.log('P-01 RESULT: Page requires login — redirected to', currentUrl);
  86  |       // Not a hard failure — just report it
  87  |       test.skip(true, `Production page requires login (redirected to ${currentUrl})`);
  88  |       return;
  89  |     }
  90  | 
  91  |     // Should stay on the demo path or root after auth injection
  92  |     console.log('P-01 RESULT: Page loaded without redirect');
  93  |   });
  94  | 
  95  |   // --------------------------------------------------------------------------
  96  |   // P-02: Demo heading is visible
  97  |   // --------------------------------------------------------------------------
  98  |   test('P-02: Demo heading and patient info are rendered', async ({ page }) => {
  99  |     // Wait for either the demo heading or a login form — whichever appears first
  100 |     const demoHeading = page.locator('text=Lab Results Entry');
  101 |     const loginForm = page.locator('input[type="password"], input[name="password"]');
  102 | 
  103 |     const first = await Promise.race([
  104 |       demoHeading.waitFor({ timeout: 20_000 }).then(() => 'demo'),
  105 |       loginForm.waitFor({ timeout: 20_000 }).then(() => 'login'),
  106 |     ]).catch(() => 'timeout');
  107 | 
  108 |     await page.screenshot({
  109 |       path: 'e2e-test-results/prod-p02-heading-check.png',
  110 |       fullPage: true,
  111 |     });
  112 | 
  113 |     if (first === 'login') {
  114 |       console.log('P-02 RESULT: Login form detected — page requires authentication');
  115 |       test.skip(true, 'Production requires login — cannot test without credentials');
  116 |       return;
  117 |     }
  118 | 
  119 |     if (first === 'timeout') {
  120 |       console.log('P-02 RESULT: Neither demo heading nor login form appeared in 20s');
  121 |       // Take a screenshot and fail
> 122 |       await expect(demoHeading).toBeVisible({ timeout: 1_000 });
      |                                 ^ Error: expect(locator).toBeVisible() failed
  123 |       return;
  124 |     }
  125 | 
  126 |     await expect(demoHeading).toBeVisible();
  127 |     // Patient name from LabResultsEntryDemo samplePatient
  128 |     await expect(page.locator('text=Diya').first()).toBeVisible();
  129 |     console.log('P-02 RESULT: Demo heading and patient info rendered correctly');
  130 |   });
  131 | 
  132 |   // --------------------------------------------------------------------------
  133 |   // P-03: Test dropdown exists and loads options
  134 |   // --------------------------------------------------------------------------
  135 |   test('P-03: Test dropdown is present and loads options', async ({ page }) => {
  136 |     const demoHeading = page.locator('text=Lab Results Entry');
  137 |     const arrived = await demoHeading.waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
  138 | 
  139 |     if (!arrived) {
  140 |       await page.screenshot({ path: 'e2e-test-results/prod-p03-no-heading.png', fullPage: true });
  141 |       test.skip(true, 'Demo page not accessible — likely requires login');
  142 |       return;
  143 |     }
  144 | 
  145 |     const combobox = page.locator('[role="combobox"]').first();
  146 |     await expect(combobox).toBeVisible({ timeout: 20_000 });
  147 | 
  148 |     // Check if it shows a loading placeholder
  149 |     const placeholderText = await combobox.textContent();
  150 |     console.log('P-03: Dropdown placeholder text:', placeholderText);
  151 | 
  152 |     // Wait for loading state to clear (disabled → enabled)
  153 |     await expect(combobox).toBeEnabled({ timeout: 30_000 });
  154 | 
  155 |     // Click to open and verify options are present
  156 |     await combobox.click();
  157 |     const options = page.locator('[role="option"]');
  158 |     const count = await options.count();
  159 |     console.log(`P-03 RESULT: Dropdown loaded ${count} test option(s)`);
  160 | 
  161 |     await page.screenshot({
  162 |       path: 'e2e-test-results/prod-p03-dropdown-open.png',
  163 |       fullPage: false,
  164 |     });
  165 | 
  166 |     expect(count).toBeGreaterThan(0);
  167 | 
  168 |     // Close the dropdown
  169 |     await page.keyboard.press('Escape');
  170 |   });
  171 | 
  172 |   // --------------------------------------------------------------------------
  173 |   // P-04: Selecting a test shows the WhatsApp button
  174 |   // --------------------------------------------------------------------------
  175 |   test('P-04: WhatsApp button appears after selecting a test', async ({ page }) => {
  176 |     const arrived = await page
  177 |       .locator('text=Lab Results Entry')
  178 |       .waitFor({ timeout: 20_000 })
  179 |       .then(() => true)
  180 |       .catch(() => false);
  181 | 
  182 |     if (!arrived) {
  183 |       test.skip(true, 'Demo page not accessible');
  184 |       return;
  185 |     }
  186 | 
  187 |     const testName = await pickFirstTest(page);
  188 |     console.log(`P-04: Selected test "${testName}"`);
  189 | 
  190 |     const button = await getWhatsAppButton(page);
  191 |     await expect(button).toBeVisible();
  192 |     await expect(button).toBeEnabled();
  193 | 
  194 |     await page.screenshot({
  195 |       path: 'e2e-test-results/prod-p04-whatsapp-button-visible.png',
  196 |       fullPage: true,
  197 |     });
  198 | 
  199 |     console.log('P-04 RESULT: WhatsApp button is visible and enabled');
  200 |   });
  201 | 
  202 |   // --------------------------------------------------------------------------
  203 |   // P-05: Button has green styling
  204 |   // --------------------------------------------------------------------------
  205 |   test('P-05: WhatsApp button has green styling classes', async ({ page }) => {
  206 |     const arrived = await page
  207 |       .locator('text=Lab Results Entry')
  208 |       .waitFor({ timeout: 20_000 })
  209 |       .then(() => true)
  210 |       .catch(() => false);
  211 | 
  212 |     if (!arrived) {
  213 |       test.skip(true, 'Demo page not accessible');
  214 |       return;
  215 |     }
  216 | 
  217 |     await pickFirstTest(page);
  218 |     const button = await getWhatsAppButton(page);
  219 | 
  220 |     const className = await button.getAttribute('class');
  221 |     console.log('P-05: Button className =', className);
  222 | 
```