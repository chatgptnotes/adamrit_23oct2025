-- Enable Supabase Realtime on the prescriptions table.
--
-- The pharmacy notification (usePendingPrescriptions.ts) subscribes to
-- postgres_changes on public.prescriptions so the bell updates instantly and a
-- toast fires the moment a doctor approves a prescription (status -> APPROVED,
-- "sent to pharmacy"). Without the table in the supabase_realtime publication,
-- no live events are delivered and the bell only refreshes via its 60s poll.
--
-- REPLICA IDENTITY FULL is required so the UPDATE payload carries the OLD row
-- (incl. old.status); the toast guard checks old.status !== 'APPROVED' to fire
-- only on the PENDING -> APPROVED transition, not on every edit of an
-- already-approved prescription.

alter table public.prescriptions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'prescriptions'
  ) then
    alter publication supabase_realtime add table public.prescriptions;
  end if;
end$$;
