-- Add general_rate and spinal_rate fields to anaesthetist tables
-- This migration adds anaesthesia-specific rate fields and removes complex rate structure

-- ========================================
-- UPDATE HOPE ANAESTHETISTS TABLE
-- ========================================

-- Add new rate columns to hope_anaesthetists
ALTER TABLE public.hope_anaesthetists
ADD COLUMN general_rate DECIMAL(10,2),
ADD COLUMN spinal_rate DECIMAL(10,2);

-- Add comments for the new columns
COMMENT ON COLUMN public.hope_anaesthetists.general_rate IS 'General anaesthesia rate';
COMMENT ON COLUMN public.hope_anaesthetists.spinal_rate IS 'Spinal anaesthesia rate';

-- ========================================
-- UPDATE AYUSHMAN ANAESTHETISTS TABLE
-- ========================================

-- Add new rate columns to ayushman_anaesthetists
ALTER TABLE public.ayushman_anaesthetists
ADD COLUMN general_rate DECIMAL(10,2),
ADD COLUMN spinal_rate DECIMAL(10,2);

-- Add comments for the new columns
COMMENT ON COLUMN public.ayushman_anaesthetists.general_rate IS 'General anaesthesia rate';
COMMENT ON COLUMN public.ayushman_anaesthetists.spinal_rate IS 'Spinal anaesthesia rate';

-- ========================================
-- UPDATE SAMPLE DATA WITH NEW RATES
-- ========================================

-- Update Hope anaesthetists with sample rates
UPDATE public.hope_anaesthetists SET
  general_rate = CASE
    WHEN name = 'Dr. Anderson' THEN 8000.00
    WHEN name = 'Dr. Brown' THEN 9000.00
    WHEN name = 'Dr. Johnson' THEN 7500.00
    WHEN name = 'Dr. Williams' THEN 8500.00
    WHEN name = 'Dr. Miller' THEN 8000.00
    WHEN name = 'Dr. Taylor' THEN 9500.00
    WHEN name = 'Dr. Wilson' THEN 8800.00
    WHEN name = 'Dr. Moore' THEN 8200.00
    ELSE 8000.00
  END,
  spinal_rate = CASE
    WHEN name = 'Dr. Anderson' THEN 6000.00
    WHEN name = 'Dr. Brown' THEN 7000.00
    WHEN name = 'Dr. Johnson' THEN 5500.00
    WHEN name = 'Dr. Williams' THEN 6500.00
    WHEN name = 'Dr. Miller' THEN 6000.00
    WHEN name = 'Dr. Taylor' THEN 7500.00
    WHEN name = 'Dr. Wilson' THEN 6800.00
    WHEN name = 'Dr. Moore' THEN 6200.00
    ELSE 6000.00
  END;

-- Update Ayushman anaesthetists with sample rates
UPDATE public.ayushman_anaesthetists SET
  general_rate = CASE
    WHEN name = 'Dr. Garcia' THEN 7500.00
    WHEN name = 'Dr. Martinez' THEN 8500.00
    WHEN name = 'Dr. Lopez' THEN 7000.00
    WHEN name = 'Dr. Gonzalez' THEN 8000.00
    WHEN name = 'Dr. Rodriguez' THEN 7800.00
    WHEN name = 'Dr. Hernandez' THEN 7500.00
    WHEN name = 'Dr. Perez' THEN 9000.00
    WHEN name = 'Dr. Sanchez' THEN 8200.00
    ELSE 7500.00
  END,
  spinal_rate = CASE
    WHEN name = 'Dr. Garcia' THEN 5500.00
    WHEN name = 'Dr. Martinez' THEN 6500.00
    WHEN name = 'Dr. Lopez' THEN 5000.00
    WHEN name = 'Dr. Gonzalez' THEN 6000.00
    WHEN name = 'Dr. Rodriguez' THEN 5800.00
    WHEN name = 'Dr. Hernandez' THEN 5500.00
    WHEN name = 'Dr. Perez' THEN 7000.00
    WHEN name = 'Dr. Sanchez' THEN 6200.00
    ELSE 5500.00
  END;

-- ========================================
-- VERIFICATION AND SUMMARY
-- ========================================

-- Verify the changes
DO $$
DECLARE
    hope_count INTEGER;
    ayushman_count INTEGER;
    hope_with_rates INTEGER;
    ayushman_with_rates INTEGER;
BEGIN
    SELECT COUNT(*) INTO hope_count FROM public.hope_anaesthetists;
    SELECT COUNT(*) INTO ayushman_count FROM public.ayushman_anaesthetists;

    SELECT COUNT(*) INTO hope_with_rates
    FROM public.hope_anaesthetists
    WHERE general_rate IS NOT NULL AND spinal_rate IS NOT NULL;

    SELECT COUNT(*) INTO ayushman_with_rates
    FROM public.ayushman_anaesthetists
    WHERE general_rate IS NOT NULL AND spinal_rate IS NOT NULL;

    RAISE NOTICE '=== ANAESTHETIST RATE FIELDS ADDED ===';
    RAISE NOTICE 'Hope anaesthetists: % total, % with rates', hope_count, hope_with_rates;
    RAISE NOTICE 'Ayushman anaesthetists: % total, % with rates', ayushman_count, ayushman_with_rates;
    RAISE NOTICE 'Added general_rate and spinal_rate columns to both tables';
END $$;