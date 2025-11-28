-- Add ESIC UHID column to visits
alter table public.visits add column if not exists esic_uh_id text;

-- Optional: index for quick filtering/searching by ESIC UHID
create index if not exists idx_visits_esic_uh_id on public.visits (esic_uh_id);
