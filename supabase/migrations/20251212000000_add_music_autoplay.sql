-- Add music_autoplay field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS music_autoplay BOOLEAN DEFAULT true;

-- Add music_image_url field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS music_image_url TEXT;

-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for music
CREATE POLICY "Music files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'music');

CREATE POLICY "Users can upload own music" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own music" ON storage.objects
  FOR UPDATE USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own music" ON storage.objects
  FOR DELETE USING (bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]);

