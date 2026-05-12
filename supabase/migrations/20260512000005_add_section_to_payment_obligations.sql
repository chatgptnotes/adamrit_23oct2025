-- Director can now pick which of the four Obligations Master sections an
-- obligation belongs to, instead of relying on sub_category-based derivation.
-- Section is nullable; rows without it fall back to the client-side mapping.

ALTER TABLE public.payment_obligations
  ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE public.payment_obligations
  DROP CONSTRAINT IF EXISTS payment_obligations_section_check;

ALTER TABLE public.payment_obligations
  ADD CONSTRAINT payment_obligations_section_check
  CHECK (section IS NULL OR section IN (
    'pharmacy_implant',
    'consultants',
    'overheads',
    'other_vendors'
  ));

COMMENT ON COLUMN public.payment_obligations.section IS
  'Explicit Obligations Master section: pharmacy_implant | consultants | overheads | other_vendors. NULL falls back to sub_category-based mapping.';
