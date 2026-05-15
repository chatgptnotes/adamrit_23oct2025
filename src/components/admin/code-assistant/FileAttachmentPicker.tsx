import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { searchFiles } from '@/lib/code-assistant/client';
import { useDebounce } from 'use-debounce';

export function FileAttachmentPicker({
  attached,
  onChange,
  disabled,
}: {
  attached: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ] = useDebounce(q, 200);

  const { data, isLoading } = useQuery({
    queryKey: ['code-assistant', 'files', debouncedQ],
    queryFn: () => searchFiles(debouncedQ),
    enabled: open,
  });

  const results = (data?.results ?? []).filter((r: any) => r.in_allowlist && !r.in_locklist);

  return (
    <div>
      <label className="text-sm font-medium flex items-center gap-1.5">
        <span>📎</span>
        <span>Attach related files</span>
        <span className="text-xs text-muted-foreground">(optional, up to 5)</span>
      </label>

      <div className="flex gap-2 items-center mt-2 flex-wrap">
        {attached.map((p) => (
          <Badge key={p} variant="secondary" className="gap-1">
            {p}
            <button
              type="button"
              className="hover:text-destructive ml-1"
              disabled={disabled}
              onClick={() => onChange(attached.filter((x) => x !== p))}
              aria-label={`Remove ${p}`}
            >
              ✕
            </button>
          </Badge>
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled || attached.length >= 5}>
              + Add file
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Attach a file</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="Search src/… (e.g. 'patients', 'pharmacy')"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto mt-2 space-y-0.5">
              {isLoading && <div className="text-xs text-muted-foreground p-2">Searching…</div>}
              {!isLoading && results.length === 0 && (
                <div className="text-xs text-muted-foreground p-2">No matching files in the editable allowlist.</div>
              )}
              {results.map((r: any) => {
                const already = attached.includes(r.path);
                return (
                  <button
                    key={r.path}
                    type="button"
                    disabled={already || attached.length >= 5}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    onClick={() => {
                      if (attached.length < 5 && !already) {
                        onChange([...attached, r.path]);
                        setOpen(false);
                      }
                    }}
                  >
                    {r.path}
                    {already && <span className="text-xs text-muted-foreground ml-2">(attached)</span>}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Attach files DeepSeek should look at. Optional — DeepSeek can also find files itself.
      </p>
    </div>
  );
}
