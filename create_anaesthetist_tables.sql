-- Create Anaesthetist Tables for Hope and Ayushman Hospitals
-- Simple 4-column structure: name, specialty, general_rate, spinal_rate

-- ========================================
-- CREATE HOPE ANAESTHETISTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.hope_anaesthetists (
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    general_rate DECIMAL(10,2),
    spinal_rate DECIMAL(10,2),
    contact_info VARCHAR(255)
);

-- ========================================
-- CREATE AYUSHMAN ANAESTHETISTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.ayushman_anaesthetists (
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    general_rate DECIMAL(10,2),
    spinal_rate DECIMAL(10,2),
    contact_info VARCHAR(255)
);

-- ========================================
-- INSERT SAMPLE DATA
-- ========================================

-- Insert sample data for Hope anaesthetists
INSERT INTO public.hope_anaesthetists (name, specialty, general_rate, spinal_rate, contact_info) VALUES
('Dr. Sarah Anderson', 'Cardiac Anaesthesia', 8000.00, 6000.00, '9876543210'),
('Dr. Michael Brown', 'Pediatric Anaesthesia', 9000.00, 7000.00, '9876543211'),
('Dr. Emily Johnson', 'Neuroanesthesia', 7500.00, 5500.00, '9876543212'),
('Dr. David Williams', 'Obstetric Anaesthesia', 8500.00, 6500.00, '9876543213');

-- Insert sample data for Ayushman anaesthetists
INSERT INTO public.ayushman_anaesthetists (name, specialty, general_rate, spinal_rate, contact_info) VALUES
('Dr. Maria Garcia', 'Cardiac Anaesthesia', 7500.00, 5500.00, '9876543220'),
('Dr. Carlos Martinez', 'Pediatric Anaesthesia', 8500.00, 6500.00, '9876543221'),
('Dr. Ana Lopez', 'Neuroanesthesia', 7000.00, 5000.00, '9876543222'),
('Dr. Luis Gonzalez', 'Obstetric Anaesthesia', 8000.00, 6000.00, '9876543223');