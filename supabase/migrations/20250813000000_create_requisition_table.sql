-- ========================================
-- REQUISITION TABLE MIGRATION
-- Creates a unified table for lab and radiology requisitions
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main requisition table
CREATE TABLE IF NOT EXISTS public.requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    
    -- Requisition Type and Details
    requisition_type VARCHAR(20) NOT NULL CHECK (requisition_type IN ('lab', 'radiology')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    
    -- Clinical Information
    clinical_indication TEXT,
    clinical_history TEXT,
    diagnosis TEXT,
    
    -- Ordering Information
    ordering_physician VARCHAR(200),
    ordering_department VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_date DATE,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    
    -- Lab-specific fields (NULL for radiology)
    lab_test_ids UUID[], -- Array of lab test IDs
    lab_panel_ids UUID[], -- Array of lab panel IDs
    sample_type VARCHAR(100),
    sample_volume VARCHAR(50),
    container_type VARCHAR(100),
    preparation_instructions TEXT,
    fasting_required BOOLEAN DEFAULT false,
    fasting_hours INTEGER,
    
    -- Radiology-specific fields (NULL for lab)
    radiology_procedure_id UUID, -- References radiology_procedures(id)
    radiology_modality_id UUID, -- References radiology_modalities(id)
    body_part VARCHAR(100),
    contrast_required BOOLEAN DEFAULT false,
    contrast_type VARCHAR(100),
    radiation_dose DECIMAL(10,3), -- mGy
    
    -- Financial Information
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    insurance_coverage DECIMAL(5,2) DEFAULT 100.00, -- percentage
    patient_share DECIMAL(12,2) DEFAULT 0.00,
    
    -- Processing Information
    assigned_technician_id UUID, -- For lab: lab_technicians, For radiology: radiology_technologists
    assigned_radiologist_id UUID, -- Only for radiology
    processing_start_time TIMESTAMP WITH TIME ZONE,
    processing_end_time TIMESTAMP WITH TIME ZONE,
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    
    -- Results and Reports
    result_ready BOOLEAN DEFAULT false,
    report_generated BOOLEAN DEFAULT false,
    report_path VARCHAR(500),
    report_generated_at TIMESTAMP WITH TIME ZONE,
    report_generated_by UUID,
    
    -- Notes and Comments
    internal_notes TEXT,
    patient_instructions TEXT,
    cancellation_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create indexes for better performance
CREATE INDEX idx_requisitions_patient_id ON public.requisitions(patient_id);
CREATE INDEX idx_requisitions_type ON public.requisitions(requisition_type);
CREATE INDEX idx_requisitions_status ON public.requisitions(status);
CREATE INDEX idx_requisitions_order_date ON public.requisitions(order_date);
CREATE INDEX idx_requisitions_requisition_number ON public.requisitions(requisition_number);

-- Create a function to automatically generate requisition numbers
CREATE OR REPLACE FUNCTION generate_requisition_number(requisition_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR(10);
    next_number INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Set prefix based on type
    IF requisition_type = 'lab' THEN
        prefix := 'LAB';
    ELSIF requisition_type = 'radiology' THEN
        prefix := 'RAD';
    ELSE
        prefix := 'REQ';
    END IF;
    
    -- Get the next number for this type
    SELECT COALESCE(MAX(CAST(SUBSTRING(requisition_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.requisitions
    WHERE requisition_number LIKE prefix || '%';
    
    -- Format the number with leading zeros
    new_number := prefix || LPAD(next_number::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set requisition_number if not provided
CREATE OR REPLACE FUNCTION set_requisition_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
        NEW.requisition_number := generate_requisition_number(NEW.requisition_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_requisition_number
    BEFORE INSERT ON public.requisitions
    FOR EACH ROW
    EXECUTE FUNCTION set_requisition_number();

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_requisition_updated_at
    BEFORE UPDATE ON public.requisitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view requisitions" 
    ON public.requisitions 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert requisitions" 
    ON public.requisitions 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can update requisitions" 
    ON public.requisitions 
    FOR UPDATE 
    USING (true);

CREATE POLICY "Users can delete requisitions" 
    ON public.requisitions 
    FOR DELETE 
    USING (true);

-- Create a view for easier querying of lab requisitions
CREATE OR REPLACE VIEW lab_requisitions_view AS
SELECT 
    r.*,
    p.name as patient_name,
    p.primary_diagnosis,
    lt.test_name,
    lt.test_code,
    lt.test_price
FROM public.requisitions r
JOIN public.patients p ON r.patient_id = p.id
LEFT JOIN LATERAL (
    SELECT 
        unnest(r.lab_test_ids) as test_id,
        lt.test_name,
        lt.test_code,
        lt.test_price
    FROM public.lab_tests lt
    WHERE lt.id = unnest(r.lab_test_ids)
) lt ON true
WHERE r.requisition_type = 'lab';

-- Create a view for easier querying of radiology requisitions
CREATE OR REPLACE VIEW radiology_requisitions_view AS
SELECT 
    r.*,
    p.name as patient_name,
    p.primary_diagnosis,
    rp.name as procedure_name,
    rp.code as procedure_code,
    rp.price as procedure_price,
    rm.name as modality_name,
    rm.code as modality_code
FROM public.requisitions r
JOIN public.patients p ON r.patient_id = p.id
LEFT JOIN public.radiology_procedures rp ON r.radiology_procedure_id = rp.id
LEFT JOIN public.radiology_modalities rm ON r.radiology_modality_id = rm.id
WHERE r.requisition_type = 'radiology';

-- Insert some sample data for testing
INSERT INTO public.requisitions (
    patient_id,
    requisition_type,
    status,
    priority,
    clinical_indication,
    ordering_physician,
    lab_test_ids,
    sample_type,
    fasting_required
) VALUES 
(
    (SELECT id FROM public.patients LIMIT 1),
    'lab',
    'pending',
    'routine',
    'Routine blood work for pre-operative assessment',
    'Dr. Smith',
    ARRAY[]::UUID[],
    'Blood',
    true
),
(
    (SELECT id FROM public.patients LIMIT 1),
    'radiology',
    'pending',
    'routine',
    'Chest X-ray for pre-operative clearance',
    'Dr. Johnson',
    NULL,
    NULL,
    false
);

-- Grant necessary permissions
GRANT ALL ON public.requisitions TO authenticated;
GRANT ALL ON lab_requisitions_view TO authenticated;
GRANT ALL ON radiology_requisitions_view TO authenticated;
