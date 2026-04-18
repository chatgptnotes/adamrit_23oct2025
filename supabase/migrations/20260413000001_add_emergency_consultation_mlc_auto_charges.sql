-- Add Consultation Charges to clinical_services
-- EMERGENCY CHARGES already exists in the database — skipped to avoid duplicate
-- MLC (Medico Legal Case) Processing already exists in mandatory_services — not added here
-- These are fixed one-time charges auto-added to every bill (quantity = 1)

INSERT INTO public.clinical_services (service_name, tpa_rate, private_rate, nabh_rate, non_nabh_rate, status)
VALUES
  ('Consultation Charges', 2000.00, 2000.00, 2000.00, 2000.00, 'Active');
