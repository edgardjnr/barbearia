-- Allow users to be members of multiple organizations
-- The organization_members table already supports this, so we just need to ensure it's working correctly

-- Add a column to track the currently active organization for each user session
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_organization_id uuid REFERENCES public.organizations(id);

-- Create a function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_description text,
  user_role user_role,
  member_status member_status,
  joined_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.description as organization_description,
    om.role as user_role,
    om.status as member_status,
    om.joined_at
  FROM public.organizations o
  INNER JOIN public.organization_members om ON o.id = om.organization_id
  WHERE om.user_id = auth.uid() 
    AND om.status = 'active'
  ORDER BY om.joined_at ASC;
$$;

-- Create a function to switch user's current organization
CREATE OR REPLACE FUNCTION public.switch_current_organization(_organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
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
$$;

-- Update the get_user_organization_id function to use current_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    COALESCE(
      p.current_organization_id,
      -- Fallback to first organization if no current one is set
      (SELECT organization_id 
       FROM public.organization_members 
       WHERE user_id = auth.uid() 
         AND status = 'active' 
       ORDER BY joined_at ASC 
       LIMIT 1)
    )
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;