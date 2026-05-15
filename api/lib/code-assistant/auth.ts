// Authenticate the caller against Supabase and return user + role.
// Returns null if no valid session.

import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export type SessionUser = {
  id: string;
  email: string | null;
  role: string;
};

export async function getSessionUser(req: VercelRequest): Promise<SessionUser | null> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  // Role can be in app_metadata.role, user_metadata.role, or a 'role' table.
  // For Phase 1, accept the role from JWT claims (set via Supabase).
  const role =
    (data.user.app_metadata as any)?.role ??
    (data.user.user_metadata as any)?.role ??
    'user';

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role,
  };
}
