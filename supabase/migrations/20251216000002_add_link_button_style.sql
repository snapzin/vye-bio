-- Adicionar campo para estilo de botões de links (quando link_style = 'buttons')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS link_button_style TEXT DEFAULT 'with_text' CHECK (link_button_style IN ('icon_only', 'with_text'));

