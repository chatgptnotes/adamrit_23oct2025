// GET /api/superadmin/code-assistant/history
// Returns the calling admin's past generations (most recent first).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { getServiceClient } from '../../lib/code-assistant/serviceClient';
import { errorResponse } from '../../lib/code-assistant/responses';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  const sb = getServiceClient();
  const { data, error } = await sb
    .from('code_assistant_generations')
    .select('id, prompt, status, created_at, promoted_at, reverted_at, cost_usd, branch_name, preview_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ ok: false, error: { code: 'unknown-error', message: error.message } });

  res.json({
    ok: true,
    generations: (data ?? []).map((g: any) => ({
      ...g,
      prompt: g.prompt?.slice(0, 200) ?? '',
    })),
  });
}
