-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.has_organization_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_organization_role_or_higher(_user_id UUID, _org_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND status = 'active'
      AND (
        (_min_role = 'viewer' AND role IN ('viewer', 'employee', 'admin', 'owner')) OR
        (_min_role = 'employee' AND role IN ('employee', 'admin', 'owner')) OR
        (_min_role = 'admin' AND role IN ('admin', 'owner')) OR
        (_min_role = 'owner' AND role = 'owner')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

-- Add RLS policy for user_roles table that was missing
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om2
        WHERE om2.user_id = user_roles.user_id
          AND om2.organization_id = om.organization_id
      )
  )
);

CREATE POLICY "Organization admins can manage user roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'owner')
      AND EXISTS (
        SELECT 1
        FROM public.organization_members om2
        WHERE om2.user_id = user_roles.user_id
          AND om2.organization_id = om.organization_id
      )
  )
);