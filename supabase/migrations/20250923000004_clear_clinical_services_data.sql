-- Clear all existing clinical services data to start fresh with manual entry
-- This resolves the hospital name formatting mismatch issue

DELETE FROM public.clinical_services;