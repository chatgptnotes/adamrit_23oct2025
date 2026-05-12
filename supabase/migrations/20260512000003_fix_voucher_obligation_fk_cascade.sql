-- Fix: deleting / updating a payment_obligation is blocked by the
-- "fk_voucher_obligation" foreign key (created out-of-band against
-- payment_obligations.id with default ON DELETE NO ACTION).
--
-- Re-create the constraint with ON DELETE CASCADE so removing an
-- obligation also removes its dependent voucher/push-queue rows.
-- The dynamic block locates the constraint by name regardless of which
-- table it lives on (the message in the UI was truncated to "tally_pus...").

DO $$
DECLARE
  fk_table  TEXT;
  fk_column TEXT;
BEGIN
  SELECT tc.table_name, kcu.column_name
    INTO fk_table, fk_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema    = kcu.table_schema
  WHERE tc.constraint_name = 'fk_voucher_obligation'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema    = 'public'
  LIMIT 1;

  IF fk_table IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT fk_voucher_obligation',
      fk_table
    );
    EXECUTE format(
      'ALTER TABLE public.%I
         ADD CONSTRAINT fk_voucher_obligation
         FOREIGN KEY (%I) REFERENCES public.payment_obligations(id)
         ON DELETE CASCADE',
      fk_table, fk_column
    );
    RAISE NOTICE 'fk_voucher_obligation re-created on % (%) with ON DELETE CASCADE', fk_table, fk_column;
  ELSE
    RAISE NOTICE 'fk_voucher_obligation not found in public schema; nothing to do';
  END IF;
END
$$;
