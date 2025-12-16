-- Add premium fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_footer BOOLEAN DEFAULT false;

-- Add comment to explain the fields
COMMENT ON COLUMN public.profiles.is_premium IS 'Indicates if the user has premium subscription';
COMMENT ON COLUMN public.profiles.hide_footer IS 'If true, hides the vye.bio footer on the profile page (premium feature)';

