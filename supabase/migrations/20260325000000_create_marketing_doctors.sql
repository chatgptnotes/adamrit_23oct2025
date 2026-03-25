-- Marketing Doctors Table
-- Stores doctor directory for marketing team with photo uploads

CREATE TABLE IF NOT EXISTS marketing_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    hospital_clinic_name VARCHAR(255),
    city VARCHAR(100),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'VIP')),
    visit_frequency INTEGER DEFAULT 30,
    image_url TEXT,
    location_address TEXT,
    notes TEXT,
    created_by UUID REFERENCES marketing_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_doctors_name ON marketing_doctors(doctor_name);
CREATE INDEX IF NOT EXISTS idx_marketing_doctors_active ON marketing_doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_doctors_created_by ON marketing_doctors(created_by);

-- Enable RLS
ALTER TABLE marketing_doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users to view marketing_doctors"
    ON marketing_doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert marketing_doctors"
    ON marketing_doctors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update marketing_doctors"
    ON marketing_doctors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete marketing_doctors"
    ON marketing_doctors FOR DELETE TO authenticated USING (true);

-- RLS Policies for anonymous access (development)
CREATE POLICY "Allow anonymous users to view marketing_doctors"
    ON marketing_doctors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous users to insert marketing_doctors"
    ON marketing_doctors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous users to update marketing_doctors"
    ON marketing_doctors FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous users to delete marketing_doctors"
    ON marketing_doctors FOR DELETE TO anon USING (true);
