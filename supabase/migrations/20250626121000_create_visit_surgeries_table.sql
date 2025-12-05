-- Create visit_surgeries junction table
create table public.visit_surgeries (
  id uuid not null default gen_random_uuid (),
  visit_id uuid not null,
  surgery_id uuid not null,
  is_primary boolean null default false,
  status text null default 'planned',
  sanction_status text null default 'pending',
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint visit_surgeries_pkey primary key (id),
  constraint visit_surgeries_visit_id_fkey foreign key (visit_id) references visits (id) on delete cascade,
  constraint visit_surgeries_surgery_id_fkey foreign key (surgery_id) references cghs_surgery (id) on delete cascade
) tablespace pg_default;

-- Create indexes for better performance
create index idx_visit_surgeries_visit_id on public.visit_surgeries (visit_id);
create index idx_visit_surgeries_surgery_id on public.visit_surgeries (surgery_id);

-- Add unique constraint to prevent duplicate surgery for same visit
create unique index idx_visit_surgeries_unique on public.visit_surgeries (visit_id, surgery_id);

-- Enable RLS (Row Level Security)
alter table public.visit_surgeries enable row level security;

-- Create RLS policies (adjust as needed based on your auth setup)
create policy "Enable read access for all users" on public.visit_surgeries
  for select using (true);

create policy "Enable insert access for all users" on public.visit_surgeries
  for insert with check (true);

create policy "Enable update access for all users" on public.visit_surgeries
  for update using (true);

create policy "Enable delete access for all users" on public.visit_surgeries
  for delete using (true);
