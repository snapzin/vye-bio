-- Adicionar campo para cor personalizada do ícone do link
ALTER TABLE public.user_links
ADD COLUMN IF NOT EXISTS icon_color TEXT;

