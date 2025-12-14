-- Add music_player_style field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS music_player_style TEXT DEFAULT 'card' CHECK (music_player_style IN ('card', 'floating'));

