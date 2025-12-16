-- Função para incrementar views_count de um perfil
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_username TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE username = profile_username;
END;
$$;

-- Garantir que a função pode ser executada por usuários anônimos
GRANT EXECUTE ON FUNCTION public.increment_profile_views(TEXT) TO anon, authenticated;

