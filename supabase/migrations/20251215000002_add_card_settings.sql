-- Adicionar campos de configuração do card
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS card_opacity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS card_blur INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_direction TEXT DEFAULT 'center' CHECK (card_direction IN ('left', 'center')),
ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'default' CHECK (card_style IN ('default', 'banner'));

