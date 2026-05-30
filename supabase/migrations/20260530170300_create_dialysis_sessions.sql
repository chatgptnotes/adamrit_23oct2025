-- NephroPlus dialysis session register. One row per dialysis session/charge that
-- participates in the Hope <-> NephroPlus revenue share. Sessions usually link to an
-- existing patient/visit (encounter_type + payer auto-filled) but manual entry is
-- allowed (patient_id/visit_id NULL, patient_name typed in).
--
-- hope_share / nephroplus_share / rate_pct_applied are SNAPSHOTS computed at save
-- time from dialysis_rate_config, so historical settlements stay stable even if the
-- rate grid is later edited.
create table if not exists public.dialysis_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null default current_date,
  patient_id uuid references public.patients(id) on delete set null,
  visit_id text,                    -- visits.visit_id (text business key); nullable for manual entries
  patient_name text not null,
  encounter_type text not null check (encounter_type in ('OP', 'IP')),
  payer_type text not null check (payer_type in ('private_credit', 'govt', 'cash')),
  service_category text not null,   -- -> dialysis_rate_config.service_category
  charged_price numeric not null default 0,
  margin_amount numeric,            -- used when the matched rate row basis = 'margin'
  rate_pct_applied numeric,         -- % snapshot actually applied (NULL when NA)
  hope_share numeric not null default 0,
  nephroplus_share numeric not null default 0,
  notes text,
  created_by text,
  hospital_name text not null default 'hope',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dialysis_sessions_date_idx
  on public.dialysis_sessions (hospital_name, session_date desc);
create index if not exists dialysis_sessions_patient_idx
  on public.dialysis_sessions (patient_id);

alter table public.dialysis_sessions enable row level security;

drop policy if exists "dialysis_sessions_select" on public.dialysis_sessions;
create policy "dialysis_sessions_select"
  on public.dialysis_sessions for select using (true);

drop policy if exists "dialysis_sessions_insert" on public.dialysis_sessions;
create policy "dialysis_sessions_insert"
  on public.dialysis_sessions for insert with check (true);

drop policy if exists "dialysis_sessions_update" on public.dialysis_sessions;
create policy "dialysis_sessions_update"
  on public.dialysis_sessions for update using (true) with check (true);

drop policy if exists "dialysis_sessions_delete" on public.dialysis_sessions;
create policy "dialysis_sessions_delete"
  on public.dialysis_sessions for delete using (true);
