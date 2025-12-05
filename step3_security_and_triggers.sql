-- Step 3: Setup Security and Triggers
-- Run this third in Supabase SQL Editor

-- Create trigger function for automatic balance updates
CREATE OR REPLACE FUNCTION update_patient_ledger_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current balance when voucher entries are inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.patient_ledger_id IS NOT NULL THEN
            UPDATE patient_ledgers 
            SET 
                current_balance = (
                    SELECT COALESCE(
                        opening_balance + 
                        COALESCE(SUM(debit_amount - credit_amount), 0), 
                        opening_balance
                    )
                    FROM voucher_entries 
                    WHERE patient_ledger_id = NEW.patient_ledger_id
                ),
                current_balance_type = CASE 
                    WHEN (
                        SELECT opening_balance + COALESCE(SUM(debit_amount - credit_amount), 0)
                        FROM voucher_entries 
                        WHERE patient_ledger_id = NEW.patient_ledger_id
                    ) >= 0 THEN 'DR'
                    ELSE 'CR'
                END,
                updated_at = NOW()
            WHERE id = NEW.patient_ledger_id;
        END IF;
    END IF;
    
    -- Handle DELETE operations
    IF TG_OP = 'DELETE' THEN
        IF OLD.patient_ledger_id IS NOT NULL THEN
            UPDATE patient_ledgers 
            SET 
                current_balance = (
                    SELECT COALESCE(
                        opening_balance + 
                        COALESCE(SUM(debit_amount - credit_amount), 0), 
                        opening_balance
                    )
                    FROM voucher_entries 
                    WHERE patient_ledger_id = OLD.patient_ledger_id
                ),
                current_balance_type = CASE 
                    WHEN (
                        SELECT opening_balance + COALESCE(SUM(debit_amount - credit_amount), 0)
                        FROM voucher_entries 
                        WHERE patient_ledger_id = OLD.patient_ledger_id
                    ) >= 0 THEN 'DR'
                    ELSE 'CR'
                END,
                updated_at = NOW()
            WHERE id = OLD.patient_ledger_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_patient_ledger_balance ON voucher_entries;

-- Create the trigger
CREATE TRIGGER trigger_update_patient_ledger_balance
    AFTER INSERT OR UPDATE OR DELETE ON voucher_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_ledger_balance();

-- Enable Row Level Security on all accounting tables
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE outstanding_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aging_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON chart_of_accounts;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON patient_ledgers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON voucher_types;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON vouchers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON voucher_entries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON outstanding_invoices;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payment_transactions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payment_allocations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON aging_snapshots;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_balances;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow all for authenticated users" ON chart_of_accounts 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON patient_ledgers 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON voucher_types 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON vouchers 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON voucher_entries 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON outstanding_invoices 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON payment_transactions 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON payment_allocations 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON aging_snapshots 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON daily_balances 
    FOR ALL USING (auth.role() = 'authenticated');

-- Verification and completion message
SELECT 'Step 3 completed: Security policies and triggers have been set up successfully!' as status;
SELECT 'Trigger function created for automatic patient ledger balance updates' as trigger_status;
SELECT 'RLS enabled and policies created for all accounting tables' as security_status;