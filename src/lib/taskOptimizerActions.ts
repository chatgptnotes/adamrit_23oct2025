import { supabase } from '@/integrations/supabase/client';
import type { ActionStatus, SuggestionType } from '@/lib/optimizeTasks';

// One tracked action = one AI suggestion moving through its lifecycle.
// Rows are keyed by (log_id, task_text) so re-acting on the same suggestion
// updates the existing row rather than creating duplicates.
export interface TaskAction {
  id: string;
  log_id: string;
  hospital_type: string | null;
  task_text: string;
  suggestion_type: SuggestionType;
  status: ActionStatus;
  owner: string | null;
  note: string | null;
  time_saved_mins: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertActionInput {
  logId: string;
  hospitalType: string | null;
  taskText: string;
  suggestionType: SuggestionType;
  status: ActionStatus;
  owner?: string | null;
  note?: string | null;
  timeSavedMins?: number | null;
}

const TABLE = 'task_optimizer_actions';

// Load every tracked action for a hospital. Volumes are small (a handful of
// suggestions per submission), so a single scoped fetch is fine.
export async function fetchTaskActions(hospitalType: string | null): Promise<TaskAction[]> {
  let query = supabase
    .from(TABLE)
    .select('id, log_id, hospital_type, task_text, suggestion_type, status, owner, note, time_saved_mins, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(2000);
  if (hospitalType) query = query.eq('hospital_type', hospitalType);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as TaskAction[];
}

// Create-or-update the action for a (log, task) pair. Uses upsert on the unique
// (log_id, task_text) index so each suggestion has exactly one action row.
// Returns the row id so automations can target this specific action.
export async function upsertTaskAction(input: UpsertActionInput): Promise<string | null> {
  const row = {
    log_id: input.logId,
    hospital_type: input.hospitalType,
    task_text: input.taskText,
    suggestion_type: input.suggestionType,
    status: input.status,
    owner: input.owner ?? null,
    note: input.note ?? null,
    time_saved_mins: input.timeSavedMins ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'log_id,task_text' })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id?: string } | null)?.id ?? null;
}
