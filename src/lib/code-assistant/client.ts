// Frontend SDK calling the Code Assistant API endpoints.

import { supabase } from '@/integrations/supabase/client';
import type { GenerationResponse } from './types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function generateCode(payload: {
  prompt: string;
  attached_files: string[];
  parent_generation_id?: string;
}): Promise<GenerationResponse> {
  const res = await fetch('/api/superadmin/code-assistant/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getPreviewStatus(generationId: string) {
  const res = await fetch(`/api/superadmin/code-assistant/preview-status?id=${generationId}`, {
    headers: await authHeaders(),
  });
  return res.json();
}

export async function getHealth() {
  const res = await fetch('/api/superadmin/code-assistant/health', {
    headers: await authHeaders(),
  });
  return res.json();
}

export async function getUsage() {
  const res = await fetch('/api/superadmin/code-assistant/usage', {
    headers: await authHeaders(),
  });
  return res.json();
}

export async function getHistory() {
  const res = await fetch('/api/superadmin/code-assistant/history', {
    headers: await authHeaders(),
  });
  return res.json();
}

export async function searchFiles(query: string) {
  const res = await fetch(`/api/superadmin/code-assistant/files?q=${encodeURIComponent(query)}`, {
    headers: await authHeaders(),
  });
  return res.json();
}
