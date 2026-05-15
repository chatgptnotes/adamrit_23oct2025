import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ErrorView } from '@/lib/code-assistant/types';

export function ErrorPanel({ errors }: { errors: ErrorView[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="space-y-3">
      {errors.map((e, i) => <SingleError key={`${e.code}-${i}`} error={e} />)}
    </div>
  );
}

function SingleError({ error }: { error: ErrorView }) {
  const [open, setOpen] = useState(false);
  return (
    <Alert variant="destructive">
      <AlertTitle className="flex items-center gap-2">
        <span aria-hidden="true">❌</span>
        <span>{error.title}</span>
      </AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.hint && <p className="mt-2 text-xs italic">💡 {error.hint}</p>}
        <div className="mt-3 flex gap-2 items-center flex-wrap">
          {error.actions?.map((a) => (
            <Button key={a.label} size="sm" variant="secondary" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
          {error.details && (
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
              {open ? '▾ Hide details' : '▸ Show details'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const payload = JSON.stringify({ code: error.code, ...error.details }, null, 2);
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(payload);
              }
            }}
          >
            Copy error
          </Button>
        </div>
        {open && error.details && (
          <pre className="mt-3 text-xs bg-muted text-foreground p-2 rounded overflow-x-auto">
{JSON.stringify(error.details, null, 2)}
          </pre>
        )}
      </AlertDescription>
    </Alert>
  );
}
