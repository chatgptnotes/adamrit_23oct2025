-- Director Dashboard: link payment obligations to Tally ledgers and store
-- a manual approximate balance (used when the ledger value is stale or unknown).

ALTER TABLE public.payment_obligations
  ADD COLUMN IF NOT EXISTS tally_ledger_id UUID REFERENCES public.tally_ledgers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approximate_balance NUMERIC(15,2);

CREATE INDEX IF NOT EXISTS idx_payment_obligations_tally_ledger_id
  ON public.payment_obligations(tally_ledger_id);

COMMENT ON COLUMN public.payment_obligations.tally_ledger_id IS
  'Linked Tally ledger. Outstanding is derived live from tally_ledgers.closing_balance.';

COMMENT ON COLUMN public.payment_obligations.approximate_balance IS
  'Director''s manual estimate. Use when the ledger value is stale or no ledger is linked yet.';
