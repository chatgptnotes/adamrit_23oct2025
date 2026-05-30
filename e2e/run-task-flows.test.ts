// Unit test for the Jotflow execution engine (runTaskFlows): trigger matching,
// condition evaluation (AND), action firing, message interpolation, and the
// disabled-flow / set_status guards. Supabase REST is stubbed so no network.
//
// Run:  npx vite-node e2e/run-task-flows.test.ts
const origFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).includes('/rest/v1/')) return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
  return origFetch(url, init);
}) as typeof fetch;

const { runTaskFlows } = await import('../src/lib/runTaskFlows.ts');

function flow(overrides: any = {}) {
  return {
    id: 'f1', hospital_type: 'hope', name: 'Test flow', enabled: true,
    created_at: '', updated_at: '',
    nodes: [
      { id: 't1', type: 'trigger', position: { x: 0, y: 0 }, data: { kind: 'trigger', label: 'T', config: { event: 'status_changed', toStatus: 'done' } } },
      { id: 'a1', type: 'action', position: { x: 0, y: 0 }, data: { kind: 'action', label: 'A', config: { type: 'notify', message: '{task} by {staff}' } } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'a1' }],
    ...overrides,
  };
}

const baseCtx = {
  staffName: 'Priya', designation: 'Nursing', suggestionType: 'automate' as const,
  status: 'done' as const, timeSavedMins: 30, taskText: 'Enter vitals',
};

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); }
}

// 1. Trigger matches (status done) -> notify fires with interpolation
let res = await runTaskFlows([flow()], baseCtx, null);
check('trigger match fires action', res.length === 1, res);
check('  message interpolated', res[0]?.message === 'Enter vitals by Priya', res[0]?.message);

// 2. Trigger does NOT match (status in_progress)
res = await runTaskFlows([flow()], { ...baseCtx, status: 'in_progress' }, null);
check('non-matching status -> no fire', res.length === 0, res);

// 3. toStatus 'any' fires on any status
const anyFlow = flow();
anyFlow.nodes[0].data.config = { event: 'status_changed', toStatus: 'any' } as any;
res = await runTaskFlows([anyFlow], { ...baseCtx, status: 'dismissed' }, null);
check('toStatus any fires on dismissed', res.length === 1, res);

// 4. Condition passes (suggestion_type eq automate)
const condPass = flow();
condPass.nodes.splice(1, 0, { id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { kind: 'condition', label: 'C', config: { field: 'suggestion_type', op: 'eq', value: 'automate' } } } as any);
res = await runTaskFlows([condPass], baseCtx, null);
check('passing condition -> fires', res.length === 1, res);

// 5. Condition fails (designation eq Billing)
const condFail = flow();
condFail.nodes.splice(1, 0, { id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { kind: 'condition', label: 'C', config: { field: 'designation', op: 'eq', value: 'Billing' } } } as any);
res = await runTaskFlows([condFail], baseCtx, null);
check('failing condition -> no fire', res.length === 0, res);

// 6. gte condition on time_saved_mins (30 >= 15)
const gte = flow();
gte.nodes.splice(1, 0, { id: 'c1', type: 'condition', position: { x: 0, y: 0 }, data: { kind: 'condition', label: 'C', config: { field: 'time_saved_mins', op: 'gte', value: '15' } } } as any);
res = await runTaskFlows([gte], baseCtx, null);
check('gte time_saved passes (30>=15)', res.length === 1, res);

// 7. Disabled flow skipped
res = await runTaskFlows([flow({ enabled: false })], baseCtx, null);
check('disabled flow skipped', res.length === 0, res);

// 8. set_status action returns target message (no row id -> no DB write, no loop)
const setStatus = flow();
setStatus.nodes[1].data.config = { type: 'set_status', setStatus: 'in_progress' } as any;
res = await runTaskFlows([setStatus], baseCtx, null);
check('set_status reports target', res[0]?.message?.includes('in_progress') === true, res[0]?.message);

// 9. whatsapp disabled-by-default reports "disabled"
const wa = flow();
wa.nodes[1].data.config = { type: 'whatsapp', message: 'ping', enabled: false } as any;
res = await runTaskFlows([wa], baseCtx, null);
check('whatsapp off -> intent only', res[0]?.message?.toLowerCase().includes('disabled') === true, res[0]?.message);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
