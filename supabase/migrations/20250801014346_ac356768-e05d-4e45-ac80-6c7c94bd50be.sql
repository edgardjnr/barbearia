-- Update get_user_organizations function for master users
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_description text,
  user_role user_role,
  member_status member_status,
  joined_at timestamp with time zone
)
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
      'owner'::user_role,
      'active'::member_status,
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
      om.role::user_role,
      om.status::member_status,
      om.joined_at
    FROM public.organizations o
    INNER JOIN public.organization_members om ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
    ORDER BY om.joined_at ASC;
  END IF;
END;
$$;

-- Add RLS policies for master users

-- Organizations table
CREATE POLICY "Master users can view all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Organization members table  
CREATE POLICY "Master users can manage all members"
ON public.organization_members
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Profiles table
CREATE POLICY "Master users can view all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Services table
CREATE POLICY "Master users can manage all services"
ON public.services
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Clients table
CREATE POLICY "Master users can manage all clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Appointments table
CREATE POLICY "Master users can manage all appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());