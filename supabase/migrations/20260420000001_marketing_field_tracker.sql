-- Ensure base marketing tables exist (defensive — may already be applied)
create table if not exists marketing_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  designation text default 'Marketing Executive',
  department text default 'Marketing',
  employee_id text,
  joining_date date,
  is_active boolean default true,
  photo_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists doctor_visits (
  id uuid primary key default gen_random_uuid(),
  marketing_user_id uuid references marketing_users(id) on delete cascade,
  doctor_name text not null,
  specialty text,
  hospital_clinic_name text,
  contact_number text,
  email text,
  address text,
  visit_date date not null default current_date,
  visit_time time,
  visit_notes text,
  outcome text check (outcome in ('Positive','Neutral','Negative','Follow-up Required','Not Available')),
  follow_up_date date,
  follow_up_notes text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add field check-in/out, feedback, and referral tracking to doctor_visits
alter table doctor_visits
  add column if not exists check_in_at timestamptz,
  add column if not exists check_out_at timestamptz,
  add column if not exists feedback_rating integer check (feedback_rating between 1 and 5),
  add column if not exists samples_referred integer default 0,
  add column if not exists visit_photo_url text,
  add column if not exists visit_type text default 'field' check (visit_type in ('field','camp','cold_call','follow_up'));

alter table marketing_users enable row level security;
do $$ begin create policy "marketing_users_all" on marketing_users for all using (true) with check (true);
exception when duplicate_object then null; end $$;

alter table doctor_visits enable row level security;
do $$ begin create policy "doctor_visits_all" on doctor_visits for all using (true) with check (true);
exception when duplicate_object then null; end $$;
