-- Fix user_widgets table to work without Supabase Auth

-- Remove foreign key constraint
ALTER TABLE public.user_widgets
DROP CONSTRAINT IF EXISTS user_widgets_user_id_fkey;

-- Update RLS policies to not depend on auth.uid()
-- Drop old policies
DROP POLICY IF EXISTS "User widgets are publicly viewable" ON public.user_widgets;
DROP POLICY IF EXISTS "Users can manage own widgets" ON public.user_widgets;

-- Create new policies
-- Allow public read access for visible widgets (all widgets are viewable)
CREATE POLICY "User widgets are publicly viewable" ON public.user_widgets
  FOR SELECT USING (true);

-- Allow all operations (access control handled via JWT in application layer)
CREATE POLICY "Allow widget management" ON public.user_widgets
  FOR ALL USING (true);

