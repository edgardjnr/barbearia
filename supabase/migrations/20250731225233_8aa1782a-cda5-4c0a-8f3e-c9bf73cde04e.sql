-- Drop and recreate the initialize_member_permissions function with correct schema references
DROP FUNCTION IF EXISTS public.initialize_member_permissions() CASCADE;

CREATE OR REPLACE FUNCTION public.initialize_member_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mod TEXT;
  op TEXT;
  default_grant BOOLEAN;
BEGIN
  -- Apenas para novos membros ativos
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- Loop através dos módulos
    FOR mod IN SELECT unnest(ARRAY['dashboard', 'agenda', 'clients', 'services', 'reports', 'loyalty', 'reviews', 'users', 'settings']) LOOP
      -- Loop através das operações
      FOR op IN SELECT unnest(ARRAY['create', 'read', 'update', 'delete']) LOOP
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
          NEW.organization_id, NEW.id, mod::public.module_name, op::public.crud_operation, default_grant
        ) ON CONFLICT (organization_id, member_id, module, operation)
        DO UPDATE SET 
          granted = default_grant,
          updated_at = now();
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger to automatically initialize permissions for new members
CREATE TRIGGER initialize_member_permissions_trigger
  AFTER INSERT OR UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_member_permissions();