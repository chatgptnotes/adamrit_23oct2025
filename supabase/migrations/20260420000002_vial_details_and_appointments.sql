-- Multi-vial barcode tracking for home collection
alter table home_collection_requests
  add column if not exists vial_details jsonb default '{}';

-- Doctors pool for appointment booking
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  qualification text,
  consultation_fee numeric(10,2) default 0,
  available_days text[] default '{}',
  slot_duration_minutes integer default 15,
  is_active boolean default true,
  phone text,
  room_number text,
  created_at timestamptz default now()
);

-- Insert some default doctors to get started
insert into doctors (name, specialty, qualification, consultation_fee, available_days, room_number) values
  ('Dr. General Physician', 'General Medicine', 'MBBS, MD', 300, ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], 'Room 1'),
  ('Dr. Cardiologist', 'Cardiology', 'MBBS, MD, DM', 500, ARRAY['Monday','Wednesday','Friday'], 'Room 2'),
  ('Dr. Gynaecologist', 'Gynaecology', 'MBBS, MS', 400, ARRAY['Tuesday','Thursday','Saturday'], 'Room 3')
on conflict do nothing;

-- Patient appointment booking
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  patient_name text not null,
  patient_mobile text,
  patient_age integer,
  appointment_date date not null,
  time_slot text not null,
  status text default 'scheduled' check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  chief_complaint text,
  notes text,
  visit_id uuid references visits(id) on delete set null,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_appointments_doctor_date on appointments(doctor_id, appointment_date);
create index if not exists idx_appointments_date on appointments(appointment_date);
create index if not exists idx_appointments_mobile on appointments(patient_mobile);

alter table doctors enable row level security;
do $$ begin create policy "doctors_all" on doctors for all using (true) with check (true);
exception when duplicate_object then null; end $$;

alter table appointments enable row level security;
do $$ begin create policy "appointments_all" on appointments for all using (true) with check (true);
exception when duplicate_object then null; end $$;
