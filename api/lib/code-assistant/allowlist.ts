// Server-side path validator. Mirror copy lives at src/lib/code-assistant/allowlist.ts.
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §22

import { minimatch } from 'minimatch';

export const EDIT_ALLOWLIST = [
  'src/pages/*.tsx',
  'src/pages/*/*.tsx',
  'src/components/*.tsx',
  'src/components/**/*.tsx',
  'src/hooks/*.ts',
  'src/services/*.ts',
  'src/queries/*.ts',
  'src/utils/*.ts',
  'src/lib/*.ts',
  'src/types/*.ts',
  'src/contexts/*.tsx',
];

export const LOCK_LIST = new Set([
  'src/pages/FinalBill.tsx',
  'src/pages/FinalBillTest.tsx',
  'src/pages/EditFinalBill.tsx',
  'src/pages/FinalBill.tsx.backup',
  'src/pages/FinancialSummary.tsx',
  'src/pages/FinancialSummary-backup.tsx',
  'src/lib/permissions.ts',
  'src/lib/ruleEngine.ts',
  'src/lib/sandbox.worker.ts',
  'src/lib/sandbox.api.ts',
  'src/lib/code-assistant/allowlist.ts',
  'src/integrations/supabase/types.ts',
  'src/integrations/supabase/client.ts',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  '.env.example',
]);

export const LOCK_DIRS = [
  '.github/',
  'supabase/migrations/',
  'scripts/',
  'e2e/',
  'api/',
];

export type ValidatePathResult = { ok: true } | { ok: false; reason: 'file-in-locklist' | 'file-not-in-allowlist' };

export function validatePath(path: string): ValidatePathResult {
  const normalized = path.replace(/^\.\//, '').replace(/\\/g, '/');
  if (normalized.includes('..')) return { ok: false, reason: 'file-not-in-allowlist' };
  if (LOCK_LIST.has(normalized)) return { ok: false, reason: 'file-in-locklist' };
  for (const dir of LOCK_DIRS) {
    if (normalized.startsWith(dir)) return { ok: false, reason: 'file-in-locklist' };
  }
  for (const glob of EDIT_ALLOWLIST) {
    if (minimatch(normalized, glob)) return { ok: true };
  }
  return { ok: false, reason: 'file-not-in-allowlist' };
}
