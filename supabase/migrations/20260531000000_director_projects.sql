-- Director's "My Projects" launcher table. One row per quick-launch tile shown
-- on /director-dashboard. Editable from the UI (Add Project, edit, delete).

create table if not exists public.director_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.director_projects_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_director_projects_touch on public.director_projects;
create trigger trg_director_projects_touch
  before update on public.director_projects
  for each row execute function public.director_projects_touch_updated_at();

alter table public.director_projects enable row level security;

drop policy if exists "director_projects_select" on public.director_projects;
create policy "director_projects_select"
  on public.director_projects for select using (true);

drop policy if exists "director_projects_insert" on public.director_projects;
create policy "director_projects_insert"
  on public.director_projects for insert with check (true);

drop policy if exists "director_projects_update" on public.director_projects;
create policy "director_projects_update"
  on public.director_projects for update using (true) with check (true);

drop policy if exists "director_projects_delete" on public.director_projects;
create policy "director_projects_delete"
  on public.director_projects for delete using (true);

-- Seed: existing 6 hard-coded launcher entries + the 2 new share links.
insert into public.director_projects (name, url, description, sort_order) values
  ('Fluxio',            'https://fluxio.work/',                                                            'Fluxio workspace',                          10),
  ('Hopetech',          'https://hopetech.me',                                                             'Hopetech portal',                           20),
  ('Pulse of Project',  'https://www.pulseofproject.com/',                                                 'Pulse of Project dashboard',                30),
  ('Hisab',             'https://hisab.work',                                                              'Hisab accounts',                            40),
  ('Proposalos',        'https://proposalos.in',                                                           'Proposalos',                                50),
  ('NABH Online',       'https://www.nabh.online/',                                                        'NABH Online',                               60),
  ('GST Compliance',    'https://www.fluxio.work/shared/3a10b204c81df38d47f391e030ad8999',                 'Shared GST dashboard for the CA',           70),
  ('Tax Deadlines',     'https://www.fluxio.work/shared/e27de9b8a3be89a3abd086dab3917dd0',                 'IT + TDS deadlines across all 4 entities',  80)
on conflict do nothing;

notify pgrst, 'reload schema';
