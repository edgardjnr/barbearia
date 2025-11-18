-- Remover a política restritiva que bloqueia acesso público aos profiles
DROP POLICY IF EXISTS "No public access to profile data" ON public.profiles;