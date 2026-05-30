import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DialysisRateRow, RateBasis } from '@/lib/nephroplus/revenue-share';

interface RatesTabProps {
  rateConfig: DialysisRateRow[];
  onChanged: () => void;
}

type PctField = 'private_pct' | 'govt_pct' | 'cash_pct';

/** Parse a percentage cell: empty string => NA (null). */
function parsePct(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function RatesTab({ rateConfig, onChanged }: RatesTabProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, Partial<DialysisRateRow>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const valueOf = (row: DialysisRateRow, field: PctField): string => {
    const override = draft[row.id]?.[field];
    const current = override !== undefined ? override : row[field];
    return current === null || current === undefined ? '' : String(current);
  };

  const basisOf = (row: DialysisRateRow): RateBasis => (draft[row.id]?.basis as RateBasis) ?? row.basis;

  const setField = (id: string, field: keyof DialysisRateRow, value: unknown) => {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveRow = async (row: DialysisRateRow) => {
    const changes = draft[row.id];
    if (!changes) return;
    setSavingId(row.id);
    try {
      const { error } = await supabase
        .from('dialysis_rate_config')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw error;
      toast({ title: `Saved ${row.label}` });
      setDraft((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save rate';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hope Hospital's % share of each service. Leave a cell blank for <b>NA</b> (not shared). Edit values to
        apply contract revisions or resolve the footnote conflicts (Lab, Bloodline/Dialyzer). Changes apply to
        new sessions only — saved sessions keep their original split.
      </p>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Applies</TableHead>
              <TableHead>Basis</TableHead>
              <TableHead className="text-right">Private %</TableHead>
              <TableHead className="text-right">Cash %</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateConfig.map((row) => {
              const dirty = Boolean(draft[row.id]);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell><Badge variant="outline">{row.applies_to}</Badge></TableCell>
                  <TableCell>
                    <select
                      className="h-8 rounded border bg-background px-2 text-sm"
                      value={basisOf(row)}
                      onChange={(e) => setField(row.id, 'basis', e.target.value as RateBasis)}
                    >
                      <option value="charged">charged</option>
                      <option value="margin">margin</option>
                    </select>
                  </TableCell>
                  {(['private_pct', 'cash_pct'] as PctField[]).map((field) => (
                    <TableCell key={field} className="text-right">
                      <Input
                        className="h-8 w-20 text-right"
                        inputMode="decimal"
                        placeholder="NA"
                        value={valueOf(row, field)}
                        onChange={(e) => setField(row.id, field, parsePct(e.target.value))}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button size="sm" variant={dirty ? 'default' : 'ghost'} disabled={!dirty || savingId === row.id} onClick={() => saveRow(row)}>
                      {savingId === row.id ? 'Saving…' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
