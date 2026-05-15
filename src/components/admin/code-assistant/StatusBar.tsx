import { cn } from '@/lib/utils';
import { type Stage, STAGE_LABELS } from '@/lib/code-assistant/types';

const ORDER: Stage[] = [
  'validating-payload',
  'checking-rate-limit',
  'loading-context',
  'calling-deepseek',
  'parsing-response',
  'validating-response',
  'committing-to-github',
  'preview-pending',
];

export function StatusBar({
  current,
  elapsedSec,
  onCancel,
}: {
  current: Stage;
  elapsedSec: number;
  onCancel?: () => void;
}) {
  const currentIdx = ORDER.indexOf(current);
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium">{STAGE_LABELS[current]}…</span>
          <span className="text-xs text-muted-foreground">· {elapsedSec}s elapsed</span>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {ORDER.map((s, i) => (
          <span
            key={s}
            className={cn(
              'flex-1 h-1.5 rounded',
              i < currentIdx && 'bg-emerald-500',
              i === currentIdx && 'bg-primary animate-pulse',
              i > currentIdx && 'bg-muted',
            )}
            title={STAGE_LABELS[s]}
          />
        ))}
      </div>
    </div>
  );
}
