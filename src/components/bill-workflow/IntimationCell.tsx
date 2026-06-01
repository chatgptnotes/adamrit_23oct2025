import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface IntimationCellProps {
  /** Current intimation date, if intimation is already done. */
  value?: Date;
  /** Save handler — receives the chosen date, or undefined to mark not done. */
  onChange: (date: Date | undefined) => void;
}

// Intimation status for a bill row. Click the green circle to pick a date;
// once a date is chosen it shows a green light + the date.
export function IntimationCell({ value, onChange }: IntimationCellProps) {
  const [editing, setEditing] = useState(false);

  // Picking or changing the intimation date.
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <EnhancedDatePicker
          value={value}
          onChange={(d) => {
            onChange(d);
            setEditing(false);
          }}
          placeholder="Select date"
          isDOB={false}
          defaultOpen
          className="w-[140px]"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              onChange(undefined);
              setEditing(false);
            }}
            title="Clear intimation"
          >
            Clear
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs text-muted-foreground"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Done — green light + date. Click to change.
  if (value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Intimation done — click to change"
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
        {format(value, 'dd/MM/yyyy')}
      </button>
    );
  }

  // Pending — a green circle to click and set the intimation date.
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Set intimation date"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-emerald-300 transition-colors hover:bg-emerald-50"
    >
      <span className="h-3 w-3 rounded-full border-2 border-emerald-400" />
    </button>
  );
}

export default IntimationCell;
