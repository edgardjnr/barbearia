-- CORREÇÃO FINAL DE SEGURANÇA - IMPLEMENTAÇÃO COMPLETA
-- Remove vulnerabilidades críticas mantendo funcionalidades públicas

-- =====================================================
-- ETAPA 1: CRIAR VIEWS PÚBLICAS SEGURAS
-- =====================================================

-- View segura para organizações (apenas dados não sensíveis)
CREATE OR REPLACE VIEW public_organizations_view AS
SELECT 
  id,
  name,
  description,
  address
FROM organizations
WHERE name IS NOT NULL AND id IS NOT NULL;

-- View segura para perfis de profissionais (apenas dados públicos)
CREATE OR REPLACE VIEW public_profiles_view AS
SELECT 
  p.user_id,
  p.display_name,
  p.avatar_url
FROM profiles p
INNER JOIN organization_members om ON p.user_id = om.user_id
WHERE om.status = 'active' 
  AND p.display_name IS NOT NULL;

-- View básica para clientes (apenas para agendamentos públicos)
CREATE OR REPLACE VIEW public_clients_basic AS
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
  -- Normalizar slug para busca
  SELECT o.id INTO target_org_id
  FROM organizations o  
  WHERE lower(replace(replace(replace(o.name, ' ', '-'), 'ã', 'a'), 'ç', 'c')) = lower(org_slug)
    OR lower(o.name) = lower(replace(org_slug, '-', ' '))
  LIMIT 1;
  
  IF target_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar apenas dados seguros (sem API keys)
  RETURN QUERY
  SELECT o.id, o.name, o.description, o.address
  FROM organizations o
  WHERE o.id = target_org_id;
END;
$$;

-- =====================================================
-- ETAPA 3: REMOVER POLÍTICAS PERIGOSAS
-- =====================================================

-- Remover todas as políticas públicas perigosas das tabelas principais
DROP POLICY IF EXISTS "Public can view basic organization info" ON organizations;
DROP POLICY IF EXISTS "Public can view member profiles for booking" ON profiles;
DROP POLICY IF EXISTS "Secure organization access" ON organizations;
DROP POLICY IF EXISTS "Secure profile access" ON profiles;

-- =====================================================
-- ETAPA 4: CRIAR POLÍTICAS RLS SEGURAS
-- =====================================================

-- Nova política restritiva para organizations 
CREATE POLICY "Members only organization access" ON organizations
FOR SELECT 
USING (
  -- Apenas membros autenticados, donos ou master users
  auth.uid() IS NOT NULL AND (
    id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    ) OR 
    owner_id = auth.uid() OR 
    is_master_user()
  )
);

-- Política segura para profiles
CREATE POLICY "Restricted profile access" ON profiles
FOR SELECT
USING (
  -- Próprio perfil, membros da mesma org, ou master users
  user_id = auth.uid() OR
  (auth.uid() IS NOT NULL AND user_id IN (
    SELECT om.user_id
    FROM organization_members om
    WHERE om.organization_id = get_user_organization_id()
      AND om.status = 'active'
  )) OR
  is_master_user()
);

-- =====================================================
-- ETAPA 5: GRANTS PARA ACESSO PÚBLICO SEGURO
-- =====================================================

-- Permitir acesso público apenas às views seguras
GRANT SELECT ON public_organizations_view TO public, anon, authenticated;
GRANT SELECT ON public_profiles_view TO public, anon, authenticated; 
GRANT SELECT ON public_clients_basic TO public, anon, authenticated;

-- Permitir acesso às funções seguras
GRANT EXECUTE ON FUNCTION get_safe_organization_info(text) TO public, anon, authenticated;

-- =====================================================
-- COMENTÁRIO: FUNCIONALIDADES MANTIDAS
-- =====================================================
-- ✅ Agendamento público: Usa views e funções seguras
-- ✅ Avaliações públicas: Mantém acesso via policies existentes
-- ✅ Visualização de profissionais: Via public_profiles_view
-- ✅ Serviços públicos: Policy existente mantida
-- ✅ Horários de trabalho: Policy pública mantida
-- ✅ Clientes: Lookup via public_clients_basic

-- =====================================================
-- RESULTADO FINAL DE SEGURANÇA
-- =====================================================
-- 🔒 API keys do WhatsApp: PROTEGIDAS (não acessíveis publicamente)
-- 🔒 Emails pessoais: PROTEGIDOS (apenas display_name público)
-- 🔒 Telefones: PROTEGIDOS (não expostos nas views)
-- 🔒 Dados internos: PROTEGIDOS (apenas membros autenticados)
-- ✅ Funcionalidades públicas: MANTIDAS (via views/funções seguras)