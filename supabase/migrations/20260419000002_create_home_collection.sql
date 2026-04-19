-- Home collection request management for phlebotomists
-- Tracks scheduling, assignment, sample pickup, and barcode linking

create table if not exists home_collection_requests (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_id uuid references patients(id) on delete set null,
  mobile text not null,
  address text not null,
  locality text,
  pincode text,
  -- Geo coordinates for route planning
  latitude numeric(10,7),
  longitude numeric(10,7),
  -- Tests requested
  tests_requested text[] not null default '{}',
  special_instructions text,
  -- Scheduling
  preferred_date date not null default current_date,
  preferred_time_slot text check (preferred_time_slot in ('6am-8am','8am-10am','10am-12pm','12pm-2pm','2pm-4pm','4pm-6pm')),
  -- Assignment
  phlebotomist_id uuid references "User"(id) on delete set null,
  phlebotomist_name text,
  -- Status workflow
  status text not null default 'pending' check (status in (
    'pending', 'assigned', 'en_route', 'arrived', 'sample_collected', 'delivered', 'cancelled'
  )),
  -- Timestamps
  assigned_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Billing
  collection_charges numeric(10,2) default 0,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'waived')),
  payment_mode text,
  -- Sample barcodes assigned during collection
  barcodes text[] default '{}',
  -- Internal reference
  request_number text unique,
  notes text,
  created_by text
);

-- Auto-generate request number
create or replace function generate_hc_number()
returns trigger language plpgsql as $$
begin
  new.request_number := 'HC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(
    (select coalesce(count(*), 0) + 1 from home_collection_requests
     where created_at >= current_date)::text, 3, '0'
  );
  return new;
end;
$$;

create trigger set_hc_number
  before insert on home_collection_requests
  for each row execute function generate_hc_number();

create trigger update_hc_updated_at
  before update on home_collection_requests
  for each row execute procedure moddatetime(updated_at);

create index idx_hc_status_date on home_collection_requests(status, preferred_date);
create index idx_hc_phlebotomist on home_collection_requests(phlebotomist_id, preferred_date);

alter table home_collection_requests enable row level security;
create policy "hc_all" on home_collection_requests for all using (true) with check (true);
