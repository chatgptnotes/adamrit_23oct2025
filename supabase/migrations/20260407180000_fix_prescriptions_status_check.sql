-- Fix prescriptions status CHECK constraint to allow all required statuses
-- Current constraint likely only allows a subset, blocking APPROVED/PARTIALLY_DISPENSED

-- Drop the existing check constraint
ALTER TABLE public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_status_check;

-- Recreate with all needed statuses
ALTER TABLE public.prescriptions
  ADD CONSTRAINT prescriptions_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED', 'REJECTED'));
