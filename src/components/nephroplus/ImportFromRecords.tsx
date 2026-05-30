import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { encounterFromPatientType, payerFromCorporate, PAYER_LABELS } from '@/lib/nephroplus/revenue-share';
import type { SessionPrefill } from './types';

interface ImportFromRecordsProps {
  existingVisitIds: Set<string>;
  onRecord: (prefill: SessionPrefill) => void;
  refreshKey: number;
}

interface Candidate extends SessionPrefill {
  patientsId: string | null;
  reason: string | null;
}

export function ImportFromRecords({ existingVisitIds, onRecord, refreshKey }: ImportFromRecordsProps) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Filtering on visits.reason_for_visit (a visits column) is fine; we only
    // EMBED patients to read the name (embedded filtering is what breaks in PostgREST).
    const { data, error } = await supabase
      .from('visits')
      .select('visit_id, visit_date, patient_type, corporate, reason_for_visit, patients!inner(id, name, patients_id, corporate)')
      .ilike('reason_for_visit', '%dialys%')
      .order('visit_date', { ascending: false })
      .limit(300);
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load dialysis records', description: error.message, variant: 'destructive' });
      return;
    }
    const mapped: Candidate[] = (data ?? []).map((row: Record<string, unknown>) => {
      const patient = (row.patients ?? {}) as Record<string, unknown>;
      const corporate = (row.corporate as string) ?? (patient.corporate as string) ?? null;
      return {
        patientId: (patient.id as string) ?? null,
        visitId: (row.visit_id as string) ?? null,
        patientName: (patient.name as string) ?? 'Unknown',
        patientsId: (patient.patients_id as string) ?? null,
        encounterType: encounterFromPatientType(row.patient_type as string),
        payerType: payerFromCorporate(corporate),
        sessionDate: (row.visit_date as string) ?? new Date().toISOString().slice(0, 10),
        reason: (row.reason_for_visit as string) ?? null,
      };
    });
    setCandidates(mapped);
  }, [toast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Patients detected from existing visit records mentioning dialysis. Click <b>Record</b> to log a dialysis
        session for that visit — patient, OP/IP, payer and date are pre-filled; just confirm the charged price and
        service. New dialysis visits show up here automatically.
      </p>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Visit reason</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : candidates.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No dialysis visits found in records.</TableCell></TableRow>
            ) : (
              candidates.map((c) => {
                const added = c.visitId !== null && existingVisitIds.has(c.visitId);
                return (
                  <TableRow key={`${c.visitId}-${c.patientId}`}>
                    <TableCell>{c.sessionDate}</TableCell>
                    <TableCell className="font-medium">
                      {c.patientName}
                      {c.patientsId && <span className="block text-xs text-muted-foreground">{c.patientsId}</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{c.encounterType}</Badge></TableCell>
                    <TableCell className="text-xs">{PAYER_LABELS[c.payerType]}</TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate" title={c.reason ?? ''}>{c.reason}</TableCell>
                    <TableCell>
                      {added ? (
                        <Badge className="bg-green-600">Recorded</Badge>
                      ) : (
                        <Button size="sm" onClick={() => onRecord(c)}>Record</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
