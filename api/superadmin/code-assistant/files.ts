// GET /api/superadmin/code-assistant/files?q=<query>
// Filtered file search across the adamrit repo, respecting EDIT_ALLOWLIST + LOCK_LIST.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { errorResponse } from '../../lib/code-assistant/responses';
import { validatePath } from '../../lib/code-assistant/allowlist';

const REPO_ROOT = process.env.CODE_ASSIST_REPO_ROOT ?? process.cwd();
const SEARCH_DIRS = ['src/pages', 'src/components', 'src/hooks', 'src/lib', 'src/services', 'src/utils'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  const q = (req.query.q as string ?? '').toLowerCase();
  const limit = parseInt((req.query.limit as string) ?? '50', 10);

  const results: Array<{ path: string; matches_query: boolean; in_allowlist: boolean; in_locklist: boolean }> = [];

  for (const dir of SEARCH_DIRS) {
    const abs = path.resolve(REPO_ROOT, dir);
    let entries: string[] = [];
    try {
      entries = await listFilesRec(abs, dir);
    } catch {
      continue;
    }
    for (const rel of entries) {
      const lower = rel.toLowerCase();
      const matches = q ? lower.includes(q) : true;
      if (!matches) continue;
      const v = validatePath(rel);
      results.push({
        path: rel,
        matches_query: !!q,
        in_allowlist: v.ok,
        in_locklist: !v.ok && v.reason === 'file-in-locklist',
      });
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  res.json({ ok: true, results });
}

async function listFilesRec(absDir: string, relDir: string): Promise<string[]> {
  const out: string[] = [];
  const items = await fs.readdir(absDir, { withFileTypes: true });
  for (const item of items) {
    const absPath = path.join(absDir, item.name);
    const relPath = `${relDir}/${item.name}`;
    if (item.isDirectory()) {
      const child = await listFilesRec(absPath, relPath);
      out.push(...child);
    } else if (item.isFile() && /\.(tsx?|jsx?)$/.test(item.name)) {
      out.push(relPath);
    }
  }
  return out;
}
