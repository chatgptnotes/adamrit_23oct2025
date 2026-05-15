// Diff utility — minimal unified diff for the response.
// For Phase 1 we just count add/del; the frontend renders the diff via react-diff-viewer.

import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.env.CODE_ASSIST_REPO_ROOT ?? process.cwd();

export async function readCurrentFile(rel: string): Promise<string> {
  try {
    return await fs.readFile(path.resolve(REPO_ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

export function countLineDiff(oldStr: string, newStr: string): { adds: number; dels: number } {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  let adds = 0;
  let dels = 0;
  for (const l of newLines) if (!oldSet.has(l)) adds++;
  for (const l of oldLines) if (!newSet.has(l)) dels++;
  return { adds, dels };
}
