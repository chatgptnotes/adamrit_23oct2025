// Self-check endpoint for the Code Assistant feature.
// GET /api/superadmin/code-assistant/health
// Returns the configuration status of every dependency.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { errorResponse } from '../../lib/code-assistant/responses';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  res.json({
    ok: true,
    checks: {
      deepseek: { ok: !!process.env.DEEPSEEK_API_KEY, error: process.env.DEEPSEEK_API_KEY ? undefined : 'DEEPSEEK_API_KEY not set' },
      github:   { ok: !!process.env.GITHUB_TOKEN, error: process.env.GITHUB_TOKEN ? undefined : 'GITHUB_TOKEN not set' },
      vercel:   { ok: !!process.env.VERCEL_API_TOKEN, error: process.env.VERCEL_API_TOKEN ? undefined : 'VERCEL_API_TOKEN not set' },
      supabase: { ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY, error: process.env.SUPABASE_SERVICE_ROLE_KEY ? undefined : 'SUPABASE_SERVICE_ROLE_KEY not set' },
    },
    user: { id: user.id, email: user.email, role: user.role },
  });
}
