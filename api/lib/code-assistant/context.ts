// Load relevant code context for DeepSeek.
// Reads CLAUDE.md + always-files + attached files from disk on the Vercel function.

import fs from 'node:fs/promises';
import path from 'node:path';
import type { ContextFile } from './deepseek';

const REPO_ROOT = process.env.CODE_ASSIST_REPO_ROOT ?? process.cwd();
const BUDGET_CHARS = parseInt(process.env.CODE_ASSIST_CONTEXT_BUDGET_CHARS ?? '200000', 10);

const ALWAYS_INCLUDE = [
  'CLAUDE.md',
  'src/components/AppRoutes.tsx',
  'src/components/AppSidebar.tsx',
];

export class ContextError extends Error {
  constructor(public code: string, public details?: unknown) {
    super(code);
  }
}

export async function loadContext(attached: string[]): Promise<ContextFile[]> {
  const allPaths = Array.from(new Set([...ALWAYS_INCLUDE, ...attached]));
  const out: ContextFile[] = [];
  let totalChars = 0;

  for (const rel of allPaths) {
    const abs = path.resolve(REPO_ROOT, rel);
    let content: string;
    try {
      content = await fs.readFile(abs, 'utf8');
    } catch {
      if (attached.includes(rel)) {
        throw new ContextError('file-not-found', { path: rel });
      }
      continue;
    }
    totalChars += content.length;
    if (totalChars > BUDGET_CHARS) {
      throw new ContextError('context-too-large', { n: totalChars, cap: BUDGET_CHARS });
    }
    out.push({ path: rel, content });
  }

  return out;
}
