-- Fix file_uploads.uploaded_by: drop the FK constraint and make it nullable
-- The app uses a custom "User" table, not Supabase auth.users,
-- so the FK to auth.users never matches.

-- Drop the foreign key constraint
ALTER TABLE file_uploads DROP CONSTRAINT IF EXISTS file_uploads_uploaded_by_fkey;

-- Make the column nullable (in case it's NOT NULL)
ALTER TABLE file_uploads ALTER COLUMN uploaded_by DROP NOT NULL;
