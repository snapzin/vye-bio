-- Adicionar novas badges: Staff, Developer, Caçador de Bugs
INSERT INTO public.badges (name, description, icon, rarity, category, unlock_condition) VALUES
  ('Staff', 'Membro da equipe', 'Staff', 'epic', 'special', 'manual_assign'),
  ('Developer', 'Desenvolvedor da plataforma', 'Developer', 'legendary', 'special', 'manual_assign'),
  ('Caçador de Bugs', 'Encontrou e reportou bugs importantes', 'Caçador de Bugs', 'rare', 'achievement', 'manual_assign')
ON CONFLICT (name) DO NOTHING;

