import { Wand2, Scissors, Users, CheckCircle2 } from 'lucide-react';
import type { SuggestionType } from '@/lib/optimizeTasks';

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
