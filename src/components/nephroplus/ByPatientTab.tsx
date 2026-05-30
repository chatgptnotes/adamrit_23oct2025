import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';
import { encounterFromPatientType, payerFromCorporate } from '@/lib/nephroplus/revenue-share';
import { INR, type SessionPrefill } from './types';

interface ByPatientTabProps {
  hospitalName: string;
  onRecord: (prefill: SessionPrefill) => void;
  refreshKey: number;
}

interface PatientRow {
  key: string;
  name: string;
  count: number;        // recorded dialysis sessions (non-govt)
  charged: number;
  hope: number;
  nephroplus: number;
  prefill: SessionPrefill | null; // to record a session when none yet
}

interface SessionLite {
  patient_id: string | null;
  patient_name: string;
  charged_price: number | null;
  hope_share: number | null;
  nephroplus_share: number | null;
  payer_type: string;
}

function rowKey(patientId: string | null, name: string): string {
  return patientId ?? `name:${name}`;
}

export function ByPatientTab({ hospitalName, onRecord, refreshKey }: ByPatientTabProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // 1) Every patient detected from existing dialysis visits (so the list is full
    //    even before anything is recorded). 2) All recorded sessions (non-govt) to
    //    fill in the actual cut. Merge by patient.
    const [visitsRes, sessionsRes] = await Promise.all([
      supabase
        .from('visits')
        .select('visit_id, visit_date, patient_type, corporate, patients!inner(id, name, corporate)')
        .ilike('reason_for_visit', '%dialys%')
        .order('visit_date', { ascending: false })
        .limit(500),
      supabase
        .from('dialysis_sessions')
        .select('patient_id, patient_name, charged_price, hope_share, nephroplus_share, payer_type')
        .eq('hospital_name', hospitalName)
        .neq('payer_type', 'govt'),
    ]);
    setLoading(false);
    if (visitsRes.error || sessionsRes.error) {
      toast({
        title: 'Failed to load patients',
        description: visitsRes.error?.message ?? sessionsRes.error?.message,
        variant: 'destructive',
      });
      return;
    }

    const map = new Map<string, PatientRow>();

    // Seed with detected dialysis patients (latest visit becomes the record prefill).
    for (const v of (visitsRes.data ?? []) as Record<string, unknown>[]) {
      const patient = (v.patients ?? {}) as Record<string, unknown>;
      const patientId = (patient.id as string) ?? null;
      const name = (patient.name as string) ?? 'Unknown';
      const key = rowKey(patientId, name);
      if (map.has(key)) continue; // first (latest) visit wins for prefill
      const corporate = (v.corporate as string) ?? (patient.corporate as string) ?? null;
      map.set(key, {
        key,
        name,
        count: 0,
        charged: 0,
        hope: 0,
        nephroplus: 0,
        prefill: {
          patientId,
          visitId: (v.visit_id as string) ?? null,
          patientName: name,
          encounterType: encounterFromPatientType(v.patient_type as string),
          payerType: payerFromCorporate(corporate),
          sessionDate: (v.visit_date as string) ?? new Date().toISOString().slice(0, 10),
        },
      });
    }

    // Fold in recorded sessions (also adds patients that aren't in the detected list).
    for (const s of (sessionsRes.data ?? []) as SessionLite[]) {
      const key = rowKey(s.patient_id, s.patient_name);
      const existing = map.get(key);
      const charged = Number(s.charged_price) || 0;
      const hope = Number(s.hope_share) || 0;
      const nephroplus = Number(s.nephroplus_share) || 0;
      if (existing) {
        existing.count += 1;
        existing.charged += charged;
        existing.hope += hope;
        existing.nephroplus += nephroplus;
      } else {
        map.set(key, { key, name: s.patient_name, count: 1, charged, hope, nephroplus, prefill: null });
      }
    }

    const list = Array.from(map.values()).sort(
      (a, b) => b.nephroplus - a.nephroplus || a.name.localeCompare(b.name)
    );
    setRows(list);
  }, [hospitalName, toast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          patients: acc.patients + 1,
          count: acc.count + r.count,
          charged: acc.charged + r.charged,
          hope: acc.hope + r.hope,
          nephroplus: acc.nephroplus + r.nephroplus,
        }),
        { patients: 0, count: 0, charged: 0, hope: 0, nephroplus: 0 }
      ),
    [rows]
  );

  const handlePrint = () => {
    const body = rows
      .map(
        (r, i) => `<tr>
          <td>${i + 1}</td><td>${r.name}</td>
          <td class="r">${r.count}</td>
          <td class="r">${INR.format(r.charged)}</td>
          <td class="r">${INR.format(r.hope)}</td>
          <td class="r">${INR.format(r.nephroplus)}</td>
        </tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><title>NephroPlus — Cut by Patient</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 4px}.sub{color:#555;font-size:12px;margin:0 0 16px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}.r{text-align:right}
        tfoot td{font-weight:bold;border-top:2px solid #333}.np{color:#b91c1c}</style></head><body>
      <h1>NephroPlus Dialysis — Cut by Patient</h1>
      <p class="sub">DRM Hope Hospital &harr; NephroPlus · All dialysis patients · Government excluded · Generated ${new Date().toLocaleString('en-IN')}</p>
      <table><thead><tr><th>#</th><th>Patient</th><th class="r">Sessions</th><th class="r">Charged</th><th class="r">Hope Hospital</th><th class="r">NephroPlus</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td colspan="2">GRAND TOTAL (${totals.patients} patients)</td><td class="r">${totals.count}</td><td class="r">${INR.format(totals.charged)}</td><td class="r">${INR.format(totals.hope)}</td><td class="r np">${INR.format(totals.nephroplus)}</td></tr></tfoot>
      </table></body></html>`;
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) { toast({ title: 'Allow pop-ups to print', variant: 'destructive' }); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          All dialysis patients. Government excluded. <b>Record</b> a patient to enter the charged price and see
          NephroPlus's cut.
        </p>
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={rows.length === 0}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Charged</TableHead>
              <TableHead className="text-right">Hope Hospital</TableHead>
              <TableHead className="text-right">NephroPlus (cut)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading patients…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No dialysis patients found.</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">
                    {r.count > 0 ? r.count : <Badge variant="outline">pending</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{INR.format(r.charged)}</TableCell>
                  <TableCell className="text-right">{INR.format(r.hope)}</TableCell>
                  <TableCell className="text-right font-semibold text-rose-600">{INR.format(r.nephroplus)}</TableCell>
                  <TableCell className="text-right">
                    {r.prefill && (
                      <Button size="sm" variant={r.count > 0 ? 'ghost' : 'default'} onClick={() => onRecord(r.prefill as SessionPrefill)}>
                        {r.count > 0 ? 'Add' : 'Record'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <tfoot>
              <TableRow className="border-t-2 font-bold">
                <TableCell>GRAND TOTAL ({totals.patients})</TableCell>
                <TableCell className="text-right">{totals.count}</TableCell>
                <TableCell className="text-right">{INR.format(totals.charged)}</TableCell>
                <TableCell className="text-right">{INR.format(totals.hope)}</TableCell>
                <TableCell className="text-right text-rose-600">{INR.format(totals.nephroplus)}</TableCell>
                <TableCell />
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}
