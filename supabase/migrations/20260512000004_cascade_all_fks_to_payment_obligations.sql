-- Multiple out-of-band foreign keys reference payment_obligations(id) with
-- ON DELETE NO ACTION (the default), which blocks deleting an obligation.
-- We've already fixed `fk_voucher_obligation`; this migration generalizes
-- the fix by finding *all* FKs pointing at payment_obligations.id (in any
-- child table) and re-creating them with ON DELETE CASCADE if they aren't
-- already.

DO $$
DECLARE
  rec RECORD;
  new_def TEXT;
BEGIN
  FOR rec IN
    SELECT
      tc.table_schema   AS child_schema,
      tc.table_name     AS child_table,
      tc.constraint_name,
      kcu.column_name   AS child_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
     AND rc.constraint_schema = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
     AND rc.unique_constraint_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema   = 'public'
      AND ccu.table_name     = 'payment_obligations'
      AND ccu.column_name    = 'id'
  LOOP
    IF rec.delete_rule = 'CASCADE' THEN
      RAISE NOTICE 'OK: %.% constraint % already CASCADE — skipping',
        rec.child_schema, rec.child_table, rec.constraint_name;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Rewriting %.% constraint % (was %) → CASCADE',
      rec.child_schema, rec.child_table, rec.constraint_name, rec.delete_rule;

    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      rec.child_schema, rec.child_table, rec.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I
         ADD CONSTRAINT %I
         FOREIGN KEY (%I) REFERENCES public.payment_obligations(id)
         ON DELETE CASCADE',
      rec.child_schema, rec.child_table, rec.constraint_name, rec.child_column
    );
  END LOOP;
END
$$;
