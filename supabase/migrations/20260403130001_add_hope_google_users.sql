-- Add Hope Hospital staff users who login via Google OAuth
-- These users authenticate via Google and are looked up in the User table by email

INSERT INTO public."User" (email, password, role, hospital_type)
VALUES
  ('iam.nishasharma10@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('azherkhanp@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('rizzara1807@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('jambhulkarruhika1@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('bisen.digesh@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('baghelshilpi03@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('dikshasakhare722@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('shendepankaj96@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('guruvyankat@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('007aryan.upgade@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('sanjanatetwari10@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('kamalnagrare@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('meshramanjali862@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('sejalgedam565@gmail.com', 'google_oauth_only', 'user', 'hope'),
  ('ravinabalvir7@gmail.com', 'google_oauth_only', 'user', 'hope')
ON CONFLICT (email) DO UPDATE SET hospital_type = 'hope', role = 'user';
