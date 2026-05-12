-- Editable master list of sub-categories that show up in the Add/Edit
-- Obligation dialog. Each row also declares which of the 4 Obligations
-- Master sections it rolls up into, so existing client-side mapping
-- can be replaced by a DB lookup once UI migration is complete.

CREATE TABLE IF NOT EXISTS public.payment_obligation_sub_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value       TEXT NOT NULL UNIQUE,                                  -- short slug stored on payment_obligations.sub_category
  label       TEXT NOT NULL,                                         -- human-readable
  section     TEXT NOT NULL CHECK (section IN (
                'pharmacy_implant',
                'consultants',
                'overheads',
                'other_vendors'
              )),
  sort_order  INTEGER NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sub_cat_section
  ON public.payment_obligation_sub_categories(section, sort_order);

ALTER TABLE public.payment_obligation_sub_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read sub-cats" ON public.payment_obligation_sub_categories;
CREATE POLICY "Authenticated read sub-cats" ON public.payment_obligation_sub_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated write sub-cats" ON public.payment_obligation_sub_categories;
CREATE POLICY "Authenticated write sub-cats" ON public.payment_obligation_sub_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed with the current hard-coded values so the Add/Edit dialog
-- behaves identically the moment this migration applies.
INSERT INTO public.payment_obligation_sub_categories (value, label, section, sort_order) VALUES
  ('pharmacy',    'Pharmacy',    'pharmacy_implant', 10),
  ('implant',     'Implant',     'pharmacy_implant', 20),
  ('consultant',  'Consultant',  'consultants',      30),
  ('rmo',         'RMO',         'consultants',      40),
  ('rent',        'Rent',        'overheads',        50),
  ('electricity', 'Electricity', 'overheads',        60),
  ('salary',      'Salary',      'overheads',        70),
  ('dialysis',    'Dialysis',    'overheads',        80),
  ('referral',    'Referral',    'other_vendors',    90),
  ('vendor',      'Vendor',      'other_vendors',   100),
  ('other',       'Other',       'other_vendors',   110)
ON CONFLICT (value) DO NOTHING;

COMMENT ON TABLE public.payment_obligation_sub_categories IS
  'Editable master of Add/Edit Obligation Sub-Category dropdown values. Each row also maps to a parent Obligations Master section.';
