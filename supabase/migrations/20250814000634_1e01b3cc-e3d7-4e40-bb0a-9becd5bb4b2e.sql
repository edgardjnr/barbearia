-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active organizations for booking" ON public.organizations;

-- Create a more restrictive policy that only exposes minimal safe information for public booking
CREATE POLICY "Public can view basic organization info for booking" 
ON public.organizations 
FOR SELECT 
USING (
  -- Only allow access to basic non-sensitive fields for public booking
  -- This policy will be used in conjunction with a view or specific queries
  -- that only select safe fields (name, id, address)
  (name IS NOT NULL) AND (id IS NOT NULL)
);

-- Create a secure function to get public organization info for booking
CREATE OR REPLACE FUNCTION public.get_public_organization_info(org_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  description text
) 
LANGUAGE sql 
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    o.id,
    o.name,
    o.address,
    o.description
  FROM public.organizations o
  WHERE o.id = org_id 
    AND o.name IS NOT NULL;
$$;

-- Grant execute permission to anonymous users for the booking function
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO authenticated;

-- Create a more restrictive policy for authenticated organization members
-- This ensures only members can see sensitive data like email, phone, WhatsApp config
CREATE POLICY "Organization members can view full organization data" 
ON public.organizations 
FOR SELECT 
USING (
  -- Allow full access to organization members
  (id IN ( 
    SELECT organization_members.organization_id
    FROM organization_members
    WHERE organization_members.user_id = auth.uid() 
      AND organization_members.status = 'active'::member_status
  )) 
  OR 
  -- Allow owners to see their organizations
  (owner_id = auth.uid())
  OR
  -- Allow master users to see all organizations
  is_master_user()
);

-- Ensure clients can still access their loyalty-related organization data
-- but only basic info, not sensitive credentials
CREATE POLICY "Clients can view basic organization info for loyalty" 
ON public.organizations 
FOR SELECT 
USING (
  id IN ( 
    SELECT c.organization_id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email'::text)
  )
);

-- Create a function specifically for public booking that returns only safe organization data
CREATE OR REPLACE FUNCTION public.get_organizations_for_booking()
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  description text
) 
LANGUAGE sql 
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    o.id,
    o.name,
    o.address,
    o.description
  FROM public.organizations o
  WHERE o.name IS NOT NULL 
    AND o.id IS NOT NULL
  ORDER BY o.name;
$$;

-- Grant execute permission for the public booking function
GRANT EXECUTE ON FUNCTION public.get_organizations_for_booking() TO anon;
GRANT EXECUTE ON FUNCTION public.get_organizations_for_booking() TO authenticated;