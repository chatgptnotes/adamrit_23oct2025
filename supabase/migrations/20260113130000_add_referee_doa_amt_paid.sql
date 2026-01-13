-- Add referee_doa_amt_paid column to visits table for OPD/IPD
ALTER TABLE visits ADD COLUMN IF NOT EXISTS referee_doa_amt_paid DECIMAL(10,2) DEFAULT NULL;
