-- Create corporate management table
-- This migration creates the dedicated corporate table for the Corporate Management system

-- Create corporate table
CREATE TABLE corporate (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_corporate_name ON corporate(name);
CREATE INDEX idx_corporate_created_at ON corporate(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_corporate_updated_at
    BEFORE UPDATE ON corporate
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE corporate ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for corporate table
-- Allow all authenticated users to read corporate data
CREATE POLICY "Enable read access for all authenticated users" ON corporate
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert corporate data
CREATE POLICY "Enable insert for authenticated users" ON corporate
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update corporate data
CREATE POLICY "Enable update for authenticated users" ON corporate
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete corporate data
CREATE POLICY "Enable delete for authenticated users" ON corporate
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some initial sample data
INSERT INTO corporate (name, description) VALUES
('Reliance Industries Ltd', 'Multinational conglomerate company'),
('Tata Consultancy Services', 'IT services and consulting'),
('Infosys Limited', 'Information technology and business consulting'),
('HDFC Bank Limited', 'Private sector banking and financial services'),
('ICICI Bank Limited', 'Private sector banking and financial services'),
('Wipro Technologies', 'Information technology services'),
('Bharti Airtel Limited', 'Telecommunications company'),
('State Bank of India', 'Public sector banking'),
('LIC of India', 'Life insurance corporation'),
('Oil and Natural Gas Corporation', 'Petroleum and natural gas company');