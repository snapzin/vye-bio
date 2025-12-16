-- Enable Realtime for notifications table
-- This allows the Supabase Realtime to broadcast changes to the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

