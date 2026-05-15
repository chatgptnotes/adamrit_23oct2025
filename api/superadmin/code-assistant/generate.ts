// POST /api/superadmin/code-assistant/generate
// The main pipeline — see plan §6.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { errorResponse, successResponse } from '../../lib/code-assistant/responses';
import { validatePrompt, validateAttachments } from '../../lib/code-assistant/validate';
import { validatePath } from '../../lib/code-assistant/allowlist';
import { checkAndIncrementRateLimit, addCost, RateLimitError } from '../../lib/code-assistant/ratelimit';
import { loadContext, ContextError } from '../../lib/code-assistant/context';
import { callDeepSeek, AIError } from '../../lib/code-assistant/deepseek';
import { commitToGitHub, GitHubError } from '../../lib/code-assistant/github';
import { insertGeneration, updateGeneration } from '../../lib/code-assistant/db';
import { readCurrentFile, countLineDiff } from '../../lib/code-assistant/diff';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: { code: 'method-not-allowed', message: 'POST only' } });

  // ─── Stage 2 — Auth ────────────────────────────────────────────────────
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  const body = req.body ?? {};

  // ─── Stage 1 — Frontend echo validation ────────────────────────────────
  const promptErr = validatePrompt(body.prompt);
  if (promptErr) return errorResponse(res, promptErr.code, 400);
  const attErr = validateAttachments(body.attached_files ?? []);
  if (attErr) return errorResponse(res, attErr.code, 400);

  // ─── Stage 3 — Path validation ─────────────────────────────────────────
  for (const path of body.attached_files ?? []) {
    const v = validatePath(path as string);
    if (!v.ok) return errorResponse(res, v.reason, 400, { path });
  }

  // ─── Stage 2 cont. — Rate limit + cost cap ────────────────────────────
  try {
    await checkAndIncrementRateLimit(user.id);
  } catch (e) {
    if (e instanceof RateLimitError) {
      return errorResponse(res, e.code, 429, e.details);
    }
    throw e;
  }

  // ─── Stage 4 — Load context ────────────────────────────────────────────
  let ctx;
  try {
    ctx = await loadContext(body.attached_files ?? []);
  } catch (e) {
    if (e instanceof ContextError) return errorResponse(res, e.code, 400, e.details as any);
    throw e;
  }

  // ─── Persist a row so we can track this generation ────────────────────
  const gen = await insertGeneration({
    user_id: user.id,
    prompt: body.prompt,
    attached_files: body.attached_files ?? [],
    parent_generation_id: body.parent_generation_id ?? null,
    status: 'calling-deepseek',
  });

  // ─── Stage 5 — Call DeepSeek ───────────────────────────────────────────
  let ai;
  try {
    ai = await callDeepSeek(body.prompt, ctx);
  } catch (e) {
    if (e instanceof AIError) {
      await updateGeneration(gen.id, { status: mapAiCodeToStatus(e.code), error_code: e.code, error_details: e.details as any });
      return errorResponse(res, e.code, 502, e.details as any, { generation_id: gen.id });
    }
    throw e;
  }

  await updateGeneration(gen.id, {
    plan: ai.plan,
    proposed_files: ai.files,
    warnings: ai.warnings,
    provider_used: ai.provider,
    deepseek_model: process.env.DEEPSEEK_MODEL ?? 'deepseek-coder',
    request_tokens: ai.request_tokens,
    response_tokens: ai.response_tokens,
    cost_usd: ai.cost_usd,
    status: 'validating-response',
  });
  await addCost(user.id, ai.cost_usd);

  // ─── Stage 6 — Validate DeepSeek's response ────────────────────────────
  if (ai.files.length === 0) {
    await updateGeneration(gen.id, { status: 'failed-empty-changeset' });
    return res.status(200).json({
      ok: false,
      generation_id: gen.id,
      error: { code: 'empty-changeset', title: 'No code changes proposed', message: 'DeepSeek decided no files needed editing.', hint: 'Refine the prompt.', details: { plan: ai.plan } },
      plan: ai.plan,
    });
  }

  for (const f of ai.files) {
    const v = validatePath(f.path);
    if (!v.ok) {
      await updateGeneration(gen.id, { status: mapPathReasonToStatus(v.reason), error_code: v.reason });
      return errorResponse(res, v.reason, 400, { path: f.path }, { generation_id: gen.id });
    }
  }

  // ─── Stage 7 — Commit to GitHub ────────────────────────────────────────
  let branch;
  try {
    branch = await commitToGitHub(user.id, gen.id, ai.files);
  } catch (e) {
    if (e instanceof GitHubError) {
      await updateGeneration(gen.id, { status: mapGhCodeToStatus(e.code), error_code: e.code, error_details: e.details as any });
      return errorResponse(res, e.code, 502, e.details as any, { generation_id: gen.id });
    }
    throw e;
  }

  await updateGeneration(gen.id, {
    branch_name: branch.name,
    commit_sha: branch.sha,
    status: 'preview-pending',
  });

  // ─── Build diff metadata for the response ─────────────────────────────
  const files = await Promise.all(ai.files.map(async (f) => {
    const old = await readCurrentFile(f.path);
    const { adds, dels } = countLineDiff(old, f.content);
    return {
      path: f.path,
      action: f.action,
      new_content: f.content,
      old_content: old,
      additions: adds,
      deletions: dels,
    };
  }));

  return successResponse(res, {
    generation_id: gen.id,
    plan: ai.plan,
    files,
    warnings: ai.warnings,
    branch_name: branch.name,
    commit_sha: branch.sha,
    estimated_cost_usd: ai.cost_usd,
    provider_used: ai.provider,
    preview_url: null,
  });
}

function mapAiCodeToStatus(code: string): string {
  if (code === 'deepseek-auth-failed') return 'failed-deepseek-auth';
  if (code === 'deepseek-rate-limit') return 'failed-deepseek-rate-limit';
  if (code === 'deepseek-timeout') return 'failed-deepseek-timeout';
  if (code === 'deepseek-server-error') return 'failed-deepseek-server';
  if (code === 'deepseek-content-filter') return 'failed-deepseek-content-filter';
  if (code === 'deepseek-network-error') return 'failed-deepseek-network';
  if (code === 'malformed-response') return 'failed-malformed-response';
  return 'failed-unknown';
}

function mapGhCodeToStatus(code: string): string {
  if (code === 'github-auth-failed') return 'failed-github-auth';
  if (code === 'github-conflict') return 'failed-github-conflict';
  if (code === 'github-rate-limit') return 'failed-github-rate-limit';
  if (code === 'github-network-error') return 'failed-github-network';
  return 'failed-unknown';
}

function mapPathReasonToStatus(reason: 'file-in-locklist' | 'file-not-in-allowlist'): string {
  return reason === 'file-in-locklist' ? 'failed-locklist' : 'failed-allowlist';
}
