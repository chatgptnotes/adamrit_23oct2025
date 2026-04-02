-- =====================================================
-- MULTI-COMPANY SUPPORT MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create companies master table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_key TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_type TEXT NOT NULL,
  owner_partners TEXT,
  gst_number TEXT,
  pan_number TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed the 4 companies
INSERT INTO companies (company_key, company_name, company_type, owner_partners) VALUES
  ('ayushman_nagpur', 'Ayushman Nagpur Hospital', 'Proprietorship', 'Dr. B.K. Murali'),
  ('hope_partnership', 'Hope Hospitals', 'Partnership', 'Dr. B.K. Murali, Ruby Ammon'),
  ('drm_pvt_ltd', 'DRM Hope Hospital Private Limited', 'Private Limited', 'Directors'),
  ('hope_pharmacy', 'Hope Pharmacy', 'Separate Entity', NULL)
ON CONFLICT (company_key) DO NOTHING;

-- 3. Add company_id to vouchers
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
CREATE INDEX IF NOT EXISTS idx_vouchers_company_id ON vouchers(company_id);

-- 4. Add company_id to chart_of_accounts
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company_id ON chart_of_accounts(company_id);

-- 5. Add company_id to tally_ledgers
ALTER TABLE tally_ledgers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
CREATE INDEX IF NOT EXISTS idx_tally_ledgers_company_id ON tally_ledgers(company_id);

-- 6. Add company_id to payment_obligations
ALTER TABLE payment_obligations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 7. Add company_id to daily_payment_schedule
ALTER TABLE daily_payment_schedule ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 8. Add company_id to users table (employee linking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 9. Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to companies" ON companies FOR ALL USING (true) WITH CHECK (true);

-- 10. Verify
SELECT company_key, company_name, company_type FROM companies ORDER BY company_key;
