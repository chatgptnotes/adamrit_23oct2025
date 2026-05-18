import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type KpiPeriod = 'today' | 'month' | 'year' | 'specific';

export interface DirectorKpiData {
  admissions: number | null;
  discharges: number | null;
  opdVisits: number | null;
  collection: number | null;
  activeIpd: number | null;
  pendingApprovals: number | null;
}

interface DateRange {
  startISO: string;
  endISO: string;
  startDate: string;
  endDate: string;
}

// The generated Supabase types are stale — visits.is_discharged / patient_type and the
// advance_payment / final_payments tables are absent from them. Query through an untyped
// client, the way the rest of the app already does for these tables.
const sb = supabase as unknown as {
  from: (table: string) => any;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Resolve a KpiPeriod into a half-open [start, end) range. Returns both a timestamp pair
 * (for created_at / admission_date / discharge_date) and a date-only pair (for visit_date).
 * Dates are built in local time — the app is single-region (India).
 */
export function getDateRange(period: KpiPeriod, specificMonth: string): DateRange {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  } else if (period === 'specific' && /^\d{4}-\d{2}$/.test(specificMonth)) {
    const [y, m] = specificMonth.split('-').map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 1);
  } else {
    // 'month', or 'specific' with no month picked yet → current month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startDate: toDateStr(start),
    endDate: toDateStr(end),
  };
}

// A hospital-scoped exact-count query over visits (head:true → no rows transferred).
const visitCount = (hospitalType: string) =>
  sb
    .from('visits')
    .select('id, patients!inner(hospital_name)', { count: 'exact', head: true })
    .eq('patients.hospital_name', hospitalType);

async function fetchPeriodKpis(hospitalType: string, range: DateRange) {
  const [adm, dis, opd] = await Promise.all([
    visitCount(hospitalType)
      .not('admission_date', 'is', null)
      .gte('admission_date', range.startISO)
      .lt('admission_date', range.endISO),
    visitCount(hospitalType)
      .not('discharge_date', 'is', null)
      .gte('discharge_date', range.startISO)
      .lt('discharge_date', range.endISO),
    visitCount(hospitalType)
      .eq('patient_type', 'OPD')
      .gte('visit_date', range.startDate)
      .lt('visit_date', range.endDate),
  ]);
  if (adm.error) throw adm.error;
  if (dis.error) throw dis.error;
  if (opd.error) throw opd.error;

  // Collection spans two ad-hoc tables (advance_payment, final_payments) with an
  // unreliable schema — isolate it so a failure here degrades only the Collection
  // card, not the whole strip.
  let collection: number | null = null;
  try {
    const [advance, finalPay] = await Promise.all([
      sb
        .from('advance_payment')
        .select('advance_amount, amount, visits!inner!visit_id(patients!inner(hospital_name))')
        .eq('visits.patients.hospital_name', hospitalType)
        .eq('status', 'ACTIVE')
        .eq('is_refund', false)
        .gte('created_at', range.startISO)
        .lt('created_at', range.endISO),
      sb
        .from('final_payments')
        .select('amount, visits!inner!visit_id(patients!inner(hospital_name))')
        .eq('visits.patients.hospital_name', hospitalType)
        .gte('created_at', range.startISO)
        .lt('created_at', range.endISO),
    ]);
    if (advance.error) throw advance.error;
    if (finalPay.error) throw finalPay.error;

    // advance_payment is queried as `amount` in some files and `advance_amount` in
    // others — prefer the explicit advance_amount, fall back to amount.
    const advanceTotal = (advance.data || []).reduce(
      (s: number, r: any) => s + (Number(r.advance_amount ?? r.amount) || 0),
      0,
    );
    const finalTotal = (finalPay.data || []).reduce(
      (s: number, r: any) => s + (Number(r.amount) || 0),
      0,
    );
    collection = advanceTotal + finalTotal;
  } catch (err) {
    console.error('Director KPI collection query failed:', err);
    collection = null;
  }

  return {
    admissions: adm.count ?? 0,
    discharges: dis.count ?? 0,
    opdVisits: opd.count ?? 0,
    collection,
  };
}

async function fetchLiveKpis(hospitalType: string) {
  const [active, pending] = await Promise.all([
    visitCount(hospitalType)
      .not('admission_date', 'is', null)
      .is('discharge_date', null),
    // bills has no hospital column and no confirmed patients FK — this count is org-wide.
    sb
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING_APPROVAL'),
  ]);
  if (active.error) throw active.error;
  if (pending.error) throw pending.error;

  return {
    activeIpd: active.count ?? 0,
    pendingApprovals: pending.count ?? 0,
  };
}

/**
 * Director Dashboard KPIs, scoped to the director's own hospital.
 * Period-bound metrics (admissions/discharges/OPD/collection) refetch when `period`
 * changes; live metrics (active IPD, pending approvals) auto-refresh every 60s.
 */
export function useDirectorKpis(period: KpiPeriod, specificMonth: string) {
  const { user } = useAuth();
  const hospitalType = user?.hospitalType;

  const periodQuery = useQuery({
    queryKey: ['director-kpis-period', hospitalType, period, specificMonth],
    queryFn: () => fetchPeriodKpis(hospitalType as string, getDateRange(period, specificMonth)),
    enabled: !!hospitalType,
    staleTime: 60_000,
    // Keep the previous numbers on screen while a period change refetches.
    placeholderData: (prev) => prev,
  });

  const liveQuery = useQuery({
    queryKey: ['director-kpis-live', hospitalType],
    queryFn: () => fetchLiveKpis(hospitalType as string),
    enabled: !!hospitalType,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const data: DirectorKpiData = {
    admissions: periodQuery.data?.admissions ?? null,
    discharges: periodQuery.data?.discharges ?? null,
    opdVisits: periodQuery.data?.opdVisits ?? null,
    collection: periodQuery.data?.collection ?? null,
    activeIpd: liveQuery.data?.activeIpd ?? null,
    pendingApprovals: liveQuery.data?.pendingApprovals ?? null,
  };

  return {
    data,
    isLoading: periodQuery.isLoading || liveQuery.isLoading,
    error: (periodQuery.error || liveQuery.error) as Error | null,
    refetch: () => {
      periodQuery.refetch();
      liveQuery.refetch();
    },
  };
}
