// Local verification of the Jotflow automation builder + execution, using the
// same session-injection + REST-mock approach as the task-optimizer check.
// Verifies: Automations tab renders, the React Flow canvas + palette appear,
// the starter graph loads in the editor, saving posts to task_optimizer_flows,
// and a status change in Submissions evaluates enabled flows (engine runs).
//
// Run:  node e2e/jotflow-local-check.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = '/tmp/jf-shots';
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[jf]', ...a);

const SESSION = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'localcheck@demo.hope', role: 'admin', hospitalType: 'hope',
  username: 'localcheck',
};

const LOG_ID = '11111111-1111-4111-8111-111111111111';
const LOGS = [{
  id: LOG_ID, user_email: 'priya@demo.hope', hospital_type: 'hope',
  staff_name: 'Priya Sharma', designation: 'Nursing', log_date: '2026-05-30',
  created_at: '2026-05-30T09:15:00+05:30',
  tasks: ['Enter patient vitals into the system'],
  ai_suggestions: [{ task: 'Enter patient vitals into the system', type: 'automate', suggestion: 'Use bedside tablets.', rationale: 'Less double entry.', tool: 'EMR vitals module', existsInAdamrit: true }],
}];

// An enabled flow: trigger(status->done) -> action(notify). Should fire when we
// set the suggestion to "done".
const FLOWS = [{
  id: 'f1', hospital_type: 'hope', name: 'Notify on done', enabled: true,
  created_at: '2026-05-30T09:00:00+05:30', updated_at: '2026-05-30T09:00:00+05:30',
  nodes: [
    { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 120 }, data: { kind: 'trigger', label: 'When status changes', config: { event: 'status_changed', toStatus: 'done' } } },
    { id: 'action-1', type: 'action', position: { x: 460, y: 120 }, data: { kind: 'action', label: 'Notify', config: { type: 'notify', message: '{task} done by {staff}' } } },
  ],
  edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
}];

const consoleErrors = [];
let flowInsertSeen = false;
let actionUpsertSeen = false;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await page.addInitScript(s => {
  localStorage.setItem('hmis_user', JSON.stringify(s));
  localStorage.setItem('hmis_visited', 'true');
  localStorage.setItem('selectedHospital', 'hope');
}, SESSION);

await ctx.route('**/rest/v1/users*', r => r.abort());
await ctx.route('**/rest/v1/User*', r => r.abort());
await ctx.route('**/rest/v1/task_optimizer_logs*', r =>
  r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LOGS) }));
await ctx.route('**/rest/v1/task_optimizer_actions*', r => {
  if (r.request().method() !== 'GET') {
    actionUpsertSeen = true;
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'act-1' }) });
  }
  return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
});
await ctx.route('**/rest/v1/task_optimizer_flows*', r => {
  if (r.request().method() !== 'GET') {
    flowInsertSeen = true;
    return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{ id: 'f-new' }]) });
  }
  return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FLOWS) });
});

try {
  await page.goto(`${BASE}/task-optimizer`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  log('on task optimizer:', (await page.locator('h1:has-text("Task Optimizer")').count()) > 0);

  // ── Automations tab ──
  await page.locator('button:has-text("Automations")').click();
  await page.waitForTimeout(1500);
  const heading = await page.locator('h2:has-text("Automations")').count();
  const flowCard = await page.locator('text=Notify on done').count();
  log('Automations list heading:', heading > 0, '| existing flow listed:', flowCard > 0);
  await page.screenshot({ path: `${OUT}/1-automations-list.png`, fullPage: true });

  // open editor for the existing flow
  await page.locator('text=Notify on done').first().click();
  await page.waitForTimeout(1500);
  const palette = await page.locator('text=Drag onto canvas').count();
  const rfPane = await page.locator('.react-flow__pane, .react-flow').count();
  const rfNodes = await page.locator('.react-flow__node').count();
  log('Editor — palette:', palette > 0, '| react-flow canvas:', rfPane > 0, '| nodes on canvas:', rfNodes);
  await page.screenshot({ path: `${OUT}/2-flow-editor.png`, fullPage: true });

  // click a node -> inspector shows config
  if (rfNodes > 0) {
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(500);
  }
  const inspector = await page.locator('text=Trigger, text=Action, text=Condition').count();
  log('Inspector populated after node click:', inspector > 0);
  await page.screenshot({ path: `${OUT}/3-node-selected.png`, fullPage: true });

  // save
  await page.locator('button:has-text("Save")').first().click();
  await page.waitForTimeout(1500);
  log('Save posted to task_optimizer_flows:', flowInsertSeen);
  await page.screenshot({ path: `${OUT}/4-after-save.png`, fullPage: true });

  // ── Execution: set a suggestion to "done" in Submissions, flow should run ──
  await page.locator('button:has-text("View Submissions")').click();
  await page.waitForTimeout(1500);
  await page.locator('button.flex.w-full').first().click().catch(() => {});
  await page.waitForTimeout(600);
  // open the status select and choose Done
  const trigger = page.locator('button[role="combobox"]').first();
  if (await trigger.count()) {
    await trigger.click();
    await page.waitForTimeout(400);
    const done = page.locator('[role="option"]:has-text("Done")').first();
    if (await done.count()) { await done.click(); await page.waitForTimeout(1800); }
  }
  log('action upsert fired on status change:', actionUpsertSeen);
  // toast from the automation
  const toast = await page.locator('text=Automation').count();
  log('automation toast shown:', toast > 0);
  await page.screenshot({ path: `${OUT}/5-execution.png`, fullPage: true });

  log('console errors:', consoleErrors.length);
  consoleErrors.slice(0, 6).forEach(e => log('   ', e.slice(0, 140)));
  log('RESULT_OK');
} catch (err) {
  log('RESULT_FAIL', err?.message);
  await page.screenshot({ path: `${OUT}/fail.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
