-- B2B Partner Portal: aggregators (Tata1MG, Akincare, etc.), TPAs, franchise labs
-- Partners submit home collection requests and track patient results

create table if not exists b2b_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('aggregator', 'tpa', 'corporate', 'franchise')),
  partner_code text unique not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  commission_rate numeric(5,2) default 0,
  credit_limit numeric(12,2) default 0,
  outstanding numeric(12,2) default 0,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed common aggregators
insert into b2b_partners (name, type, partner_code) values
  ('Tata 1mg', 'aggregator', 'TATA1MG'),
  ('Akincare', 'aggregator', 'AKINCARE'),
  ('mFine', 'aggregator', 'MFINE'),
  ('PharmEasy', 'aggregator', 'PHARMEASY'),
  ('Practo', 'aggregator', 'PRACTO')
on conflict (partner_code) do nothing;

-- Link home_collection_requests to a B2B partner (optional)
alter table home_collection_requests
  add column if not exists b2b_partner_id uuid references b2b_partners(id) on delete set null,
  add column if not exists b2b_partner_code text;

create index if not exists idx_b2b_partners_code on b2b_partners(partner_code);
create index if not exists idx_hc_b2b_partner on home_collection_requests(b2b_partner_id);

alter table b2b_partners enable row level security;
create policy "b2b_all" on b2b_partners for all using (true) with check (true);

create trigger update_b2b_updated_at
  before update on b2b_partners
  for each row execute procedure moddatetime(updated_at);
