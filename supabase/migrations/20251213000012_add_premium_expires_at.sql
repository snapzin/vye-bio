-- Add premium_expires_at field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.premium_expires_at IS 'Timestamp when the premium subscription expires. NULL means no expiration (permanent premium)';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires_at ON public.profiles(premium_expires_at);

