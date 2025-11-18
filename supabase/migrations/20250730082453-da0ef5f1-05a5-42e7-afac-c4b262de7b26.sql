-- Criar enum para módulos do sistema
CREATE TYPE module_name AS ENUM (
  'dashboard',
  'agenda', 
  'clients',
  'services',
  'reports',
  'loyalty',
  'reviews',
  'users',
  'settings'
);

-- Criar enum para operações CRUD
CREATE TYPE crud_operation AS ENUM (
  'create',
  'read', 
  'update',
  'delete'
);

-- Criar tabela para permissões granulares
CREATE TABLE public.member_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  module module_name NOT NULL,
  operation crud_operation NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Índice único para evitar duplicatas
  UNIQUE(organization_id, member_id, module, operation)
);

-- Habilitar RLS na tabela
ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

-- Política para apenas proprietários poderem gerenciar permissões
CREATE POLICY "Only owners can manage permissions"
ON public.member_permissions
FOR ALL
USING (
  organization_id = get_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = member_permissions.organization_id
    AND role = 'owner'
  )
);

-- Política para membros visualizarem suas próprias permissões
CREATE POLICY "Members can view their own permissions"
ON public.member_permissions
FOR SELECT
USING (
  organization_id = get_user_organization_id()
  AND member_id IN (
    SELECT id FROM public.organization_members 
    WHERE user_id = auth.uid() AND organization_id = member_permissions.organization_id
  )
);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_member_permissions_updated_at
BEFORE UPDATE ON public.member_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhorar performance
CREATE INDEX idx_member_permissions_org_member ON public.member_permissions(organization_id, member_id);
CREATE INDEX idx_member_permissions_module ON public.member_permissions(module);
CREATE INDEX idx_member_permissions_operation ON public.member_permissions(operation);