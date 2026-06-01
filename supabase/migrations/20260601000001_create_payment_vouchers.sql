-- Payment vouchers: cash given to a person going outside the organization.
-- One row per voucher (person + amount + date), with an auto-generated human
-- readable voucher number and optional purpose / paid-by.

CREATE TABLE IF NOT EXISTS public.payment_vouchers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_no   VARCHAR(50) NOT NULL,
  voucher_date DATE NOT NULL,
  person_name  TEXT NOT NULL,
  amount       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  purpose      TEXT,
  paid_by      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (voucher_no)
);

CREATE INDEX IF NOT EXISTS idx_payment_vouchers_voucher_date
  ON public.payment_vouchers (voucher_date DESC);

-- Keep updated_at fresh on every update.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_vouchers_updated_at ON public.payment_vouchers;
CREATE TRIGGER update_payment_vouchers_updated_at
  BEFORE UPDATE ON public.payment_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Match the access pattern used by other operational tables in this app.
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on payment_vouchers" ON public.payment_vouchers;
CREATE POLICY "Allow all operations on payment_vouchers"
  ON public.payment_vouchers
  FOR ALL USING (true) WITH CHECK (true);
