import { Wand2, Scissors, Users, CheckCircle2, Lightbulb, Loader2, Check, X } from 'lucide-react';
import type { SuggestionType, ActionStatus } from '@/lib/optimizeTasks';

// Visual treatment per suggestion type — label, badge classes, and icon.
// Shared by the entry view and the submissions log so both render identically.
const TYPE_META: Record<
  SuggestionType,
  { label: string; badge: string; Icon: typeof Wand2 }
> = {
  automate: { label: 'Automate', badge: 'bg-blue-100 text-blue-700 border-blue-200', Icon: Wand2 },
  reduce: { label: 'Reduce', badge: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Scissors },
  delegate: { label: 'Delegate', badge: 'bg-purple-100 text-purple-700 border-purple-200', Icon: Users },
  keep: { label: 'Keep', badge: 'bg-gray-100 text-gray-600 border-gray-200', Icon: CheckCircle2 },
};

export function SuggestionBadge({ type }: { type: SuggestionType }) {
  const meta = TYPE_META[type];
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

// Visual treatment per workflow status — shared by the submissions log and the
// insights panel so a status looks the same everywhere it appears.
export const STATUS_META: Record<
  ActionStatus,
  { label: string; badge: string; Icon: typeof Wand2 }
> = {
  suggested: { label: 'Suggested', badge: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Lightbulb },
  in_progress: { label: 'In progress', badge: 'bg-blue-100 text-blue-700 border-blue-200', Icon: Loader2 },
  done: { label: 'Done', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: Check },
  dismissed: { label: 'Dismissed', badge: 'bg-gray-100 text-gray-500 border-gray-200', Icon: X },
};

export function StatusBadge({ status }: { status: ActionStatus }) {
  const meta = STATUS_META[status];
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
