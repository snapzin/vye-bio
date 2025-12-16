-- ============================================================================
-- EXECUTAR TODAS AS MIGRATIONS DO SUPABASE
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================================

-- Migration 1: Tabela Base (OBRIGATÓRIA)
-- Arquivo: 20251211235811_3f6cad84-23dc-4517-94f0-2854842c07fd.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 2: Music Autoplay
-- Arquivo: 20251212000000_add_music_autoplay.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 3: Banner URL
-- Arquivo: 20251213000000_add_banner_url.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 4: Avatar Shape
-- Arquivo: 20251213000001_add_avatar_shape.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 5: Music Player Style
-- Arquivo: 20251213000002_add_music_player_style.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 6: Discord User ID (OBRIGATÓRIA para login Discord)
-- Arquivo: 20251213000003_add_discord_user_id.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 7: Is Admin
-- Arquivo: 20251213000004_add_is_admin.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 8: Sort Order User Badges
-- Arquivo: 20251213000005_add_sort_order_to_user_badges.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 9: Notifications
-- Arquivo: 20251213000006_add_notifications.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 10: Notification Functions
-- Arquivo: 20251213000007_add_notification_functions.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 11: Fix Notification Policies
-- Arquivo: 20251213000008_fix_notification_policies.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 12: Enable Realtime Notifications
-- Arquivo: 20251213000009_enable_realtime_notifications.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 13: Delete Policy Notifications
-- Arquivo: 20251213000010_add_delete_policy_notifications.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 14: Premium Fields
-- Arquivo: 20251213000011_add_premium_fields.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 15: Premium Expires At
-- Arquivo: 20251213000012_add_premium_expires_at.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 16: Valorant Fields
-- Arquivo: 20251214000000_add_valorant_fields.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 17: Valorant PUUID
-- Arquivo: 20251214000001_add_valorant_puuid.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 18: User Widgets
-- Arquivo: 20251214000002_add_user_widgets.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 19: Staff/Developer/Bug Hunter Badges
-- Arquivo: 20251215000001_add_staff_developer_bug_hunter_badges.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 20: Card Settings
-- Arquivo: 20251215000002_add_card_settings.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 21: Link Style
-- Arquivo: 20251216000001_add_link_style.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 22: Premium Transactions
-- Arquivo: 20251216000001_add_premium_transactions.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 23: Link Button Style
-- Arquivo: 20251216000002_add_link_button_style.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 24: Send Premium Notification
-- Arquivo: 20251216000002_send_premium_notification_to_all.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 25: Link Icon Color
-- Arquivo: 20251216000003_add_link_icon_color.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 26: REMOVER DEPENDÊNCIAS DE AUTH (OBRIGATÓRIA - CRÍTICA!)
-- Arquivo: 20251217000000_remove_auth_users_fk.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 27: Email Password
-- Arquivo: 20251218000000_add_email_password.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 28: Fix Storage Policies
-- Arquivo: 20251218000001_fix_storage_policies.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 29: Fix User Widgets Policies
-- Arquivo: 20251218000002_fix_user_widgets_policies.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 30: REMOVER TODAS AS DEPENDÊNCIAS DE AUTH (OBRIGATÓRIA - CRÍTICA!)
-- Arquivo: 20251218000003_remove_all_auth_dependencies.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 31: Increment Profile Views
-- Arquivo: 20251219000000_add_increment_profile_views.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 32: Fix Increment Profile Views
-- Arquivo: 20251220000000_fix_increment_profile_views.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- Migration 33: Payment Gateway Premium Transactions
-- Arquivo: 20251221000000_add_payment_gateway_to_premium_transactions.sql
-- (Copie o conteúdo completo deste arquivo aqui)

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se a tabela profiles existe
SELECT 'Tabela profiles existe: ' || EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- Verificar se a coluna discord_user_id existe
SELECT 'Coluna discord_user_id existe: ' || EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'discord_user_id'
);

-- Verificar políticas RLS
SELECT 'Políticas RLS configuradas:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

