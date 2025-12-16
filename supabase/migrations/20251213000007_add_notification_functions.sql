-- Function to send notification to all users (admin only)
CREATE OR REPLACE FUNCTION public.send_notification_to_all(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_admin_id UUID;
BEGIN
  -- Get current user ID
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = v_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can send notifications to all users';
  END IF;

  -- Insert notification for all users
  -- SECURITY DEFINER allows us to bypass RLS, but we still need proper policies
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    u.id,
    p_title,
    p_message,
    p_type,
    p_link
  FROM auth.users u;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send notification to specific users
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
  v_admin_id UUID;
BEGIN
  -- Get current user ID
  v_admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = v_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can send notifications';
  END IF;

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

-- Grant execute permission to authenticated users (RLS will check admin status)
GRANT EXECUTE ON FUNCTION public.send_notification_to_all TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification_to_users TO authenticated;

