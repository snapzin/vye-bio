-- Add avatar_shape field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_shape TEXT DEFAULT 'rounded' CHECK (avatar_shape IN ('square', 'rounded', 'circle'));

