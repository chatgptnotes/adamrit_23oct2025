-- Add is_hidden flag to relationship_managers so records can be hidden
-- instead of being permanently deleted.
ALTER TABLE public.relationship_managers
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Index to keep the "visible managers" query fast.
CREATE INDEX IF NOT EXISTS idx_relationship_managers_is_hidden
  ON public.relationship_managers(is_hidden);
