-- CORREÇÃO DOS WARNINGS DE SEGURANÇA DAS VIEWS
-- Remove SECURITY DEFINER das views para corrigir os warnings

-- Remover as views existentes que causam warnings
DROP VIEW IF EXISTS public_organizations_view;
DROP VIEW IF EXISTS public_profiles_view;
DROP VIEW IF EXISTS public_clients_basic;

-- Recriar views como SECURITY INVOKER (padrão) para eliminar os warnings
CREATE VIEW public_organizations_view AS
SELECT 
  id,
  name,
  description,
  address
FROM organizations
WHERE name IS NOT NULL AND id IS NOT NULL;

CREATE VIEW public_profiles_view AS
SELECT 
  p.user_id,
  p.display_name,
  p.avatar_url
FROM profiles p
INNER JOIN organization_members om ON p.user_id = om.user_id
WHERE om.status = 'active' 
  AND p.display_name IS NOT NULL;

CREATE VIEW public_clients_basic AS
SELECT 
  id,
  name,
  organization_id
FROM clients
WHERE name IS NOT NULL
  AND organization_id IS NOT NULL;

-- Garantir acesso público às views
GRANT SELECT ON public_organizations_view TO public, anon, authenticated;
GRANT SELECT ON public_profiles_view TO public, anon, authenticated;
GRANT SELECT ON public_clients_basic TO public, anon, authenticated;