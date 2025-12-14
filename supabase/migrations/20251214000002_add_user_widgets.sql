-- Create user_widgets table
CREATE TABLE IF NOT EXISTS public.user_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('discord', 'valorant', 'roblox')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, widget_type)
);

-- Enable RLS
ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists to make migration idempotent)
DROP POLICY IF EXISTS "User widgets are publicly viewable" ON public.user_widgets;
CREATE POLICY "User widgets are publicly viewable" ON public.user_widgets
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own widgets" ON public.user_widgets;
CREATE POLICY "Users can manage own widgets" ON public.user_widgets
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_widgets_user_id ON public.user_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widgets_sort_order ON public.user_widgets(user_id, sort_order);

