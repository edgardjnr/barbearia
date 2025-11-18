-- Update all security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_or_create_chat(_organization_id uuid, _client_phone text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  chat_id UUID;
BEGIN
  -- Try to get existing chat
  SELECT id INTO chat_id 
  FROM public.chats 
  WHERE organization_id = _organization_id 
    AND client_phone = _client_phone;
  
  -- If not found, create new chat
  IF chat_id IS NULL THEN
    INSERT INTO public.chats (organization_id, client_phone, status)
    VALUES (_organization_id, _client_phone, 'open')
    RETURNING id INTO chat_id;
  END IF;
  
  RETURN chat_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_member_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.switch_current_organization(_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check if user is master - masters can switch to any organization
  IF public.is_master_user() THEN
    -- Update user's current organization
    UPDATE public.profiles 
    SET current_organization_id = _organization_id,
        updated_at = now()
    WHERE user_id = auth.uid();
    
    RETURN true;
  END IF;
  
  -- Check if user is a member of this organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND organization_id = _organization_id 
      AND status = 'active'
  ) THEN
    RETURN false;
  END IF;
  
  -- Update user's current organization
  UPDATE public.profiles 
  SET current_organization_id = _organization_id,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_master_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_master FROM public.profiles WHERE user_id = auth.uid()),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organizations()
 RETURNS TABLE(organization_id uuid, organization_name text, organization_description text, user_role text, member_status text, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF public.is_master_user() THEN
    -- Master users can see all organizations
    RETURN QUERY
    SELECT 
      o.id::uuid,
      o.name::text,
      o.description::text,
      'owner'::text as user_role,
      'active'::text as member_status,
      o.created_at
    FROM public.organizations o
    ORDER BY o.created_at ASC;
  ELSE
    -- Regular users see only their organizations
    RETURN QUERY
    SELECT 
      o.id::uuid,
      o.name::text,
      o.description::text,
      om.role::text,
      om.status::text,
      om.joined_at
    FROM public.organizations o
    INNER JOIN public.organization_members om ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
    ORDER BY om.joined_at ASC;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    CASE 
      WHEN public.is_master_user() THEN 
        COALESCE(
          (SELECT current_organization_id FROM public.profiles WHERE user_id = auth.uid()),
          (SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1)
        )
      ELSE
        COALESCE(
          (SELECT current_organization_id FROM public.profiles WHERE user_id = auth.uid()),
          (SELECT organization_id 
           FROM public.organization_members 
           WHERE user_id = auth.uid() 
             AND status = 'active' 
           ORDER BY joined_at ASC 
           LIMIT 1)
        )
    END;
$function$;