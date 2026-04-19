-- Add technician workflow columns to radiology_orders
alter table radiology_orders
  add column if not exists scan_started_at timestamptz,
  add column if not exists scan_completed_at timestamptz,
  add column if not exists radiologist_notes text,
  add column if not exists priority text default 'routine' check (priority in ('routine', 'urgent', 'stat'));
