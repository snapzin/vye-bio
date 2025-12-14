-- Complete migration to remove all dependencies on Supabase Auth (auth.users and auth.uid())
-- This allows the system to work with custom JWT authentication only

-- ============================================================================
-- 1. REMOVE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Remove FK from premium_transactions
ALTER TABLE public.premium_transactions
DROP CONSTRAINT IF EXISTS premium_transactions_user_id_fkey;

-- Remove FK from notifications
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Remove FK from user_widgets (if not already removed)
ALTER TABLE public.user_widgets
DROP CONSTRAINT IF EXISTS user_widgets_user_id_fkey;

-- Remove FK from user_badges (if not already removed)
ALTER TABLE public.user_badges
DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;

-- ============================================================================
-- 2. UPDATE RLS POLICIES - PREMIUM TRANSACTIONS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.premium_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.premium_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.premium_transactions;

-- Create new policies (access control handled via JWT in application layer)
-- Only create if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'premium_transactions' 
    AND policyname = 'Allow transaction access'
  ) THEN
    CREATE POLICY "Allow transaction access" ON public.premium_transactions
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'premium_transactions' 
    AND policyname = 'Allow transaction inserts'
  ) THEN
    CREATE POLICY "Allow transaction inserts" ON public.premium_transactions
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'premium_transactions' 
    AND policyname = 'Allow transaction updates'
  ) THEN
    CREATE POLICY "Allow transaction updates" ON public.premium_transactions
      FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================================================
-- 3. UPDATE RLS POLICIES - NOTIFICATIONS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Keep "System can insert notifications" as it already allows all inserts
-- Create new policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Allow notification access'
  ) THEN
    CREATE POLICY "Allow notification access" ON public.notifications
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Allow notification updates'
  ) THEN
    CREATE POLICY "Allow notification updates" ON public.notifications
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND policyname = 'Allow notification deletes'
  ) THEN
    CREATE POLICY "Allow notification deletes" ON public.notifications
      FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================================
-- 4. UPDATE RLS POLICIES - USER_BADGES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "User badges are publicly viewable" ON public.user_badges;
DROP POLICY IF EXISTS "Users can toggle own badge display" ON public.user_badges;
DROP POLICY IF EXISTS "Allow badge display toggle" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;

-- Create new policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_badges' 
    AND policyname = 'User badges are publicly viewable'
  ) THEN
    CREATE POLICY "User badges are publicly viewable" ON public.user_badges
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_badges' 
    AND policyname = 'Allow badge management'
  ) THEN
    CREATE POLICY "Allow badge management" ON public.user_badges
      FOR ALL USING (true);
  END IF;
END $$;

-- ============================================================================
-- 5. UPDATE RLS POLICIES - USER_WIDGETS (if not already done)
-- ============================================================================

-- Drop old policies (if they still exist)
DROP POLICY IF EXISTS "User widgets are publicly viewable" ON public.user_widgets;
DROP POLICY IF EXISTS "Users can manage own widgets" ON public.user_widgets;
DROP POLICY IF EXISTS "Allow widget management" ON public.user_widgets;

-- Create new policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_widgets' 
    AND policyname = 'User widgets are publicly viewable'
  ) THEN
    CREATE POLICY "User widgets are publicly viewable" ON public.user_widgets
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_widgets' 
    AND policyname = 'Allow widget management'
  ) THEN
    CREATE POLICY "Allow widget management" ON public.user_widgets
      FOR ALL USING (true);
  END IF;
END $$;

-- ============================================================================
-- 6. REMOVE/UPDATE TRIGGERS THAT DEPEND ON auth.users
-- ============================================================================

-- Drop trigger that creates welcome notification on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_notification ON auth.users;

-- Drop trigger that creates profile on auth.users insert (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- 7. UPDATE FUNCTIONS THAT USE auth.uid() AND auth.users
-- ============================================================================

-- Update notification functions to not use auth.uid() or auth.users
-- These functions will work with profiles table instead

-- Function to send notification to all users (remove auth.uid() and auth.users dependency)
CREATE OR REPLACE FUNCTION public.send_notification_to_all(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert notification for all users from profiles table
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    user_id,
    p_title,
    p_message,
    p_type,
    p_link
  FROM public.profiles;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send notification to specific users (remove auth.uid() dependency)
CREATE OR REPLACE FUNCTION public.send_notification_to_users(
  p_user_ids UUID[],
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert notification for specified users
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    unnest(p_user_ids),
    p_title,
    p_message,
    p_type,
    p_link;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send notification to specific user
CREATE OR REPLACE FUNCTION public.send_notification_to_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission (now accessible to all, but should be called from API with JWT validation)
GRANT EXECUTE ON FUNCTION public.send_notification_to_all TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification_to_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification_to_user TO anon, authenticated;

-- ============================================================================
-- 8. ENSURE ALL STORAGE POLICIES ARE UPDATED
-- ============================================================================

-- Drop any remaining storage policies that use auth.uid()
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own music" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own music" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own music" ON storage.objects;

-- Ensure public read access (these should already exist, but ensure they do)
-- Avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Avatar images are publicly accessible'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Backgrounds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Background images are publicly accessible'
  ) THEN
    CREATE POLICY "Background images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'backgrounds');
  END IF;
END $$;

-- Music
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Music files are publicly accessible'
  ) THEN
    CREATE POLICY "Music files are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'music');
  END IF;
END $$;

-- Ensure upload/update/delete policies exist (these should already be created by previous migration)
-- But we'll ensure they exist here too
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow avatar uploads'
  ) THEN
    CREATE POLICY "Allow avatar uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow background uploads'
  ) THEN
    CREATE POLICY "Allow background uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'backgrounds');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow music uploads'
  ) THEN
    CREATE POLICY "Allow music uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'music');
  END IF;
END $$;

-- ============================================================================
-- 9. FINAL CHECKS - ENSURE NO REMAINING auth.uid() DEPENDENCIES IN POLICIES
-- ============================================================================

-- Note: This migration removes all auth.uid() dependencies from RLS policies.
-- Access control is now handled entirely via JWT in the application layer.
-- All policies allow public access, but the application validates JWT tokens
-- before allowing operations.

