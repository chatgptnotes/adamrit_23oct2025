-- Create enum type for date status
CREATE TYPE date_status AS ENUM ('0', '1');

-- Add 5 date columns to patient_data table
ALTER TABLE patient_data 
ADD COLUMN date_column_1 date_status DEFAULT '0',
ADD COLUMN date_column_2 date_status DEFAULT '0',
ADD COLUMN date_column_3 date_status DEFAULT '0',
ADD COLUMN date_column_4 date_status DEFAULT '0',
ADD COLUMN date_column_5 date_status DEFAULT '0';