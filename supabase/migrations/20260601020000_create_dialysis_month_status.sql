-- Payment tracking per visit-month: did Hope pay NephroPlus for the patients who
-- came that month? Drives the "Paid / Pending" status and the outstanding total.
create table if not exists public.dialysis_month_status (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null default 'hope',
  month text not null,            -- visit month 'YYYY-MM'
  paid boolean not null default false,
  paid_on date,
  notes text,
  updated_at timestamptz not null default now(),
  constraint dialysis_month_status_unique unique (hospital_name, month)
);

alter table public.dialysis_month_status enable row level security;
drop policy if exists "dms_all" on public.dialysis_month_status;
create policy "dms_all" on public.dialysis_month_status for all using (true) with check (true);
