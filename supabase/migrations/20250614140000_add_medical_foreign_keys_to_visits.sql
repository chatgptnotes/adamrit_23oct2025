-- Add foreign key columns for medical data to visits table
-- These will reference the lab_orders, radiology_orders, and prescriptions tables

ALTER TABLE public.visits 
ADD COLUMN lab_order_id UUID REFERENCES lab_orders(id),
ADD COLUMN radiology_order_id UUID REFERENCES radiology_orders(id),
ADD COLUMN prescription_id UUID REFERENCES prescriptions(id);

-- Create indexes for better performance
CREATE INDEX idx_visits_lab_order_id ON public.visits(lab_order_id);
CREATE INDEX idx_visits_radiology_order_id ON public.visits(radiology_order_id);
CREATE INDEX idx_visits_prescription_id ON public.visits(prescription_id);

-- Add comments for documentation
COMMENT ON COLUMN public.visits.lab_order_id IS 'Foreign key to lab_orders table for tracking lab tests ordered during this visit';
COMMENT ON COLUMN public.visits.radiology_order_id IS 'Foreign key to radiology_orders table for tracking radiology studies ordered during this visit';
COMMENT ON COLUMN public.visits.prescription_id IS 'Foreign key to prescriptions table for tracking medications prescribed during this visit';