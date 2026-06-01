-- Single configurable payout percentage: the % of the collected dialysis price
-- that Hope Hospital pays NephroPlus. One row per hospital.
create table if not exists public.dialysis_payout_config (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null default 'hope' unique,
  percentage numeric not null default 75,
  pay_after_months integer not null default 3,
  updated_at timestamptz not null default now()
);

alter table public.dialysis_payout_config enable row level security;
drop policy if exists "dpc_all" on public.dialysis_payout_config;
create policy "dpc_all" on public.dialysis_payout_config for all using (true) with check (true);

insert into public.dialysis_payout_config (hospital_name, percentage, pay_after_months)
values ('hope', 75, 3)
on conflict (hospital_name) do nothing;
