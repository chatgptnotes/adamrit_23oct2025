-- NephroPlus (Nephrocare Health Services) dialysis revenue-sharing partnership.
-- Annexure III of the Supplemental Agreement (effective 09-Dec-2024) defines
-- DRM Hope Hospital's ("First Party") % entitlement of the "Charged Price" of each
-- dialysis service, split by OP vs IP and by payer column
-- (Private credit / Govt scheme / Cash).
--
-- Stored as an EDITABLE table because the contract allows the rates to be revised
-- (>= 5% every half-year) and because two grid footnotes conflict with the table
-- values (Lab: table 75% vs footnote 25%-of-margin; Bloodline/Dialyzer: table
-- 20%-of-margin vs footnote "no share"). Seed uses the grid-table values; the
-- Rates admin UI lets staff reconcile the footnotes without a code change.
--
-- `*_pct` is the First Party (Hope) share of `basis`. NULL = NA (not shareable).
-- `basis` = 'charged' (share of Charged Price) or 'margin' (share of item margin).
create table if not exists public.dialysis_rate_config (
  id uuid primary key default gen_random_uuid(),
  service_category text not null,
  label text not null,
  applies_to text not null default 'BOTH' check (applies_to in ('OP', 'IP', 'BOTH')),
  band_min numeric,                 -- guidance for category auto-suggest (price > band_min)
  band_max numeric,                 -- guidance for category auto-suggest (price < band_max)
  basis text not null default 'charged' check (basis in ('charged', 'margin')),
  private_pct numeric,              -- Private credit (TPA/Corporate); NULL = NA
  govt_pct numeric,                 -- Govt scheme (MJPJAY/PMJAY); NULL = NA
  cash_pct numeric,                 -- Cash; NULL = NA
  sort_order integer not null default 0,
  active boolean not null default true,
  hospital_name text not null default 'hope',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dialysis_rate_config_unique unique (hospital_name, service_category)
);

create index if not exists dialysis_rate_config_lookup_idx
  on public.dialysis_rate_config (hospital_name, active, sort_order);

alter table public.dialysis_rate_config enable row level security;

drop policy if exists "dialysis_rate_config_select" on public.dialysis_rate_config;
create policy "dialysis_rate_config_select"
  on public.dialysis_rate_config for select using (true);

drop policy if exists "dialysis_rate_config_insert" on public.dialysis_rate_config;
create policy "dialysis_rate_config_insert"
  on public.dialysis_rate_config for insert with check (true);

drop policy if exists "dialysis_rate_config_update" on public.dialysis_rate_config;
create policy "dialysis_rate_config_update"
  on public.dialysis_rate_config for update using (true) with check (true);

drop policy if exists "dialysis_rate_config_delete" on public.dialysis_rate_config;
create policy "dialysis_rate_config_delete"
  on public.dialysis_rate_config for delete using (true);

-- Seed the agreement grid (table values). Idempotent on (hospital_name, service_category).
insert into public.dialysis_rate_config
  (service_category, label, applies_to, band_min, band_max, basis, private_pct, govt_pct, cash_pct, sort_order)
values
  ('crrt_sled_icu_plasma',   'CRRT / SLED / ICU / Plasmapheresis', 'BOTH', 1500, null,  'charged', 25,   null, 25,   10),
  ('dialysis_below_1000',    'Single-use / Re-use Dialysis (< 1000)', 'BOTH', null, 1000, 'charged', 0,    0,    0,    20),
  ('reuse_1000_1500',        'Re-use Dialysis (1000-1500)',        'BOTH', 1000, 1500, 'charged', 20,   18,   20,   30),
  ('dialysis_gte_1500',      'Re-use / Single-use Dialysis (>= 1500)', 'BOTH', 1500, null, 'charged', 25, 20,  25,   40),
  ('emergency_gte_1500',     'Emergency Charges (>= 1500)',        'BOTH', 1500, null,  'charged', 25,   20,   25,   50),
  ('pharmacy_separate',      'Pharmacy (sold separately)',         'BOTH', null, null,  'margin',  20,   null, 20,   60),
  ('lab_investigation',      'Lab Investigation',                  'BOTH', null, null,  'charged', 75,   null, 75,   70),
  ('bloodline_dialyzer',     'Bloodline + Dialyzer (sold separately)', 'BOTH', null, null, 'margin', 20, null, 20,   80),
  ('procedures',             'Procedures',                         'IP',   null, null,  'margin',  50,   null, 50,   90),
  ('kidney_transplant',      'Kidney Transplant',                  'IP',   null, null,  'charged', 90,   null, 90,   100)
on conflict (hospital_name, service_category) do nothing;
