-- Corporate Bulk Payment Receipt System
-- Stores header-level corporate payments and per-patient allocations

-- 1. Header table: one row per corporate bulk payment receipt
CREATE TABLE corporate_bulk_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50),
    corporate_id UUID REFERENCES corporate(id),
    corporate_name TEXT NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN (
        'CASH', 'CARD', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'RTGS', 'ONLINE'
    )),
    reference_number VARCHAR(100),
    bank_name VARCHAR(255),
    total_amount DECIMAL(15,2) NOT NULL,
    narration TEXT,
    hospital_name VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Allocation table: per-patient breakdown within a bulk payment
CREATE TABLE corporate_bulk_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_payment_id UUID NOT NULL REFERENCES corporate_bulk_payments(id) ON DELETE CASCADE,
    patient_id UUID,
    patient_name TEXT NOT NULL,
    patients_id TEXT,
    visit_id TEXT,
    amount DECIMAL(15,2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for common queries
CREATE INDEX idx_cbp_corporate_id ON corporate_bulk_payments(corporate_id);
CREATE INDEX idx_cbp_payment_date ON corporate_bulk_payments(payment_date);
CREATE INDEX idx_cbp_hospital_name ON corporate_bulk_payments(hospital_name);
CREATE INDEX idx_cbpa_bulk_payment_id ON corporate_bulk_payment_allocations(bulk_payment_id);
CREATE INDEX idx_cbpa_patient_id ON corporate_bulk_payment_allocations(patient_id);

-- 4. RLS policies (permissive, matching existing pattern)
ALTER TABLE corporate_bulk_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_bulk_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on corporate_bulk_payments"
    ON corporate_bulk_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on corporate_bulk_payment_allocations"
    ON corporate_bulk_payment_allocations FOR ALL USING (true) WITH CHECK (true);

-- 5. Auto-generate receipt number via sequence
CREATE SEQUENCE IF NOT EXISTS corporate_receipt_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_corporate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'CBR-' || LPAD(nextval('corporate_receipt_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_corporate_receipt_number
    BEFORE INSERT ON corporate_bulk_payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_corporate_receipt_number();
