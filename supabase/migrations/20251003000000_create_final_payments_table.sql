-- Create final_payments table
create table if not exists public.final_payments (
  id uuid not null default gen_random_uuid(),
  visit_id text not null,
  amount numeric(10, 2) not null,
  mode_of_payment text not null,
  reason_of_discharge text not null,
  payment_remark text,
  created_at timestamp with time zone not null default now(),
  created_by text,
  constraint final_payments_pkey primary key (id),
  constraint final_payments_visit_id_fkey foreign key (visit_id)
    references visits (visit_id) on delete cascade
) tablespace pg_default;

-- Create index on visit_id for faster lookups
create index if not exists idx_final_payments_visit_id
  on public.final_payments using btree (visit_id) tablespace pg_default;

-- Enable Row Level Security
alter table public.final_payments enable row level security;

-- Create RLS policies
create policy "Enable read access for all users" on public.final_payments
  for select using (true);

create policy "Enable insert for authenticated users" on public.final_payments
  for insert with check (auth.uid() is not null);

create policy "Enable update for authenticated users" on public.final_payments
  for update using (auth.uid() is not null);
