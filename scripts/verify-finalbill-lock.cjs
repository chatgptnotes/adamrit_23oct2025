#!/usr/bin/env node
/**
 * Self-test for the FinalBill deploy lock.
 *
 * Confirms every piece of the freeze is still wired:
 *   1. Guard script exists
 *   2. Baseline file exists
 *   3. package.json has `prebuild` pointing to the guard
 *   4. The guard passes (FinalBill.tsx matches baseline)
 *   5. Companion Claude skill exists
 *
 * Exits 0 only if everything is intact. Use:
 *   npm run verify:finalbill-lock
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GUARD = path.join(ROOT, 'scripts/check-finalbill-locked.cjs');
const BASELINE = path.join(ROOT, 'scripts/finalbill-baseline.sha256');
const PKG = path.join(ROOT, 'package.json');
const SKILL = path.join(ROOT, '.claude/skills/finalbill-locked/SKILL.md');
const TARGET = path.join(ROOT, 'src/pages/FinalBill.tsx');

const tick = '✓';
const cross = '✗';
const results = [];
let failed = 0;

function check(label, ok, detail) {
  results.push({ label, ok, detail });
  if (!ok) failed++;
}

check('Guard script present', fs.existsSync(GUARD), GUARD);
check('Baseline file present', fs.existsSync(BASELINE), BASELINE);
check('Frozen target present', fs.existsSync(TARGET), TARGET);
check('Companion Claude skill present', fs.existsSync(SKILL), SKILL);

let pkgScripts = {};
try {
  pkgScripts = JSON.parse(fs.readFileSync(PKG, 'utf8')).scripts || {};
} catch (e) {
  check('package.json readable', false, e.message);
}
const prebuild = pkgScripts.prebuild || '';
check(
  'package.json: prebuild wired to guard',
  prebuild.includes('check-finalbill-locked'),
  `prebuild = "${prebuild}"`
);

if (fs.existsSync(GUARD) && fs.existsSync(BASELINE) && fs.existsSync(TARGET)) {
  const run = spawnSync(process.execPath, [GUARD], { encoding: 'utf8' });
  check(
    'Guard exits clean (FinalBill.tsx matches baseline)',
    run.status === 0,
    run.status === 0 ? (run.stdout || '').trim() : `exit ${run.status}: ${(run.stderr || run.stdout || '').trim().split('\n').pop()}`
  );
}

console.log('');
console.log('FinalBill deploy lock — self-test');
console.log('==================================');
for (const r of results) {
  const mark = r.ok ? tick : cross;
  console.log(`  [${mark}] ${r.label}`);
  if (r.detail) console.log(`        ${r.detail}`);
}
console.log('');

if (failed === 0) {
  console.log(`All ${results.length} checks passed. Deploy gate is intact.`);
  process.exit(0);
}

console.error(`${failed} of ${results.length} checks failed. Deploy gate is NOT intact.`);
console.error('Restore the missing pieces before pushing to main, or deploys may slip through unguarded.');
process.exit(1);
