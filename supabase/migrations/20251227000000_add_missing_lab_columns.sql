-- Add missing columns to lab table for panel management
-- These columns are required by the LabPanelManager component

ALTER TABLE public.lab
ADD COLUMN IF NOT EXISTS "Non-NABH_rates_in_rupee" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "NABH_rates_in_rupee" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "private" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "attributes" JSONB DEFAULT '[]'::jsonb;
