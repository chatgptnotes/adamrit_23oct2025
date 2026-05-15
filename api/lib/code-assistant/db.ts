// CRUD helpers for code_assistant_generations.

import { getServiceClient } from './serviceClient';

export type GenerationRow = {
  id: string;
  user_id: string;
  prompt: string;
  attached_files: string[];
  status: string;
  [key: string]: unknown;
};

export async function insertGeneration(row: {
  user_id: string;
  prompt: string;
  attached_files: string[];
  status: string;
  parent_generation_id?: string | null;
}): Promise<GenerationRow> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('code_assistant_generations')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`insert generation: ${error.message}`);
  return data as GenerationRow;
}

export async function updateGeneration(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const sb = getServiceClient();
  const { error } = await sb
    .from('code_assistant_generations')
    .update(patch)
    .eq('id', id);
  if (error) throw new Error(`update generation: ${error.message}`);
}

export async function getGeneration(id: string): Promise<GenerationRow | null> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('code_assistant_generations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`get generation: ${error.message}`);
  return data as GenerationRow | null;
}
