-- Daily Allocation "Today's Expenses Sheet" persisted per hospital + date so it
-- is shared across all computers (instead of each browser's localStorage) and so
-- balances can carry forward to the next day.
create table if not exists public.daily_allocation_sheets (
  id uuid primary key default gen_random_uuid(),
  sheet_date date not null,
  hospital_type text not null default 'hope',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_allocation_sheets_hospital_date_key unique (hospital_type, sheet_date)
);

create index if not exists daily_allocation_sheets_hospital_date_idx
  on public.daily_allocation_sheets (hospital_type, sheet_date desc);

alter table public.daily_allocation_sheets enable row level security;

drop policy if exists "daily_allocation_sheets_select" on public.daily_allocation_sheets;
create policy "daily_allocation_sheets_select"
  on public.daily_allocation_sheets for select
  using (true);

drop policy if exists "daily_allocation_sheets_insert" on public.daily_allocation_sheets;
create policy "daily_allocation_sheets_insert"
  on public.daily_allocation_sheets for insert
  with check (true);

drop policy if exists "daily_allocation_sheets_update" on public.daily_allocation_sheets;
create policy "daily_allocation_sheets_update"
  on public.daily_allocation_sheets for update
  using (true)
  with check (true);

drop policy if exists "daily_allocation_sheets_delete" on public.daily_allocation_sheets;
create policy "daily_allocation_sheets_delete"
  on public.daily_allocation_sheets for delete
  using (true);
