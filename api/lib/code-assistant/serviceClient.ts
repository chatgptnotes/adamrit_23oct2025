// Service-role Supabase client for writes that need to bypass RLS.
// NEVER expose service role to the browser.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL) not configured');
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
