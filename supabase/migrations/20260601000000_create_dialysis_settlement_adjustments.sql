-- Per-month manual settlement figures for the NephroPlus "Receivable Summary".
-- The Gross / Amt-to-hospital / Net columns are computed from billing; these three
-- columns (cash payout, debit note, received) are entered by staff and persisted so
-- the Balance carries across sessions and machines.
create table if not exists public.dialysis_settlement_adjustments (
  id uuid primary key default gen_random_uuid(),
  month text not null,                 -- 'YYYY-MM'
  hospital_name text not null default 'hope',
  cash_payout numeric not null default 0,
  debit_note numeric not null default 0,
  received_amount numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint dialysis_settlement_adjustments_unique unique (hospital_name, month)
);

alter table public.dialysis_settlement_adjustments enable row level security;

drop policy if exists "dsa_select" on public.dialysis_settlement_adjustments;
create policy "dsa_select" on public.dialysis_settlement_adjustments for select using (true);
drop policy if exists "dsa_insert" on public.dialysis_settlement_adjustments;
create policy "dsa_insert" on public.dialysis_settlement_adjustments for insert with check (true);
drop policy if exists "dsa_update" on public.dialysis_settlement_adjustments;
create policy "dsa_update" on public.dialysis_settlement_adjustments for update using (true) with check (true);
drop policy if exists "dsa_delete" on public.dialysis_settlement_adjustments;
create policy "dsa_delete" on public.dialysis_settlement_adjustments for delete using (true);
