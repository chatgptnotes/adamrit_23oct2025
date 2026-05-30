// Local verification of the Task Optimizer workflow features WITHOUT real DB
// access: we inject a session (kept alive via the auth "offline tolerance"
// branch when the users query fails) and mock the Supabase REST responses for
// task_optimizer_logs / task_optimizer_actions so the UI renders with known
// data. Verifies Phase 3 (pre-fill chips), Phase 1 (status controls), and
// Phase 2 (insights charts).
//
// Run:  node e2e/task-optimizer-local-check.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = '/tmp/to-shots';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[check]', ...a);

const SESSION = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'localcheck@demo.hope',
  role: 'admin',
  hospital_type: 'hope',
  name: 'Local Check',
  permissions: ['*'],
  username: 'localcheck',
};

const LOG_ID = '11111111-1111-4111-8111-111111111111';
const LOGS = [
  {
    id: LOG_ID,
    user_email: 'priya.nurse@demo.hope',
    hospital_type: 'hope',
    staff_name: 'Priya Sharma',
    designation: 'Nursing',
    log_date: '2026-05-30',
    created_at: '2026-05-30T09:15:00+05:30',
    tasks: ['Enter patient vitals into the system', 'Call patients to confirm appointments', 'Prepare daily census report'],
    ai_suggestions: [
      { task: 'Enter patient vitals into the system', type: 'automate', suggestion: 'Use bedside tablets with the EMR vitals form.', rationale: 'Removes double entry.', tool: 'EMR vitals module', existsInAdamrit: true },
      { task: 'Call patients to confirm appointments', type: 'automate', suggestion: 'Automated WhatsApp confirmations.', rationale: 'Cuts manual calls.', tool: 'Report Delivery (WhatsApp/portal)', existsInAdamrit: true },
      { task: 'Prepare daily census report', type: 'reduce', suggestion: 'Auto-generate census each morning.', rationale: 'One-click export.', tool: 'IPD dashboards', existsInAdamrit: true },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    user_email: 'anita.billing@demo.hope',
    hospital_type: 'hope',
    staff_name: 'Anita Desai',
    designation: 'Billing',
    log_date: '2026-05-30',
    created_at: '2026-05-30T18:40:00+05:30',
    tasks: ['Generate final bills at discharge', 'Reconcile cash counter at end of day'],
    ai_suggestions: [
      { task: 'Generate final bills at discharge', type: 'automate', suggestion: 'Auto-compile charges into the final bill.', rationale: 'Less manual entry.', tool: 'Final Bill module', existsInAdamrit: true },
      { task: 'Reconcile cash counter at end of day', type: 'delegate', suggestion: 'Use the day-book report.', rationale: 'Faster reconciliation.', tool: 'Cash Book report', existsInAdamrit: true },
    ],
  },
];
const ACTIONS = [
  { id: 'a1', log_id: LOG_ID, hospital_type: 'hope', task_text: 'Enter patient vitals into the system', suggestion_type: 'automate', status: 'done', owner: 'Priya', note: null, time_saved_mins: 30, created_at: '2026-05-30T10:00:00+05:30', updated_at: '2026-05-30T10:00:00+05:30' },
  { id: 'a2', log_id: LOG_ID, hospital_type: 'hope', task_text: 'Call patients to confirm appointments', suggestion_type: 'automate', status: 'in_progress', owner: 'Priya', note: null, time_saved_mins: null, created_at: '2026-05-30T10:00:00+05:30', updated_at: '2026-05-30T10:05:00+05:30' },
];

const consoleErrors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

// Seed the session before app code runs.
await page.addInitScript(s => {
  localStorage.setItem('hospital_app_user', JSON.stringify(s));
  localStorage.setItem('selectedHospital', 'hope');
}, SESSION);

// Mock Supabase REST: fail users (keeps injected session), serve our data.
await ctx.route('**/rest/v1/users*', r => r.abort());
await ctx.route('**/rest/v1/task_optimizer_logs*', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LOGS) }));
await ctx.route('**/rest/v1/task_optimizer_actions*', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ACTIONS) }));

try {
  await page.goto(`${BASE}/task-optimizer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const heading = await page.locator('h1:has-text("Task Optimizer")').count();
  log('Task Optimizer heading present:', heading > 0, '| url:', page.url());
  await page.screenshot({ path: `${OUT}/1-entry.png`, fullPage: true });
  if (heading === 0) { log('NOT ON PAGE — bailing'); throw new Error('not on task optimizer'); }

  // ── Phase 3 ──
  await page.locator('#staff-designation').click();
  await page.waitForTimeout(400);
  await page.locator('[role="option"]:has-text("Nursing")').first().click();
  await page.waitForTimeout(500);
  const hint = await page.locator('text=Common tasks for').count();
  const chipCount = await page.locator('.border-dashed').count();
  log('Phase 3 — "Common tasks" hint:', hint > 0, '| chips:', chipCount);
  await page.screenshot({ path: `${OUT}/2-prefill-chips.png`, fullPage: true });
  let chipWorked = false;
  if (chipCount) {
    await page.locator('.border-dashed').first().click();
    await page.waitForTimeout(300);
    chipWorked = (await page.locator('#staff-tasks').inputValue()).trim().length > 0;
  }
  log('Phase 3 — chip populated textarea:', chipWorked);

  // ── Phase 1 ──
  await page.locator('button:has-text("View Submissions")').click();
  await page.waitForTimeout(1500);
  await page.locator('button.flex.w-full').first().click().catch(() => {});
  await page.waitForTimeout(800);
  const statusLabels = await page.locator('text=Status').count();
  const doneBadge = await page.locator('text=mins/day saved').count();
  log('Phase 1 — status controls:', statusLabels, '| "mins/day saved" inputs (done items):', doneBadge);
  await page.screenshot({ path: `${OUT}/3-submission-expanded.png`, fullPage: true });

  // ── Phase 2 ──
  await page.locator('button:has-text("Insights")').click();
  await page.waitForTimeout(2500);
  const kpi = await page.locator('text=Tasks analysed').count();
  const automatable = await page.locator('text=Automatable').count();
  const svgs = await page.locator('svg.recharts-surface').count();
  log('Phase 2 — KPI "Tasks analysed":', kpi > 0, '| "Automatable":', automatable > 0, '| recharts surfaces:', svgs);
  await page.screenshot({ path: `${OUT}/4-insights.png`, fullPage: true });

  log('console errors:', consoleErrors.length);
  consoleErrors.slice(0, 6).forEach(e => log('   ', e.slice(0, 140)));
  log('RESULT_OK');
} catch (err) {
  log('RESULT_FAIL', err?.message);
  await page.screenshot({ path: `${OUT}/fail.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
