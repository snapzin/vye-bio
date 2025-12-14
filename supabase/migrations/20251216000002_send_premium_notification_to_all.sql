-- Script para enviar notificação de Premium para todos os usuários que têm VIP mas não receberam a notificação
-- Execute este script no SQL Editor do Supabase

-- Criar notificação para todos os usuários premium que não têm a notificação de ativação
INSERT INTO public.notifications (user_id, title, message, type, link)
SELECT 
  p.user_id,
  'Premium Ativado! 🎉',
  'Seu Premium foi ativado com sucesso! Agora você tem acesso a todos os recursos exclusivos por 30 dias.',
  'success',
  NULL
FROM public.profiles p
WHERE p.is_premium = true
  -- Verificar se o usuário não tem essa notificação específica
  AND NOT EXISTS (
    SELECT 1 
    FROM public.notifications n 
    WHERE n.user_id = p.user_id 
      AND n.title = 'Premium Ativado! 🎉'
      AND n.type = 'success'
  )
  -- Garantir que o usuário existe
  AND EXISTS (
    SELECT 1 
    FROM auth.users u 
    WHERE u.id = p.user_id
  );

-- Retornar o número de notificações criadas
SELECT COUNT(*) as notifications_created
FROM public.profiles p
WHERE p.is_premium = true
  AND NOT EXISTS (
    SELECT 1 
    FROM public.notifications n 
    WHERE n.user_id = p.user_id 
      AND n.title = 'Premium Ativado! 🎉'
      AND n.type = 'success'
  );

