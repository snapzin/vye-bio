-- Add valorant_name and valorant_tag fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS valorant_name TEXT,
ADD COLUMN IF NOT EXISTS valorant_tag TEXT;

