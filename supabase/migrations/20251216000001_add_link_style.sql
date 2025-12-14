-- Adicionar campo para estilo de links
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS link_style TEXT DEFAULT 'cards' CHECK (link_style IN ('cards', 'buttons'));

