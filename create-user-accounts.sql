-- SQL Script to Create User Accounts
-- Run this in Supabase SQL Editor

-- Note: Passwords need to be hashed with bcrypt before insertion
-- Hope@2025 and Ayushman@2025 will be hashed using the signup function

-- Option 1: Use the signup function (recommended)
-- You can run this via the application's signup page or API

-- Option 2: Direct INSERT with pre-hashed passwords
-- For now, I'll create a migration script that can be run

-- Insert Hope Hospital User
INSERT INTO public."User" (email, password, role, hospital_type)
VALUES (
  'user@hopehospital.com',
  '$2b$12$PASSWORD_HASH_HERE', -- Replace with bcrypt hash of 'Hope@2025'
  'user',
  'hope'
)
ON CONFLICT (email) DO NOTHING;

-- Insert Ayushman Hospital User
INSERT INTO public."User" (email, password, role, hospital_type)
VALUES (
  'user@ayushmanhospital.com',
  '$2b$12$PASSWORD_HASH_HERE', -- Replace with bcrypt hash of 'Ayushman@2025'
  'user',
  'ayushman'
)
ON CONFLICT (email) DO NOTHING;
