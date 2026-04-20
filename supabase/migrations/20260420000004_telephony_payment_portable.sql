-- Call logs for telephony dashboard (add missing columns if table already exists)
create table if not exists call_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);
alter table call_logs add column if not exists caller_number text;
alter table call_logs add column if not exists patient_id uuid references patients(id) on delete set null;
alter table call_logs add column if not exists patient_name text;
alter table call_logs add column if not exists call_type text default 'inbound';
alter table call_logs add column if not exists action_taken text;
alter table call_logs add column if not exists notes text;
alter table call_logs add column if not exists duration_seconds integer;
alter table call_logs add column if not exists handled_by text;

create index if not exists idx_call_logs_caller on call_logs(caller_number);
create index if not exists idx_call_logs_created on call_logs(created_at desc);

alter table call_logs enable row level security;
do $$ begin create policy "call_logs_all" on call_logs for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Payment requests for UPI QR billing
create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete set null,
  patient_name text,
  amount numeric(10,2) not null,
  upi_id text default 'hope@upi',
  upi_ref text,
  qr_data text,
  gateway text default 'upi',
  status text default 'pending' check (status in ('pending','paid','failed','expired','cancelled')),
  notes text,
  created_at timestamptz default now(),
  paid_at timestamptz,
  expires_at timestamptz default (now() + interval '30 minutes')
);
create index if not exists idx_payment_requests_visit on payment_requests(visit_id);
create index if not exists idx_payment_requests_status on payment_requests(status);

alter table payment_requests enable row level security;
do $$ begin create policy "payment_requests_all" on payment_requests for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Add portable service type to home collection
alter table home_collection_requests
  add column if not exists service_type text default 'blood_draw';
