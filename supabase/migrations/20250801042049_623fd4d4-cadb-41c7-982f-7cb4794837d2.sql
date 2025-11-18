-- Fix remaining function security issues by ensuring all functions have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_date()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CURRENT_DATE::text;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.switch_current_organization(_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_user_organizations()
 RETURNS TABLE(organization_id uuid, organization_name text, organization_description text, user_role text, member_status text, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.award_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org_id UUID;
  points_per_visit INTEGER;
  points_per_real NUMERIC;
  service_price NUMERIC;
  points_to_award INTEGER;
BEGIN
  -- Buscar configurações de fidelidade
  SELECT 
    ls.points_per_visit,
    ls.points_per_real,
    NEW.organization_id
  INTO 
    points_per_visit,
    points_per_real,
    org_id
  FROM loyalty_settings ls
  WHERE ls.organization_id = NEW.organization_id
    AND ls.is_active = true;

  -- Se não há configuração ativa, não fazer nada
  IF points_per_visit IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular pontos baseados no preço do serviço
  points_to_award := COALESCE(points_per_visit, 0);
  
  IF NEW.price IS NOT NULL AND points_per_real IS NOT NULL THEN
    points_to_award := points_to_award + (NEW.price * points_per_real)::INTEGER;
  END IF;

  -- Inserir ou atualizar saldo de pontos do cliente
  INSERT INTO public.client_loyalty_points (
    organization_id,
    client_id,
    current_points,
    lifetime_points
  )
  VALUES (
    org_id,
    NEW.client_id,
    points_to_award,
    points_to_award
  )
  ON CONFLICT (organization_id, client_id)
  DO UPDATE SET
    current_points = client_loyalty_points.current_points + points_to_award,
    lifetime_points = client_loyalty_points.lifetime_points + points_to_award,
    updated_at = now();

  -- Registrar transação de pontos
  INSERT INTO public.loyalty_point_transactions (
    organization_id,
    client_id,
    transaction_type,
    points,
    description,
    service_id,
    appointment_id
  )
  VALUES (
    org_id,
    NEW.client_id,
    'earned',
    points_to_award,
    'Pontos ganhos pelo serviço concluído',
    NEW.service_id,
    NEW.appointment_id
  );

  RETURN NEW;
END;
$function$;