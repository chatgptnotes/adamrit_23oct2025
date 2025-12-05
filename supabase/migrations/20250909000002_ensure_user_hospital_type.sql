-- Ensure User table has hospital_type column
-- Migration to add hospital_type column if it doesn't exist and set constraints

-- Add hospital_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'hospital_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" ADD COLUMN hospital_type text DEFAULT 'hope';
    END IF;
END $$;

-- Add check constraint for valid hospital types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'User' 
        AND constraint_name = 'user_hospital_type_check'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_hospital_type_check 
        CHECK (hospital_type IN ('hope', 'ayushman'));
    END IF;
END $$;

-- Ensure email is unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'User' 
        AND constraint_name = 'user_email_unique'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_email_unique UNIQUE (email);
    END IF;
END $$;

-- Add check constraint for valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'User' 
        AND constraint_name = 'user_role_check'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "User" 
        ADD CONSTRAINT user_role_check 
        CHECK (role IN ('admin', 'doctor', 'nurse', 'user'));
    END IF;
END $$;

-- Update existing users without hospital_type to have 'hope' as default
UPDATE "User" 
SET hospital_type = 'hope' 
WHERE hospital_type IS NULL;

-- Make hospital_type NOT NULL after setting defaults
ALTER TABLE "User" ALTER COLUMN hospital_type SET NOT NULL;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" (email);

-- Add index on hospital_type for filtering
CREATE INDEX IF NOT EXISTS idx_user_hospital_type ON "User" (hospital_type);

-- Add composite index for hospital_type and role
CREATE INDEX IF NOT EXISTS idx_user_hospital_role ON "User" (hospital_type, role);

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND table_schema = 'public'
ORDER BY ordinal_position;