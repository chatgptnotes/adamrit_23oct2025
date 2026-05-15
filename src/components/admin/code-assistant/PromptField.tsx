import { Textarea } from '@/components/ui/textarea';
import type { FieldError } from '@/lib/code-assistant/types';
import { MAX_PROMPT_LENGTH } from '@/lib/code-assistant/validate';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  'Add a CSV export button to the Patients page',
  'In OPD intake, require age and blood group',
  'When pharmacy stock < 50, send WhatsApp to pharmacist',
];

export function PromptField({
  value,
  onChange,
  error,
  onClearError,
  onPickExample,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  error: FieldError | null;
  onClearError: () => void;
  onPickExample: (text: string) => void;
  disabled?: boolean;
}) {
  const len = value.length;
  const counterColor =
    len < 9_000 ? 'text-muted-foreground' :
    len < 9_800 ? 'text-amber-600' :
    'text-destructive';

  return (
    <div>
      <label htmlFor="ca-prompt" className="text-sm font-medium flex items-center gap-1.5">
        <span>📝</span>
        <span>What do you want to change in Adamrit?</span>
        <span className="text-destructive">*</span>
      </label>

      <Textarea
        id="ca-prompt"
        rows={8}
        disabled={disabled}
        className={cn('font-mono text-sm mt-2', error && 'border-destructive focus-visible:ring-destructive')}
        placeholder="Describe the change in plain English…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) onClearError();
        }}
        aria-invalid={!!error}
        aria-describedby={error ? 'ca-prompt-error' : 'ca-prompt-help'}
      />

      <div className="flex justify-between mt-1.5 gap-4">
        <p id="ca-prompt-help" className="text-xs text-muted-foreground">
          Use plain English. Be specific about which page or feature.
        </p>
        <p className={cn('text-xs whitespace-nowrap', counterColor)}>
          {len.toLocaleString()} / {MAX_PROMPT_LENGTH.toLocaleString()} characters
        </p>
      </div>

      {error && (
        <p id="ca-prompt-error" role="alert" className="text-xs text-destructive mt-1 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>{error.message}
        </p>
      )}

      <div className="mt-3 text-xs text-muted-foreground">
        Examples (click to insert):
        <ul className="mt-1 space-y-1">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                className="text-left hover:text-foreground underline-offset-2 hover:underline disabled:opacity-50"
                disabled={disabled}
                onClick={() => onPickExample(ex)}
              >
                • {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
