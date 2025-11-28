-- Add base tables for medical data

-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create radiology table
CREATE TABLE IF NOT EXISTS radiology (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Create policies for labs
CREATE POLICY "Users can view labs"
  ON labs FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for radiology
CREATE POLICY "Users can view radiology"
  ON radiology FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for medications
CREATE POLICY "Users can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_labs_name ON labs(name);
CREATE INDEX IF NOT EXISTS idx_radiology_name ON radiology(name);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name); 