-- Fix the search_path security issue for the functions we just created
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
SET search_path = 'public'
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
SET search_path = 'public'
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