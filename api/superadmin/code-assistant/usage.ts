// GET /api/superadmin/code-assistant/usage
// Returns the calling admin's current hour / day / month usage + caps.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../../lib/code-assistant/auth';
import { errorResponse } from '../../lib/code-assistant/responses';
import { getUsage } from '../../lib/code-assistant/ratelimit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) return errorResponse(res, 'not-superadmin', 401);
  if (user.role !== 'superadmin') return errorResponse(res, 'not-superadmin', 403);

  try {
    const usage = await getUsage(user.id);
    res.json({ ok: true, ...usage });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: { code: 'unknown-error', message: e.message } });
  }
}
