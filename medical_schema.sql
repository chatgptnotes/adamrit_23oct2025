-- Medical Database Schema
-- Created: 2024-03-21


-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Diagnosis Table
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Complications Table
CREATE TABLE complications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    diagnosis_id UUID REFERENCES diagnoses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lab Investigations Table
CREATE TABLE lab_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    complication_id UUID REFERENCES complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Radiology Investigations Table
CREATE TABLE radiology_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    complication_id UUID REFERENCES complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    complication_id UUID REFERENCES complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some sample data

-- Insert a sample diagnosis
INSERT INTO diagnoses (name) VALUES ('Diagnosis 1966');

-- Insert complications for the diagnosis
WITH diagnosis_id AS (
    SELECT id FROM diagnoses WHERE name = 'Diagnosis 1966' LIMIT 1
)
INSERT INTO complications (name, diagnosis_id) 
VALUES 
    ('Abscess', (SELECT id FROM diagnosis_id)),
    ('Infection', (SELECT id FROM diagnosis_id)),
    ('Delayed Healing', (SELECT id FROM diagnosis_id)),
    ('Nerve Injury', (SELECT id FROM diagnosis_id));

-- Insert lab investigations for each complication
WITH complication_id AS (
    SELECT id FROM complications WHERE name = 'Abscess' LIMIT 1
)
INSERT INTO lab_investigations (name, complication_id)
VALUES 
    ('Blood Culture', (SELECT id FROM complication_id)),
    ('Wound Swab', (SELECT id FROM complication_id));

-- Insert radiology investigations for abscess
WITH complication_id AS (
    SELECT id FROM complications WHERE name = 'Abscess' LIMIT 1
)
INSERT INTO radiology_investigations (name, complication_id)
VALUES 
    ('X-Ray', (SELECT id FROM complication_id)),
    ('MRI', (SELECT id FROM complication_id));

-- Insert medications for abscess
WITH complication_id AS (
    SELECT id FROM complications WHERE name = 'Abscess' LIMIT 1
)
INSERT INTO medications (name, complication_id)
VALUES 
    ('Antibiotics', (SELECT id FROM complication_id)),
    ('Pain Relief', (SELECT id FROM complication_id)),
    ('Steroids', (SELECT id FROM complication_id)),
    ('Wound Ointment', (SELECT id FROM complication_id)); 