-- =============================================
-- Pharmacy Credit Payments Table
-- Tracks payments received for credit sales
-- =============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.pharmacy_credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to original sale
    sale_id BIGINT REFERENCES public.pharmacy_sales(sale_id),

    -- Patient information
    patient_id TEXT,                    -- String patient ID like "UHHO25J22001"
    patient_uuid UUID,                  -- Internal UUID from patients.id
    patient_name TEXT,

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,       -- CASH, CARD, UPI
    payment_reference TEXT,             -- Transaction ID, cheque number, etc.
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Additional info
    received_by TEXT,
    remarks TEXT,
    hospital_name TEXT NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_payments_patient ON public.pharmacy_credit_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_patient_uuid ON public.pharmacy_credit_payments(patient_uuid);
CREATE INDEX IF NOT EXISTS idx_credit_payments_sale ON public.pharmacy_credit_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_hospital ON public.pharmacy_credit_payments(hospital_name);
CREATE INDEX IF NOT EXISTS idx_credit_payments_date ON public.pharmacy_credit_payments(payment_date);

-- 3. Enable Row Level Security
ALTER TABLE public.pharmacy_credit_payments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Allow all for authenticated users" ON public.pharmacy_credit_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Grant permissions
GRANT ALL ON public.pharmacy_credit_payments TO authenticated;

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_credit_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_payments_timestamp
    BEFORE UPDATE ON public.pharmacy_credit_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_credit_payments_updated_at();

-- 7. Verification
SELECT 'pharmacy_credit_payments table created successfully!' as status;
