-- Staff attendance tracking for phlebotomists, marketing, and front desk
create table if not exists staff_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  employee_id text,
  department text default 'General',
  shift_type text default 'Morning' check (shift_type in ('Morning', 'Afternoon', 'Night', 'Full Day')),
  work_date date not null default current_date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  -- Computed duration in minutes (null until checked out)
  duration_minutes integer generated always as (
    case when check_in_at is not null and check_out_at is not null
    then extract(epoch from (check_out_at - check_in_at))::integer / 60
    else null end
  ) stored,
  notes text,
  status text default 'present' check (status in ('present', 'absent', 'half_day', 'on_leave')),
  created_at timestamptz default now()
);

create unique index if not exists idx_attendance_employee_date
  on staff_attendance(employee_name, work_date);

create index if not exists idx_attendance_date on staff_attendance(work_date);

alter table staff_attendance enable row level security;
create policy "attendance_all" on staff_attendance for all using (true) with check (true);
