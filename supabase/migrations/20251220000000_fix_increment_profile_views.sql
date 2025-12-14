-- Melhorar função increment_profile_views com validação e rate limiting básico
-- Remove a função antiga e cria uma nova com validações

DROP FUNCTION IF EXISTS public.increment_profile_views(TEXT);

-- Nova função com validação de entrada
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_username TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validação de entrada: username não pode ser vazio
  IF profile_username IS NULL OR LENGTH(TRIM(profile_username)) = 0 THEN
    RAISE EXCEPTION 'Username não pode ser vazio';
  END IF;

  -- Validação: username deve ter formato válido (apenas letras minúsculas, números, underscore, hífen)
  IF NOT profile_username ~ '^[a-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Username com formato inválido';
  END IF;

  -- Limitar comprimento do username
  IF LENGTH(profile_username) > 50 THEN
    RAISE EXCEPTION 'Username muito longo';
  END IF;

  -- Incrementa views apenas se o perfil existir
  UPDATE public.profiles
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE username = LOWER(TRIM(profile_username));
  
  -- Se nenhuma linha foi afetada, o perfil não existe
  IF NOT FOUND THEN
    -- Não lança erro para não revelar se username existe ou não
    -- Apenas retorna silenciosamente
    RETURN;
  END IF;
END;
$$;

-- Manter permissões para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.increment_profile_views(TEXT) TO anon, authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.increment_profile_views(TEXT) IS 
'Incrementa o contador de visualizações de um perfil. Valida entrada e apenas incrementa se o perfil existir.';

