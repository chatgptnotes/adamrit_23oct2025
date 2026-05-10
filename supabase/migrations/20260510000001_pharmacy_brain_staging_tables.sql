-- =============================================================================
-- Pharmacy AI Brain · Staging Tables
--
-- PRODUCTION SAFETY GUARANTEES:
--   * 100% additive. No DROP, no destructive ALTER.
--   * CREATE TABLE IF NOT EXISTS — idempotent.
--   * No existing table, column, or policy is modified.
--
-- WHAT THIS DOES:
--   1. Creates agent_po_suggestions — staging area for AI reorder suggestions.
--   2. Creates agent_threshold_recommendations — AI-generated min-stock reviews.
--   Both tables have RLS: SELECT for authenticated, INSERT/UPDATE/DELETE
--   only via service_role (Edge Function).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS agent_threshold_recommendations;
--   DROP TABLE IF EXISTS agent_po_suggestions;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. agent_po_suggestions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_po_suggestions (
    id                  BIGSERIAL PRIMARY KEY,
    run_id              UUID NOT NULL,
    medicine_id         UUID NOT NULL REFERENCES public.medicines(id),
    medicine_name       TEXT NOT NULL,
    on_hand             INT NOT NULL,
    avg_daily_sales     NUMERIC(10,2) NOT NULL,
    days_of_cover       NUMERIC(10,2) NOT NULL,
    suggested_qty       INT NOT NULL,
    supplier            TEXT,
    expected_stockout   DATE,
    confidence          REAL NOT NULL,
    rationale           TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','promoted','rejected','expired')),
    promoted_to_po_id   UUID REFERENCES public.purchase_orders(id),
    rejected_reason     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS agent_po_suggestions_status_created_idx
    ON public.agent_po_suggestions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_po_suggestions_medicine_idx
    ON public.agent_po_suggestions (medicine_id, created_at DESC);

ALTER TABLE public.agent_po_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_po_suggestions_authenticated_read ON public.agent_po_suggestions;
CREATE POLICY agent_po_suggestions_authenticated_read ON public.agent_po_suggestions
    FOR SELECT TO authenticated USING (TRUE);

-- ---------------------------------------------------------------------------
-- 2. agent_threshold_recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_threshold_recommendations (
    id                      BIGSERIAL PRIMARY KEY,
    run_id                  UUID NOT NULL,
    medicine_id             UUID NOT NULL REFERENCES public.medicines(id),
    medicine_name           TEXT NOT NULL,
    current_min_level       INT NOT NULL,
    observed_avg_daily      NUMERIC(10,2) NOT NULL,
    observation_window_days INT NOT NULL DEFAULT 14,
    recommended_min_level   INT NOT NULL,
    direction               TEXT NOT NULL CHECK (direction IN ('increase','decrease','keep')),
    confidence              REAL NOT NULL,
    rationale               TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','rejected')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_threshold_rec_status_created_idx
    ON public.agent_threshold_recommendations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_threshold_rec_medicine_idx
    ON public.agent_threshold_recommendations (medicine_id, created_at DESC);

ALTER TABLE public.agent_threshold_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_threshold_rec_authenticated_read ON public.agent_threshold_recommendations;
CREATE POLICY agent_threshold_rec_authenticated_read ON public.agent_threshold_recommendations
    FOR SELECT TO authenticated USING (TRUE);
