-- Create badge_rarity enum
CREATE TYPE public.badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Create badge_category enum
CREATE TYPE public.badge_category AS ENUM ('achievement', 'event', 'special', 'community', 'premium');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  background_url TEXT,
  background_type TEXT DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image', 'video')),
  background_color TEXT DEFAULT '#0a0a0b',
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  music_title TEXT,
  music_artist TEXT,
  music_url TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_links table
CREATE TABLE public.user_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table (master list of all badges)
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL,
  rarity badge_rarity NOT NULL DEFAULT 'common',
  category badge_category NOT NULL DEFAULT 'achievement',
  unlock_condition TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table (badges earned by users)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true,
  UNIQUE(user_id, badge_id)
);

-- Create user_videos table (for clips/videos)
CREATE TABLE public.user_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  platform TEXT CHECK (platform IN ('youtube', 'twitch', 'tiktok', 'custom')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User links policies
CREATE POLICY "Links are publicly viewable" ON public.user_links
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own links" ON public.user_links
  FOR ALL USING (auth.uid() = user_id);

-- Badges policies (all badges are public)
CREATE POLICY "Badges are publicly viewable" ON public.badges
  FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "User badges are publicly viewable" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can toggle own badge display" ON public.user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- User videos policies
CREATE POLICY "Videos are publicly viewable" ON public.user_videos
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own videos" ON public.user_videos
  FOR ALL USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', LOWER(REPLACE(NEW.id::text, '-', ''))),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, rarity, category, unlock_condition) VALUES
  ('Early Adopter', 'One of the first to join', '⭐', 'rare', 'special', 'sign_up_early'),
  ('Verified', 'Verified account', '✓', 'uncommon', 'special', 'manual_verify'),
  ('Pro', 'Premium member', '💎', 'epic', 'premium', 'premium_subscription'),
  ('Creator', 'Content creator', '🎬', 'common', 'achievement', 'add_video'),
  ('Networker', 'Added 5+ links', '🔗', 'common', 'achievement', 'links_count_5'),
  ('Popular', '1000+ profile views', '🔥', 'rare', 'achievement', 'views_1000'),
  ('OG', 'Original member', '👑', 'legendary', 'special', 'manual_assign'),
  ('Gamer', 'Gaming enthusiast', '🎮', 'common', 'community', 'add_gaming_clip'),
  ('Music Lover', 'Added profile music', '🎵', 'common', 'achievement', 'add_music'),
  ('Customizer', 'Customized profile background', '🎨', 'uncommon', 'achievement', 'custom_background');

-- Create storage bucket for avatars and backgrounds
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for backgrounds
CREATE POLICY "Background images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'backgrounds');

CREATE POLICY "Users can upload own background" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own background" ON storage.objects
  FOR UPDATE USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own background" ON storage.objects
  FOR DELETE USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);