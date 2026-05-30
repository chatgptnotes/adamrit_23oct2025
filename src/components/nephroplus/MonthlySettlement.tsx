import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { INR } from './types';

interface MonthlySettlementProps {
  hospitalName: string;
  // Bump to force a reload after sessions change elsewhere on the page.
  reloadKey: number;
}

interface MonthRef {
  year: number;
  month: number; // 0-11
}

interface MonthTotals {
  key: string;
  title: string;
  count: number;
  charged: number;
  hope: number;
  nephroplus: number;
}

interface SettlementRow {
  session_date: string;
  charged_price: number | null;
  hope_share: number | null;
  nephroplus_share: number | null;
}

function addMonths({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function monthKey({ year, month }: MonthRef): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function monthTitle({ year, month }: MonthRef): string {
  return new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function lastDay({ year, month }: MonthRef): string {
  const d = new Date(year, month + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentMonth(): MonthRef {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function MonthlySettlement({ hospitalName, reloadKey }: MonthlySettlementProps) {
  const { toast } = useToast();
  const [anchor, setAnchor] = useState<MonthRef>(currentMonth());
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const months = useMemo(() => [0, 1, 2].map((i) => addMonths(anchor, i)), [anchor]);
  const windowStart = `${monthKey(months[0])}-01`;
  const windowEnd = lastDay(months[2]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dialysis_sessions')
      .select('session_date, charged_price, hope_share, nephroplus_share')
      .eq('hospital_name', hospitalName)
      .neq('payer_type', 'govt') // government excluded from NephroPlus payable
      .gte('session_date', windowStart)
      .lte('session_date', windowEnd);
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load settlement', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((data ?? []) as unknown as SettlementRow[]);
  }, [hospitalName, windowStart, windowEnd, toast]);

  useEffect(() => { load(); }, [load, reloadKey]);

  const totals: MonthTotals[] = useMemo(
    () =>
      months.map((m) => {
        const key = monthKey(m);
        const monthRows = rows.filter((r) => (r.session_date ?? '').slice(0, 7) === key);
        return monthRows.reduce<MonthTotals>(
          (acc, r) => ({
            ...acc,
            count: acc.count + 1,
            charged: acc.charged + (Number(r.charged_price) || 0),
            hope: acc.hope + (Number(r.hope_share) || 0),
            nephroplus: acc.nephroplus + (Number(r.nephroplus_share) || 0),
          }),
          { key, title: monthTitle(m), count: 0, charged: 0, hope: 0, nephroplus: 0 }
        );
      }),
    [months, rows]
  );

  const handlePrint = () => {
    const rowsHtml = totals
      .map(
        (t) => `
        <div class="month">
          <h2>${t.title}</h2>
          <table>
            <tr><td>Sessions</td><td class="r">${t.count}</td></tr>
            <tr><td>Total Charged</td><td class="r">${INR.format(t.charged)}</td></tr>
            <tr><td>Hope Entitlement</td><td class="r">${INR.format(t.hope)}</td></tr>
            <tr><td>NephroPlus Share</td><td class="r">${INR.format(t.nephroplus)}</td></tr>
            <tr class="payable"><td>Payable to NephroPlus</td><td class="r">${INR.format(t.nephroplus)}</td></tr>
          </table>
        </div>`
      )
      .join('');
    const html = `<!doctype html><html><head><title>NephroPlus Settlement</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 4px}
        .sub{color:#555;font-size:12px;margin:0 0 16px}
        .grid{display:flex;gap:16px}
        .month{flex:1;border:1px solid #ccc;border-radius:8px;padding:12px}
        .month h2{font-size:14px;margin:0 0 8px;border-bottom:1px solid #eee;padding-bottom:6px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        td{padding:4px 2px}
        .r{text-align:right}
        .payable td{font-weight:bold;border-top:2px solid #333;padding-top:8px;color:#b91c1c}
      </style></head><body>
      <h1>NephroPlus Dialysis — Settlement Statement</h1>
      <p class="sub">DRM Hope Hospital &harr; Nephrocare Health Services · Hope pays NephroPlus · Generated ${new Date().toLocaleString('en-IN')}</p>
      <div class="grid">${rowsHtml}</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) {
      toast({ title: 'Allow pop-ups to print', variant: 'destructive' });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Monthly Settlement — Payable to NephroPlus</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setAnchor((a) => addMonths(a, -1))} title="Earlier months">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setAnchor((a) => addMonths(a, 1))} title="Later months">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(currentMonth())}>Today</Button>
          <Button size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {totals.map((t) => (
            <div key={t.key} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold">{t.title}</h3>
                <span className="text-xs text-muted-foreground">{t.count} session{t.count === 1 ? '' : 's'}</span>
              </div>
              <dl className="space-y-1.5 text-sm">
                <Row label="Total Charged" value={INR.format(t.charged)} />
                <Row label="Hope Entitlement" value={INR.format(t.hope)} />
                <Row label="NephroPlus Share" value={INR.format(t.nephroplus)} />
              </dl>
              <div className="mt-3 border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-medium">Payable to NephroPlus</span>
                <span className="text-lg font-bold text-rose-600">{INR.format(t.nephroplus)}</span>
              </div>
            </div>
          ))}
        </div>
        {loading && <p className="text-xs text-muted-foreground mt-3">Loading…</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
