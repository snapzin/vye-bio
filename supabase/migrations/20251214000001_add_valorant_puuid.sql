-- Add valorant_puuid field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS valorant_puuid TEXT;

