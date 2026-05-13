-- Add package_name and package_days columns to advance_payment table
ALTER TABLE public.advance_payment
ADD COLUMN package_name TEXT,
ADD COLUMN package_days INTEGER;
