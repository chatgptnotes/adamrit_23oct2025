-- Add document tracking columns to visits table
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS photos_documents JSONB DEFAULT '{"selected": [], "updated_at": null}'::jsonb,
ADD COLUMN IF NOT EXISTS sign_documents JSONB DEFAULT '{"selected": [], "updated_at": null}'::jsonb,
ADD COLUMN IF NOT EXISTS hospital_stamp_documents JSONB DEFAULT '{"selected": [], "updated_at": null}'::jsonb,
ADD COLUMN IF NOT EXISTS dr_surgeon_stamp_documents JSONB DEFAULT '{"selected": [], "updated_at": null}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.visits.photos_documents IS 'Tracks photo documents: P2-Form, P6-Form, Patient Photo Geotag';
COMMENT ON COLUMN public.visits.sign_documents IS 'Tracks sign documents: Referral, Entitlement, IP-Details, P2-Form, P6-Form, Final-Bill, E-pehchan Card, Doctor Sign';
COMMENT ON COLUMN public.visits.hospital_stamp_documents IS 'Tracks hospital stamp documents: Final Bill, Discharge Summary, P2-Form with Sign, P6-Form, OT-Notes';
COMMENT ON COLUMN public.visits.dr_surgeon_stamp_documents IS 'Tracks doctor/surgeon stamp documents: Discharge Summary, OT Notes, Final Bill';

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_visits_photos_documents ON public.visits USING gin (photos_documents);
CREATE INDEX IF NOT EXISTS idx_visits_sign_documents ON public.visits USING gin (sign_documents);
CREATE INDEX IF NOT EXISTS idx_visits_hospital_stamp_documents ON public.visits USING gin (hospital_stamp_documents);
CREATE INDEX IF NOT EXISTS idx_visits_dr_surgeon_stamp_documents ON public.visits USING gin (dr_surgeon_stamp_documents);