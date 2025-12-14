-- Add discord_user_id field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

