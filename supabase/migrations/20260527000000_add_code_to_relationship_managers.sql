-- Add an auto-generated, unique numeric code to relationship_managers.
-- Reports/dashboards display only this code; the RM name is kept for the
-- master page and registration pickers but is never shown in reports.

-- 1. Add the code column (nullable for now so we can backfill existing rows).
ALTER TABLE public.relationship_managers
  ADD COLUMN IF NOT EXISTS code TEXT;

-- 2. Sequence that produces the digits-only codes, starting at 1001.
CREATE SEQUENCE IF NOT EXISTS public.relationship_manager_code_seq
  START WITH 1001
  INCREMENT BY 1;

-- 3. Backfill existing rows with stable codes (oldest first).
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id FROM public.relationship_managers
    WHERE code IS NULL
    ORDER BY created_at, id
  LOOP
    UPDATE public.relationship_managers
      SET code = nextval('public.relationship_manager_code_seq')::text
      WHERE id = rec.id;
  END LOOP;
END $$;

-- 4. Auto-assign the next code on insert when none is provided.
CREATE OR REPLACE FUNCTION public.set_relationship_manager_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := nextval('public.relationship_manager_code_seq')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_relationship_manager_code ON public.relationship_managers;
CREATE TRIGGER trigger_set_relationship_manager_code
  BEFORE INSERT ON public.relationship_managers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_relationship_manager_code();

-- 5. Enforce uniqueness of the code.
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationship_managers_code
  ON public.relationship_managers(code);
