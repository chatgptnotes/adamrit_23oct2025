// GET /api/superadmin/code-assistant/preview-status?id=<generationId>
// Polls Vercel for the preview-deployment status of the generation's branch.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { getGeneration, updateGeneration } from '../../lib/code-assistant/db';
import { errorResponse } from '../../lib/code-assistant/responses';

const VERCEL_API = 'https://api.vercel.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  const id = (req.query.id ?? req.query.generationId) as string | undefined;
  if (!id) return res.status(400).json({ ok: false, error: { code: 'missing-id', message: 'generation id required' } });

  const gen = await getGeneration(id);
  if (!gen) return res.status(404).json({ ok: false, error: { code: 'not-found', message: 'generation not found' } });
  if (gen.user_id !== user.id) return errorResponse(res, 'not-superadmin', 403);

  if (!gen.branch_name) {
    return res.json({ ok: true, status: 'building', elapsed_sec: elapsedSecSince(gen.created_at as string) });
  }

  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return errorResponse(res, !token ? 'missing-vercel-token' : 'missing-api-key', 503);
  }

  const teamId = process.env.VERCEL_TEAM_ID ?? '';
  const url = `${VERCEL_API}/v6/deployments?projectId=${projectId}&meta-githubCommitRef=${encodeURIComponent(gen.branch_name as string)}&limit=1${teamId ? `&teamId=${teamId}` : ''}`;

  let deploy: any;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      return errorResponse(res, 'vercel-network-error', 502, { status: r.status });
    }
    const data = await r.json();
    deploy = data.deployments?.[0];
  } catch (e: any) {
    return errorResponse(res, 'vercel-network-error', 502, { message: e.message });
  }

  if (!deploy) {
    return res.json({ ok: true, status: 'building', elapsed_sec: elapsedSecSince(gen.created_at as string) });
  }

  if (deploy.state === 'READY') {
    const previewUrl = `https://${deploy.url}`;
    if (gen.preview_url !== previewUrl) {
      await updateGeneration(id, { preview_url: previewUrl, status: 'preview-ready' });
    }
    return res.json({
      ok: true,
      status: 'ready',
      preview_url: previewUrl,
      build_time_sec: deploy.ready ? Math.round((deploy.ready - deploy.createdAt) / 1000) : null,
      build_id: deploy.uid,
    });
  }

  if (deploy.state === 'ERROR' || deploy.state === 'CANCELED') {
    await updateGeneration(id, { status: 'failed-vercel-build', error_code: 'vercel-build-failed', error_details: { state: deploy.state, deployment_id: deploy.uid } });
    return res.status(200).json({
      ok: false,
      error: { code: 'vercel-build-failed', title: 'Preview build failed', message: 'Vercel build failed.', hint: 'Open the build log.', details: { state: deploy.state, deployment_id: deploy.uid } },
      build_log_url: `https://vercel.com/_/${deploy.uid}/logs`,
    });
  }

  return res.json({ ok: true, status: 'building', elapsed_sec: elapsedSecSince(gen.created_at as string), build_id: deploy.uid });
}

function elapsedSecSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}
