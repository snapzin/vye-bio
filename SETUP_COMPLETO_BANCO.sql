-- ============================================================================
-- SETUP COMPLETO DO BANCO DE DADOS - EXECUTE ESTE SCRIPT NO SQL EDITOR
-- ============================================================================
-- Este script cria todas as tabelas e configurações necessárias
-- Execute tudo de uma vez copiando e colando no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TIPOS E TABELAS BASE
-- ============================================================================

-- Criar enums
DO $$ BEGIN
    CREATE TYPE public.badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.badge_category AS ENUM ('achievement', 'event', 'special', 'community', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela profiles (sem FK para auth.users inicialmente)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
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

-- Adicionar coluna discord_user_id se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

-- Adicionar colunas para autenticação por email/senha (usadas por /api/auth)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Campos usados pelo frontend (Valorant widgets)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS valorant_name TEXT,
ADD COLUMN IF NOT EXISTS valorant_tag TEXT,
ADD COLUMN IF NOT EXISTS valorant_puuid TEXT;

-- Index para lookup por email (se não existir)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;

-- Criar tabela user_links
CREATE TABLE IF NOT EXISTS public.user_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campo usado no frontend para cor do ícone do link
ALTER TABLE public.user_links
ADD COLUMN IF NOT EXISTS icon_color TEXT;

-- Criar tabela badges
CREATE TABLE IF NOT EXISTS public.badges (
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

-- Criar tabela user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true,
  UNIQUE(user_id, badge_id)
);

-- Campo usado no frontend para ordenação
ALTER TABLE public.user_badges
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_badges_user_sort
ON public.user_badges(user_id, sort_order);

-- Criar tabela user_videos
CREATE TABLE IF NOT EXISTS public.user_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  platform TEXT CHECK (platform IN ('youtube', 'twitch', 'tiktok', 'custom')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela notifications (usado pelo dashboard)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela user_widgets (usado pelo dashboard)
CREATE TABLE IF NOT EXISTS public.user_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('discord', 'valorant', 'roblox')),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- PARTE 2: HABILITAR RLS E CRIAR POLÍTICAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;

DROP POLICY IF EXISTS "Links are publicly viewable" ON public.user_links;
DROP POLICY IF EXISTS "Users can manage own links" ON public.user_links;
DROP POLICY IF EXISTS "Allow link management" ON public.user_links;

DROP POLICY IF EXISTS "Badges are publicly viewable" ON public.badges;

DROP POLICY IF EXISTS "User badges are publicly viewable" ON public.user_badges;
DROP POLICY IF EXISTS "Users can toggle own badge display" ON public.user_badges;
DROP POLICY IF EXISTS "Allow badge display toggle" ON public.user_badges;
DROP POLICY IF EXISTS "Allow badge management" ON public.user_badges;

DROP POLICY IF EXISTS "Videos are publicly viewable" ON public.user_videos;
DROP POLICY IF EXISTS "Users can manage own videos" ON public.user_videos;
DROP POLICY IF EXISTS "Allow video management" ON public.user_videos;

DROP POLICY IF EXISTS "Allow notification access" ON public.notifications;
DROP POLICY IF EXISTS "Allow notification inserts" ON public.notifications;
DROP POLICY IF EXISTS "Allow notification updates" ON public.notifications;
DROP POLICY IF EXISTS "Allow notification deletes" ON public.notifications;

DROP POLICY IF EXISTS "User widgets are publicly viewable" ON public.user_widgets;
DROP POLICY IF EXISTS "Allow widget management" ON public.user_widgets;

-- Criar novas políticas (sem dependência de auth.uid())
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
CREATE POLICY "Allow profile inserts" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates" ON public.profiles
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Links are publicly viewable" ON public.user_links;
CREATE POLICY "Links are publicly viewable" ON public.user_links
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Allow link management" ON public.user_links;
CREATE POLICY "Allow link management" ON public.user_links
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Badges are publicly viewable" ON public.badges;
CREATE POLICY "Badges are publicly viewable" ON public.badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User badges are publicly viewable" ON public.user_badges;
CREATE POLICY "User badges are publicly viewable" ON public.user_badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow badge management" ON public.user_badges;
CREATE POLICY "Allow badge management" ON public.user_badges
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Videos are publicly viewable" ON public.user_videos;
CREATE POLICY "Videos are publicly viewable" ON public.user_videos
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Allow video management" ON public.user_videos;
CREATE POLICY "Allow video management" ON public.user_videos
  FOR ALL USING (true);

-- Notifications: access control será feito via JWT na API (policies abertas)
CREATE POLICY "Allow notification access" ON public.notifications
  FOR SELECT USING (true);
CREATE POLICY "Allow notification inserts" ON public.notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow notification updates" ON public.notifications
  FOR UPDATE USING (true);
CREATE POLICY "Allow notification deletes" ON public.notifications
  FOR DELETE USING (true);

-- Widgets: access control via API/JWT
CREATE POLICY "User widgets are publicly viewable" ON public.user_widgets
  FOR SELECT USING (true);
CREATE POLICY "Allow widget management" ON public.user_widgets
  FOR ALL USING (true);

-- ============================================================================
-- PARTE 3: FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PARTE 4: INSERIR DADOS INICIAIS
-- ============================================================================

-- Inserir badges padrão (apenas se não existirem)
INSERT INTO public.badges (name, description, icon, rarity, category, unlock_condition) 
SELECT 
  v.name,
  v.description,
  v.icon,
  v.rarity::badge_rarity,
  v.category::badge_category,
  v.unlock_condition
FROM (VALUES
  ('Early Adopter', 'One of the first to join', '⭐', 'rare', 'special', 'sign_up_early'),
  ('Verified', 'Verified account', '✓', 'uncommon', 'special', 'manual_verify'),
  ('Pro', 'Premium member', '💎', 'epic', 'premium', 'premium_subscription'),
  ('Creator', 'Content creator', '🎬', 'common', 'achievement', 'add_video'),
  ('Networker', 'Added 5+ links', '🔗', 'common', 'achievement', 'links_count_5'),
  ('Popular', '1000+ profile views', '🔥', 'rare', 'achievement', 'views_1000'),
  ('OG', 'Original member', '👑', 'legendary', 'special', 'manual_assign'),
  ('Gamer', 'Gaming enthusiast', '🎮', 'common', 'community', 'add_gaming_clip'),
  ('Music Lover', 'Added profile music', '🎵', 'common', 'achievement', 'add_music'),
  ('Customizer', 'Customized profile background', '🎨', 'uncommon', 'achievement', 'custom_background')
) AS v(name, description, icon, rarity, category, unlock_condition)
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE badges.name = v.name);

-- ============================================================================
-- PARTE 5: STORAGE BUCKETS
-- ============================================================================

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow avatar uploads" ON storage.objects;
CREATE POLICY "Allow avatar uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Políticas de storage para backgrounds
DROP POLICY IF EXISTS "Background images are publicly accessible" ON storage.objects;
CREATE POLICY "Background images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'backgrounds');

DROP POLICY IF EXISTS "Allow background uploads" ON storage.objects;
CREATE POLICY "Allow background uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'backgrounds');

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se tudo foi criado corretamente
SELECT 
  'Tabela profiles: ' || CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT 
  'Coluna discord_user_id: ' || CASE WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'discord_user_id') THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Políticas RLS: ' || CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') >= 3 THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Badges inseridos: ' || (SELECT COUNT(*)::text FROM public.badges) || ' badges';

