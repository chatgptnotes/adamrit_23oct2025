-- Create a SECURITY DEFINER function to look up users by email for Google OAuth login.
-- This bypasses RLS so the anon client can find users during OAuth callback.
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(lookup_email text)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  hospital_type varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role, u.hospital_type
  FROM public."User" u
  WHERE lower(u.email) = lower(lookup_email)
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO authenticated;
