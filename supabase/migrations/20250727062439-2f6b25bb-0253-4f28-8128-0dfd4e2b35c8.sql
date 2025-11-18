-- Recriar o trigger para criar perfis automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar perfil para o usuário existente
INSERT INTO public.profiles (user_id, display_name, email)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name', email),
  email
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles);

-- Corrigir política de INSERT para profiles (estava sem CHECK)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Corrigir política de INSERT para organizations (estava sem CHECK)  
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Corrigir política de INSERT para organization_members (estava sem CHECK)
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;
CREATE POLICY "Users can join organizations" ON public.organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());