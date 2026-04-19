-- Queue token system for department-wise patient waiting management
-- Supports TV display and patient app queue view

create table if not exists queue_tokens (
  id uuid primary key default gen_random_uuid(),
  token_number integer not null,
  department text not null check (department in (
    'OPD', 'Lab', 'Radiology', 'USG', 'CT', 'MRI', 'X-Ray',
    'ECG', 'Pharmacy', 'Billing', 'Physiotherapy', 'BMD', 'MAMO'
  )),
  patient_name text not null,
  patient_id uuid references patients(id) on delete set null,
  visit_id uuid references visits(id) on delete set null,
  mobile text,
  status text not null default 'waiting' check (status in ('waiting', 'called', 'serving', 'done', 'skipped')),
  called_at timestamptz,
  served_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text,
  notes text,
  -- track which counter/room called this token
  counter_name text
);

-- Index for fast real-time queries per department
create index idx_queue_tokens_dept_status on queue_tokens(department, status, created_at);
create index idx_queue_tokens_date on queue_tokens(created_at);

-- Daily counter: auto-increment token per department per day
-- Token numbers reset at midnight
create or replace function next_queue_token(dept text)
returns integer
language plpgsql
as $$
declare
  max_token integer;
begin
  select coalesce(max(token_number), 0)
  into max_token
  from queue_tokens
  where department = dept
    and created_at >= current_date
    and created_at < current_date + interval '1 day';
  return max_token + 1;
end;
$$;

-- RLS
alter table queue_tokens enable row level security;
create policy "queue_tokens_all" on queue_tokens for all using (true) with check (true);
