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

-- Função para inicializar permissões padrão para novos membros
CREATE OR REPLACE FUNCTION public.initialize_member_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  module_names module_name[] := ARRAY['dashboard', 'agenda', 'clients', 'services', 'reports', 'loyalty', 'reviews', 'users', 'settings'];
  operations crud_operation[] := ARRAY['create', 'read', 'update', 'delete'];
  mod module_name;
  op crud_operation;
  default_grant BOOLEAN;
BEGIN
  -- Apenas para novos membros ativos
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    FOREACH mod IN ARRAY module_names LOOP
      FOREACH op IN ARRAY operations LOOP
        -- Definir permissões padrão baseadas no papel
        default_grant := CASE 
          WHEN NEW.role = 'owner' THEN true
          WHEN NEW.role = 'admin' THEN true
          WHEN NEW.role = 'manager' AND op IN ('read', 'update') THEN true
          WHEN NEW.role = 'manager' AND mod NOT IN ('users', 'settings') THEN true
          WHEN NEW.role = 'employee' AND op = 'read' THEN true
          WHEN NEW.role = 'employee' AND mod IN ('dashboard', 'agenda', 'clients') AND op IN ('read', 'update') THEN true
          ELSE false
        END;
        
        -- Inserir ou atualizar permissão
        INSERT INTO public.member_permissions (
          organization_id, member_id, module, operation, granted
        ) VALUES (
          NEW.organization_id, NEW.id, mod, op, default_grant
        ) ON CONFLICT (organization_id, member_id, module, operation)
        DO UPDATE SET 
          granted = default_grant,
          updated_at = now();
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para inicializar permissões automaticamente
CREATE TRIGGER initialize_member_permissions_trigger
AFTER INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.initialize_member_permissions();

-- Adicionar índices para melhorar performance
CREATE INDEX idx_member_permissions_org_member ON public.member_permissions(organization_id, member_id);
CREATE INDEX idx_member_permissions_module ON public.member_permissions(module);
CREATE INDEX idx_member_permissions_operation ON public.member_permissions(operation);