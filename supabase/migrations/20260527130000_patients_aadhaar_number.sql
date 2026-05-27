-- Dedicated Aadhaar number on patients.
--
-- Additive + idempotent: existing rows receive NULL and are never modified or
-- deleted. "Mandatory" is enforced in the app for NEW registrations only, so
-- the column stays nullable and legacy rows remain valid. The existing combined
-- `aadhar_passport` column is left untouched.

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;

-- Uniqueness scoped per hospital (matches the existing hospital_name isolation
-- model). Partial index: only non-null values are constrained, so existing NULL
-- rows never conflict, and the same Aadhaar can still exist across hospitals but
-- never twice within one hospital.
CREATE UNIQUE INDEX IF NOT EXISTS patients_hospital_aadhaar_unique
  ON public.patients (hospital_name, aadhaar_number)
  WHERE aadhaar_number IS NOT NULL;
