-- Corrigir a função get_user_organizations para funcionar corretamente com usuários master
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE(organization_id uuid, organization_name text, organization_description text, user_role text, member_status text, joined_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;