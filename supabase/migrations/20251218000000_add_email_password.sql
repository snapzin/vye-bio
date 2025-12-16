-- Add email and password_hash fields to profiles table for email/password authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email for email/password authentication';
COMMENT ON COLUMN public.profiles.password_hash IS 'Bcrypt hashed password for email/password authentication';

