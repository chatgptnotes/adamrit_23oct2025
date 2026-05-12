-- Junction table: one row per (payment_obligation, tally_company), pointing to
-- the ledger row in that company's books. Lets the director see the live
-- outstanding for a single obligation across every Tally company (Hope, Ayushman, ...).

CREATE TABLE IF NOT EXISTS public.payment_obligation_ledgers (
  obligation_id UUID NOT NULL REFERENCES public.payment_obligations(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES public.tally_config(id)         ON DELETE CASCADE,
  ledger_id     UUID NOT NULL REFERENCES public.tally_ledgers(id)        ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (obligation_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_pol_company_id ON public.payment_obligation_ledgers(company_id);
CREATE INDEX IF NOT EXISTS idx_pol_ledger_id  ON public.payment_obligation_ledgers(ledger_id);

ALTER TABLE public.payment_obligation_ledgers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read pol" ON public.payment_obligation_ledgers;
CREATE POLICY "Authenticated read pol" ON public.payment_obligation_ledgers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated write pol" ON public.payment_obligation_ledgers;
CREATE POLICY "Authenticated write pol" ON public.payment_obligation_ledgers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Backfill from the legacy single-FK column. Pairs each obligation with whichever
-- company its previously-linked ledger belongs to.
INSERT INTO public.payment_obligation_ledgers (obligation_id, company_id, ledger_id)
SELECT po.id, tl.company_id, po.tally_ledger_id
FROM public.payment_obligations po
JOIN public.tally_ledgers tl ON tl.id = po.tally_ledger_id
WHERE po.tally_ledger_id IS NOT NULL
  AND tl.company_id IS NOT NULL
ON CONFLICT (obligation_id, company_id) DO NOTHING;

COMMENT ON TABLE public.payment_obligation_ledgers IS
  'Per-company ledger links for each payment obligation. Replaces the single tally_ledger_id FK on payment_obligations (kept as legacy fallback).';
