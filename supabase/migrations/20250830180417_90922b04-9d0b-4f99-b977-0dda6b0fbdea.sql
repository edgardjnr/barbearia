-- Fix public access to organization members for booking
-- Create a secure RPC function to get member data needed for public booking

CREATE OR REPLACE FUNCTION public.get_public_organization_members(org_id uuid)
RETURNS TABLE(id uuid, user_id uuid, role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.id,
    om.user_id,
    om.role::text
  FROM organization_members om
  WHERE om.organization_id = org_id
    AND om.status = 'active'
    AND om.role IN ('employee', 'manager', 'admin');
END;
$$;