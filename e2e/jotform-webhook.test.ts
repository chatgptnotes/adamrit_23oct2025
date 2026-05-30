// Local test for the JotForm -> Task Optimizer webhook handler.
// Stubs global fetch to intercept the Supabase insert (no real DB), then runs
// the secret guard, method guard, JotForm rawRequest mapping, normalized JSON
// path, and validation failure.
//
// Run:  npx vite-node e2e/jotform-webhook.test.ts
process.env.JOTFORM_WEBHOOK_SECRET = 'test-secret';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.SUPABASE_URL = 'http://stub.local';

let lastInsertBody: any = null;
const origFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init: any) => {
  const u = String(url);
  if (u.includes('/rest/v1/task_optimizer_logs')) {
    lastInsertBody = init?.body ? JSON.parse(init.body) : null;
    return new Response(null, { status: 201 });
  }
  return origFetch(url, init);
}) as typeof fetch;

const handler = (await import('../api/jotform-webhook.ts')).default;

function mockRes() {
  const res: any = { statusCode: 200, body: null };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: any) => { res.body = b; return res; };
  return res;
}
async function call(req: any) {
  lastInsertBody = null;
  const res = mockRes();
  await handler(req as any, res as any);
  return res;
}

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); }
}

// 1. Wrong method
let r = await call({ method: 'GET', query: {}, headers: {}, body: {} });
check('GET -> 405', r.statusCode === 405, r.statusCode);

// 2. Wrong secret
r = await call({ method: 'POST', query: { secret: 'nope' }, headers: {}, body: { staff_name: 'A', designation: 'Nursing', tasks: ['x'] } });
check('bad secret -> 401', r.statusCode === 401, r.statusCode);

// 3. Normalized JSON body (secret via query)
r = await call({
  method: 'POST',
  query: { secret: 'test-secret' },
  headers: {},
  body: { staff_name: 'Anita Desai', designation: 'Billing', tasks: ['Generate bills', 'Reconcile cash'], hospital_type: 'hope' },
});
check('normalized JSON -> 200', r.statusCode === 200, r.body);
check('  inserted staff_name', lastInsertBody?.staff_name === 'Anita Desai', lastInsertBody);
check('  inserted designation', lastInsertBody?.designation === 'Billing');
check('  inserted tasks array (2)', Array.isArray(lastInsertBody?.tasks) && lastInsertBody.tasks.length === 2, lastInsertBody?.tasks);
check('  hospital_type carried', lastInsertBody?.hospital_type === 'hope');
check('  ai_suggestions null', lastInsertBody?.ai_suggestions === null);

// 4. JotForm rawRequest payload (secret via header), newline-delimited tasks
r = await call({
  method: 'POST',
  query: {},
  headers: { 'x-webhook-secret': 'test-secret' },
  body: {
    formID: '2500',
    rawRequest: JSON.stringify({
      q3_name: 'Priya Sharma',
      q4_designation: 'Nursing',
      q5_tasks: 'Enter vitals\nCall patients\nPrepare census',
      q6_hospital: 'hope',
      q7_email: 'priya@demo.hope',
    }),
  },
});
check('JotForm raw -> 200', r.statusCode === 200, r.body);
check('  mapped name from q3_name', lastInsertBody?.staff_name === 'Priya Sharma', lastInsertBody?.staff_name);
check('  mapped designation', lastInsertBody?.designation === 'Nursing', lastInsertBody?.designation);
check('  split tasks into 3', Array.isArray(lastInsertBody?.tasks) && lastInsertBody.tasks.length === 3, lastInsertBody?.tasks);
check('  mapped email', lastInsertBody?.user_email === 'priya@demo.hope', lastInsertBody?.user_email);

// 5. Validation failure (no tasks, no designation)
r = await call({ method: 'POST', query: { secret: 'test-secret' }, headers: {}, body: { staff_name: 'X' } });
check('missing fields -> 400', r.statusCode === 400, r.statusCode);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
