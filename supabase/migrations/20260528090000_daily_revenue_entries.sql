-- Daily revenue entries: per-patient cost & RM cut tracking shown on the
-- Director Dashboard.
create table if not exists public.daily_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  patient_name text not null,
  department text,
  rm_name text,
  cost numeric(12, 2) not null default 0,
  cut numeric(12, 2) not null default 0,
  hospital_type text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_revenue_entries_date_idx
  on public.daily_revenue_entries (entry_date desc);

create index if not exists daily_revenue_entries_hospital_idx
  on public.daily_revenue_entries (hospital_type, entry_date desc);

alter table public.daily_revenue_entries enable row level security;

drop policy if exists "daily_revenue_entries_select" on public.daily_revenue_entries;
create policy "daily_revenue_entries_select"
  on public.daily_revenue_entries for select
  using (true);

drop policy if exists "daily_revenue_entries_insert" on public.daily_revenue_entries;
create policy "daily_revenue_entries_insert"
  on public.daily_revenue_entries for insert
  with check (true);

drop policy if exists "daily_revenue_entries_update" on public.daily_revenue_entries;
create policy "daily_revenue_entries_update"
  on public.daily_revenue_entries for update
  using (true)
  with check (true);

drop policy if exists "daily_revenue_entries_delete" on public.daily_revenue_entries;
create policy "daily_revenue_entries_delete"
  on public.daily_revenue_entries for delete
  using (true);
