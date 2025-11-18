-- Corrigir a função is_master_user para verificar corretamente o status master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT is_master FROM public.profiles WHERE user_id = auth.uid()),
    false
  );
$$;