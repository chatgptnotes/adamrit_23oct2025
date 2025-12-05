-- Create document_types table
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create patient_documents table
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(50) REFERENCES visits(custom_id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(custom_id) ON DELETE CASCADE,
    document_type_id INTEGER REFERENCES document_types(id),
    document_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_url TEXT,
    file_size BIGINT,
    file_type TEXT,
    storage_bucket TEXT DEFAULT 'patient-documents',
    is_uploaded BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    uploaded_by TEXT,
    remarks TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_patient_documents_visit_id ON patient_documents(visit_id);
CREATE INDEX idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type_id);
CREATE INDEX idx_patient_documents_uploaded ON patient_documents(is_uploaded);

-- Enable Row Level Security (RLS)
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_types
CREATE POLICY "Allow read access to document_types" 
ON document_types FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to manage document_types" 
ON document_types FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for patient_documents
CREATE POLICY "Allow authenticated users to view patient_documents" 
ON patient_documents FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert patient_documents" 
ON patient_documents FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update patient_documents" 
ON patient_documents FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete patient_documents" 
ON patient_documents FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE
    ON document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_documents_updated_at BEFORE UPDATE
    ON patient_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default document types
INSERT INTO document_types (name, description, is_mandatory) VALUES
('Referral Letter', 'Referral Letter from ESIC Online Copy', true),
('ESIC e-Pehchaan Card', 'ESIC e-Pehchaan Card / e-Pendent Card', true),
('Identity Document', 'Aadhar Card or Other Identity Document', true),
('Medical Reports', 'Previous Medical Reports / Test Results', false),
('Insurance Documents', 'Insurance Related Documents', false),
('Prescription', 'Doctor Prescription', false),
('Discharge Summary', 'Previous Discharge Summary', false),
('X-Ray/Scan Reports', 'X-Ray, CT Scan, MRI Reports', false),
('Lab Reports', 'Laboratory Test Reports', false),
('Other Documents', 'Any Other Relevant Documents', false);

-- Create a storage bucket for patient documents (run this in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);