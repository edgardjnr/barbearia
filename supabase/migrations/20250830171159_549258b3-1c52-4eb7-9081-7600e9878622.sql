-- PLANO DE CORREÇÃO DE SEGURANÇA - IMPLEMENTAÇÃO COMPLETA
-- Corrige vulnerabilidades mantendo todas as funcionalidades públicas

-- =====================================================
-- ETAPA 1: CRIAR VIEWS PÚBLICAS SEGURAS
-- =====================================================

-- View segura para organizações (apenas dados não sensíveis)
CREATE VIEW public_organizations_view AS
SELECT 
  id,
  name,
  description,
  address
FROM organizations
WHERE name IS NOT NULL AND id IS NOT NULL;

-- View segura para perfis de profissionais (apenas dados públicos)
CREATE VIEW public_profiles_view AS
SELECT 
  p.user_id,
  p.display_name,
  p.avatar_url
FROM profiles p
INNER JOIN organization_members om ON p.user_id = om.user_id
WHERE om.status = 'active' 
  AND p.display_name IS NOT NULL;

-- View básica para clientes (apenas para agendamentos públicos)
CREATE VIEW public_clients_basic AS
SELECT 
  id,
  name,
  organization_id
FROM clients
WHERE name IS NOT NULL
  AND organization_id IS NOT NULL;

-- =====================================================
-- ETAPA 2: FUNÇÕES SEGURAS DE ACESSO
-- =====================================================

-- Função segura para buscar organização por slug/nome
CREATE OR REPLACE FUNCTION get_safe_organization_info(org_slug text)
RETURNS TABLE(id uuid, name text, description text, address text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  target_org_id uuid;
BEGIN
  -- Buscar organização pelo nome normalizado (similar ao slug)
  SELECT o.id INTO target_org_id
  FROM organizations o  
  WHERE lower(replace(replace(replace(o.name, ' ', '-'), 'ã', 'a'), 'ç', 'c')) = lower(org_slug)
    OR lower(o.name) = lower(replace(org_slug, '-', ' '))
  LIMIT 1;
  
  -- Se não encontrou, retornar vazio
  IF target_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar apenas dados seguros
  RETURN QUERY
  SELECT o.id, o.name, o.description, o.address
  FROM organizations o
  WHERE o.id = target_org_id;
END;
$$;

-- Função para buscar perfis públicos de membros
CREATE OR REPLACE FUNCTION get_safe_member_profiles(org_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url
  FROM profiles p
  INNER JOIN organization_members om ON p.user_id = om.user_id
  WHERE om.organization_id = org_id
    AND om.status = 'active'
    AND p.display_name IS NOT NULL;
END;
$$;

-- =====================================================
-- ETAPA 3: ATUALIZAR POLÍTICAS RLS - REMOVER PERIGOSAS
-- =====================================================

-- Remover política que expõe TODOS os dados da organização
DROP POLICY IF EXISTS "Public can view basic organization info" ON organizations;

-- Remover política que expõe perfis completos dos profissionais  
DROP POLICY IF EXISTS "Public can view member profiles for booking" ON profiles;

-- =====================================================
-- ETAPA 4: CRIAR POLÍTICAS RLS SEGURAS
-- =====================================================

-- Nova política restritiva para organizations (apenas para busca por função)
CREATE POLICY "Secure public organization access" ON organizations
FOR SELECT 
TO public
USING (
  -- Apenas permitir acesso via função RPC ou para membros autenticados
  (current_setting('request.jwt.claims', true)::json->>'role' = 'anon' AND false) OR
  (auth.uid() IS NOT NULL AND (
    id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    ) OR 
    owner_id = auth.uid() OR 
    is_master_user()
  ))
);

-- Política segura para profiles (apenas membros da mesma org ou próprio perfil)
CREATE POLICY "Secure profile access" ON profiles
FOR SELECT
TO public
USING (
  -- Usuário pode ver próprio perfil
  user_id = auth.uid() OR
  -- Membros da mesma organização podem ver perfis básicos
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT om.user_id
    FROM organization_members om
    WHERE om.organization_id = get_user_organization_id()
      AND om.status = 'active'
  )) OR
  -- Master users podem ver todos
  is_master_user()
);

-- =====================================================
-- ETAPA 5: POLÍTICAS PARA AS VIEWS PÚBLICAS  
-- =====================================================

-- Permitir acesso público às views seguras
CREATE POLICY "Allow public access to safe organization view" ON public_organizations_view
FOR SELECT TO public USING (true);

CREATE POLICY "Allow public access to safe profiles view" ON public_profiles_view  
FOR SELECT TO public USING (true);

CREATE POLICY "Allow public access to basic clients view" ON public_clients_basic
FOR SELECT TO public USING (true);

-- =====================================================
-- ETAPA 6: HABILITAR RLS NAS VIEWS
-- =====================================================

ALTER VIEW public_organizations_view SET (security_barrier = true);
ALTER VIEW public_profiles_view SET (security_barrier = true); 
ALTER VIEW public_clients_basic SET (security_barrier = true);

-- =====================================================
-- ETAPA 7: GRANTS PARA ACESSO PÚBLICO ÀS VIEWS E FUNÇÕES
-- =====================================================

-- Permitir acesso público às views
GRANT SELECT ON public_organizations_view TO public;
GRANT SELECT ON public_profiles_view TO public;
GRANT SELECT ON public_clients_basic TO public;

-- Permitir acesso público às funções RPC
GRANT EXECUTE ON FUNCTION get_safe_organization_info(text) TO public;
GRANT EXECUTE ON FUNCTION get_safe_member_profiles(uuid) TO public;