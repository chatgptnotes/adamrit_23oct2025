import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  computeSplit,
  resolveRate,
  suggestCategoryFromPrice,
  encounterFromPatientType,
  payerFromCorporate,
  type DialysisRateRow,
  type EncounterType,
  type PayerType,
} from '@/lib/nephroplus/revenue-share';
import { INR, type DialysisSession, type PatientSearchResult, type SessionPrefill } from './types';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rateConfig: DialysisRateRow[];
  hospitalName: string;
  createdBy: string | null;
  session: DialysisSession | null;      // set => edit existing
  prefill?: SessionPrefill | null;      // set (with session null) => new, seeded from a detected visit
  onSaved: () => void;
}

interface FormState {
  sessionDate: string;
  patientId: string | null;
  visitId: string | null;
  patientName: string;
  encounterType: EncounterType;
  payerType: PayerType;
  serviceCategory: string;
  chargedPrice: string;
  marginAmount: string;
  notes: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

function emptyForm(): FormState {
  return {
    sessionDate: today(),
    patientId: null,
    visitId: null,
    patientName: '',
    encounterType: 'OP',
    payerType: 'cash',
    serviceCategory: '',
    chargedPrice: '',
    marginAmount: '',
    notes: '',
  };
}

function fromPrefill(p: SessionPrefill): FormState {
  return {
    ...emptyForm(),
    sessionDate: p.sessionDate || today(),
    patientId: p.patientId,
    visitId: p.visitId,
    patientName: p.patientName,
    encounterType: p.encounterType,
    payerType: p.payerType,
  };
}

function fromSession(s: DialysisSession): FormState {
  return {
    sessionDate: s.session_date,
    patientId: s.patient_id,
    visitId: s.visit_id,
    patientName: s.patient_name,
    encounterType: s.encounter_type,
    payerType: s.payer_type,
    serviceCategory: s.service_category,
    chargedPrice: String(s.charged_price ?? ''),
    marginAmount: s.margin_amount === null || s.margin_amount === undefined ? '' : String(s.margin_amount),
    notes: s.notes ?? '',
  };
}

export function SessionDialog({
  open,
  onOpenChange,
  rateConfig,
  hospitalName,
  createdBy,
  session,
  prefill,
  onSaved,
}: SessionDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(session ? fromSession(session) : prefill ? fromPrefill(prefill) : emptyForm());
      setSearch('');
      setResults([]);
      setSearchError(null);
      setFocused(false);
    }
  }, [open, session, prefill]);

  // Patient list against the patients table directly (matches the proven pattern
  // used elsewhere; filtering an embedded resource through visits returns no rows
  // in PostgREST). Empty query => browse all patients (alphabetical); otherwise
  // filter by name or patient ID. Only runs while the field is focused.
  useEffect(() => {
    if (!open || !focused) return;
    const q = search.trim();
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        let query = supabase
          .from('patients')
          .select('id, name, patients_id, corporate')
          .order('name', { ascending: true });
        query = q.length >= 1
          ? query.or(`name.ilike.%${q}%,patients_id.ilike.%${q}%`).limit(50)
          : query.limit(500);
        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;
        const mapped: PatientSearchResult[] = (data ?? []).map((row: Record<string, unknown>) => ({
          patientId: row.id as string,
          name: (row.name as string) ?? 'Unknown',
          patientsId: (row.patients_id as string) ?? null,
          corporate: (row.corporate as string) ?? null,
        }));
        setResults(mapped);
        if (mapped.length === 0) setSearchError('No patients found.');
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setSearchError(err instanceof Error ? err.message : 'Search failed.');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, q.length === 0 ? 0 : 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, focused, open]);

  // On select, pull the patient's latest visit to prefill encounter type + payer.
  const selectPatient = async (r: PatientSearchResult) => {
    setForm((prev) => ({
      ...prev,
      patientId: r.patientId,
      patientName: r.name,
      payerType: payerFromCorporate(r.corporate),
    }));
    setSearch('');
    setResults([]);
    setFocused(false);

    const { data } = await supabase
      .from('visits')
      .select('visit_id, patient_type, corporate, visit_date')
      .eq('patient_id', r.patientId)
      .order('visit_date', { ascending: false })
      .limit(1);
    const visit = (data ?? [])[0] as Record<string, unknown> | undefined;
    if (!visit) return;
    const corporate = (visit.corporate as string) ?? r.corporate ?? null;
    setForm((prev) => ({
      ...prev,
      visitId: (visit.visit_id as string) ?? null,
      encounterType: encounterFromPatientType(visit.patient_type as string),
      payerType: payerFromCorporate(corporate),
    }));
  };

  const categoriesForEncounter = useMemo(
    () =>
      rateConfig
        .filter((row) => row.active && (row.applies_to === 'BOTH' || row.applies_to === form.encounterType))
        .sort((a, b) => a.sort_order - b.sort_order),
    [rateConfig, form.encounterType]
  );

  const rateRow = useMemo(
    () => resolveRate(rateConfig, form.serviceCategory, form.encounterType),
    [rateConfig, form.serviceCategory, form.encounterType]
  );

  const isMargin = rateRow?.basis === 'margin';

  const preview = useMemo(() => {
    if (!rateRow) return null;
    return computeSplit({
      chargedPrice: Number(form.chargedPrice) || 0,
      marginAmount: form.marginAmount === '' ? null : Number(form.marginAmount),
      rateRow,
      payerType: form.payerType,
    });
  }, [rateRow, form.chargedPrice, form.marginAmount, form.payerType]);

  const onChargedBlur = () => {
    // Auto-suggest a banded dialysis category if none picked yet.
    if (form.serviceCategory) return;
    const price = Number(form.chargedPrice);
    if (!price) return;
    const suggested = suggestCategoryFromPrice(rateConfig, price, form.encounterType);
    if (suggested) setForm((prev) => ({ ...prev, serviceCategory: suggested }));
  };

  const handleSave = async () => {
    if (!form.patientName.trim()) {
      toast({ title: 'Patient name required', variant: 'destructive' });
      return;
    }
    if (!rateRow) {
      toast({ title: 'Select a service category', variant: 'destructive' });
      return;
    }
    const charged = Number(form.chargedPrice) || 0;
    if (charged <= 0 && !isMargin) {
      toast({ title: 'Enter a charged price', variant: 'destructive' });
      return;
    }
    const split = computeSplit({
      chargedPrice: charged,
      marginAmount: form.marginAmount === '' ? null : Number(form.marginAmount),
      rateRow,
      payerType: form.payerType,
    });

    const payload = {
      session_date: form.sessionDate,
      patient_id: form.patientId,
      visit_id: form.visitId,
      patient_name: form.patientName.trim(),
      encounter_type: form.encounterType,
      payer_type: form.payerType,
      service_category: form.serviceCategory,
      charged_price: charged,
      margin_amount: isMargin ? (form.marginAmount === '' ? null : Number(form.marginAmount)) : null,
      rate_pct_applied: split.pct,
      hope_share: split.hopeShare,
      nephroplus_share: split.nephroplusShare,
      notes: form.notes.trim() || null,
      hospital_name: hospitalName,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      if (session) {
        const { error } = await supabase.from('dialysis_sessions').update(payload).eq('id', session.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dialysis_sessions')
          .insert({ ...payload, created_by: createdBy });
        if (error) throw error;
      }
      toast({ title: session ? 'Session updated' : 'Session added' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save session';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Dialysis Session' : 'Add Dialysis Session'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Combined: type to search registered patients, or just leave a manual name */}
            <div className="relative">
              <Label>Patient name</Label>
              <Input
                placeholder="Click to browse, or type to search patients…"
                value={form.patientName}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, patientName: v, patientId: null, visitId: null }));
                  setSearch(v);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => window.setTimeout(() => setFocused(false), 150)}
                autoComplete="off"
              />
              {form.patientId && <p className="text-xs text-green-600 mt-1">✓ Linked to registered patient</p>}
              {focused && searching && <p className="text-xs text-muted-foreground mt-1">Loading patients…</p>}
              {focused && !searching && searchError && (
                <p className="text-xs text-amber-600 mt-1">{searchError}</p>
              )}
              {focused && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-72 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      type="button"
                      key={r.patientId}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectPatient(r)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.patientsId ? `${r.patientsId}` : 'no ID'}
                        {r.corporate ? ` · ${r.corporate}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Session date</Label>
              <Input
                type="date"
                value={form.sessionDate}
                onChange={(e) => setForm((p) => ({ ...p, sessionDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Encounter</Label>
              <Select
                value={form.encounterType}
                onValueChange={(v) => setForm((p) => ({ ...p, encounterType: v as EncounterType, serviceCategory: '' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OP">OP (Outpatient)</SelectItem>
                  <SelectItem value="IP">IP (Inpatient)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payer</Label>
              <Select value={form.payerType} onValueChange={(v) => setForm((p) => ({ ...p, payerType: v as PayerType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="private_credit">Private Credit (TPA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service category</Label>
              <Select value={form.serviceCategory} onValueChange={(v) => setForm((p) => ({ ...p, serviceCategory: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {categoriesForEncounter.map((row) => (
                    <SelectItem key={row.service_category} value={row.service_category}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Charged price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={form.chargedPrice}
                onChange={(e) => setForm((p) => ({ ...p, chargedPrice: e.target.value }))}
                onBlur={onChargedBlur}
              />
            </div>
            {isMargin && (
              <div>
                <Label>Margin amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.marginAmount}
                  onChange={(e) => setForm((p) => ({ ...p, marginAmount: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Live split preview */}
          {preview && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {preview.shareable ? (
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span>Basis: <b>{preview.basis === 'margin' ? 'Margin' : 'Charged'}</b> {INR.format(preview.base)}</span>
                  <span>Rate: <b>{preview.pct}%</b></span>
                  <span>Hope: <b>{INR.format(preview.hopeShare)}</b></span>
                  <span>NephroPlus: <b>{INR.format(preview.nephroplusShare)}</b></span>
                </div>
              ) : (
                <span className="text-amber-600">This payer column is marked NA — no revenue is shared with Hope for this service.</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save session'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
