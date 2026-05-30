import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PAYER_LABELS, type PayerType } from '@/lib/nephroplus/revenue-share';
import { INR, type DialysisSession } from './types';

interface SettlementTabProps {
  sessions: DialysisSession[];
}

interface Group {
  key: string;
  month: string;
  encounter: string;
  payer: PayerType;
  count: number;
  charged: number;
  hope: number;
  nephroplus: number;
}

function monthLabel(dateStr: string): string {
  // dateStr is YYYY-MM-DD; derive YYYY-MM without timezone surprises.
  return dateStr.slice(0, 7);
}

function buildGroups(sessions: DialysisSession[]): Group[] {
  const map = new Map<string, Group>();
  for (const s of sessions) {
    const month = monthLabel(s.session_date);
    const key = `${month}|${s.encounter_type}|${s.payer_type}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.charged += Number(s.charged_price) || 0;
      existing.hope += Number(s.hope_share) || 0;
      existing.nephroplus += Number(s.nephroplus_share) || 0;
    } else {
      map.set(key, {
        key,
        month,
        encounter: s.encounter_type,
        payer: s.payer_type,
        count: 1,
        charged: Number(s.charged_price) || 0,
        hope: Number(s.hope_share) || 0,
        nephroplus: Number(s.nephroplus_share) || 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function SettlementTab({ sessions }: SettlementTabProps) {
  const groups = useMemo(() => buildGroups(sessions), [sessions]);

  const totals = useMemo(
    () =>
      groups.reduce(
        (acc, g) => ({
          count: acc.count + g.count,
          charged: acc.charged + g.charged,
          hope: acc.hope + g.hope,
          nephroplus: acc.nephroplus + g.nephroplus,
        }),
        { count: 0, charged: 0, hope: 0, nephroplus: 0 }
      ),
    [groups]
  );

  const exportCsv = () => {
    const header = ['Month', 'Encounter', 'Payer', 'Sessions', 'Charged', 'Hope Share', 'NephroPlus Share'];
    const rows = groups.map((g) => [
      g.month,
      g.encounter,
      PAYER_LABELS[g.payer],
      String(g.count),
      g.charged.toFixed(2),
      g.hope.toFixed(2),
      g.nephroplus.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nephroplus-settlement-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Monthly reconciliation grouped by encounter type and payer column.
        </p>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={groups.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Encounter</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Charged</TableHead>
              <TableHead className="text-right">Hope Share</TableHead>
              <TableHead className="text-right">NephroPlus Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No sessions in range.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.key}>
                  <TableCell>{g.month}</TableCell>
                  <TableCell>{g.encounter}</TableCell>
                  <TableCell>{PAYER_LABELS[g.payer]}</TableCell>
                  <TableCell className="text-right">{g.count}</TableCell>
                  <TableCell className="text-right">{INR.format(g.charged)}</TableCell>
                  <TableCell className="text-right font-medium">{INR.format(g.hope)}</TableCell>
                  <TableCell className="text-right">{INR.format(g.nephroplus)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {groups.length > 0 && (
            <tfoot>
              <TableRow className="border-t font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{totals.count}</TableCell>
                <TableCell className="text-right">{INR.format(totals.charged)}</TableCell>
                <TableCell className="text-right">{INR.format(totals.hope)}</TableCell>
                <TableCell className="text-right">{INR.format(totals.nephroplus)}</TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}
