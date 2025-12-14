-- Remove foreign key constraint from profiles.user_id to auth.users
-- This allows us to use Supabase only as a database without Supabase Auth

-- First, drop the foreign key constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- The user_id column should remain as UUID NOT NULL UNIQUE, but without the FK constraint
-- This allows us to use custom UUIDs without needing entries in auth.users

-- Also update the RLS policies to not rely on auth.uid()
-- We'll need to handle authentication via JWT in the application layer

-- Update the insert policy to allow inserts without auth.uid() check
-- (We'll handle auth via JWT in the API layer)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Allow profile inserts" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Update the update policy to allow updates (we'll verify via JWT in API)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Allow profile updates" ON public.profiles
  FOR UPDATE USING (true);

-- Also update user_links to remove FK constraint
ALTER TABLE public.user_links
DROP CONSTRAINT IF EXISTS user_links_user_id_fkey;

-- Update user_links policies
DROP POLICY IF EXISTS "Users can manage own links" ON public.user_links;
CREATE POLICY "Allow link management" ON public.user_links
  FOR ALL USING (true);

-- Update user_badges to remove FK constraint
ALTER TABLE public.user_badges
DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;

-- Update user_badges policies
DROP POLICY IF EXISTS "Users can toggle own badge display" ON public.user_badges;
CREATE POLICY "Allow badge display toggle" ON public.user_badges
  FOR UPDATE USING (true);

-- Update user_videos to remove FK constraint
ALTER TABLE public.user_videos
DROP CONSTRAINT IF EXISTS user_videos_user_id_fkey;

-- Update user_videos policies
DROP POLICY IF EXISTS "Users can manage own videos" ON public.user_videos;
CREATE POLICY "Allow video management" ON public.user_videos
  FOR ALL USING (true);

