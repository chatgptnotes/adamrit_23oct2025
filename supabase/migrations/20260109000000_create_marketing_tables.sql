-- Marketing Visits Dashboard Database Schema
-- Migration for marketing staff tracking and performance monitoring

-- 1. Marketing Users/Staff Table
CREATE TABLE IF NOT EXISTS marketing_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    designation VARCHAR(100) DEFAULT 'Marketing Executive',
    department VARCHAR(100) DEFAULT 'Marketing',
    employee_id VARCHAR(50),
    joining_date DATE,
    is_active BOOLEAN DEFAULT true,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Doctor Visits Table
-- Target: 100 visits per month per marketing person
CREATE TABLE IF NOT EXISTS doctor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketing_user_id UUID REFERENCES marketing_users(id) ON DELETE CASCADE NOT NULL,

    -- Doctor Information
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    hospital_clinic_name VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,

    -- Visit Information
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME,
    visit_notes TEXT,
    outcome VARCHAR(50) CHECK (outcome IN ('Positive', 'Neutral', 'Negative', 'Follow-up Required', 'Not Available')),

    -- Follow-up
    follow_up_date DATE,
    follow_up_notes TEXT,

    -- Location tracking (optional)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Marketing Camps Table
-- Target: 4 camps per month per marketing person
CREATE TABLE IF NOT EXISTS marketing_camps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketing_user_id UUID REFERENCES marketing_users(id) ON DELETE CASCADE NOT NULL,

    -- Camp Information
    camp_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    camp_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,

    -- Camp Details
    camp_type VARCHAR(100), -- Health Camp, Eye Camp, Dental Camp, etc.
    expected_footfall INTEGER,
    actual_footfall INTEGER,

    -- Outcomes
    patients_screened INTEGER DEFAULT 0,
    referrals_generated INTEGER DEFAULT 0,
    camp_notes TEXT,

    -- Status
    status VARCHAR(30) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Postponed')),

    -- Location tracking
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_visits_marketing_user_id ON doctor_visits(marketing_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_visit_date ON doctor_visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_marketing_camps_marketing_user_id ON marketing_camps(marketing_user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_camps_camp_date ON marketing_camps(camp_date);

CREATE INDEX IF NOT EXISTS idx_marketing_users_active ON marketing_users(is_active);

-- Enable Row Level Security
ALTER TABLE marketing_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_camps ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users to view marketing_users"
    ON marketing_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert marketing_users"
    ON marketing_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update marketing_users"
    ON marketing_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete marketing_users"
    ON marketing_users FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view doctor_visits"
    ON doctor_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert doctor_visits"
    ON doctor_visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update doctor_visits"
    ON doctor_visits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete doctor_visits"
    ON doctor_visits FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view marketing_camps"
    ON marketing_camps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert marketing_camps"
    ON marketing_camps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update marketing_camps"
    ON marketing_camps FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete marketing_camps"
    ON marketing_camps FOR DELETE TO authenticated USING (true);

-- Allow anonymous access for development (same pattern as existing tables)
CREATE POLICY "Allow anonymous users to view marketing_users"
    ON marketing_users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous users to insert marketing_users"
    ON marketing_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous users to update marketing_users"
    ON marketing_users FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous users to delete marketing_users"
    ON marketing_users FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anonymous users to view doctor_visits"
    ON doctor_visits FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous users to insert doctor_visits"
    ON doctor_visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous users to update doctor_visits"
    ON doctor_visits FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous users to delete doctor_visits"
    ON doctor_visits FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anonymous users to view marketing_camps"
    ON marketing_camps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous users to insert marketing_camps"
    ON marketing_camps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous users to update marketing_camps"
    ON marketing_camps FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous users to delete marketing_camps"
    ON marketing_camps FOR DELETE TO anon USING (true);
