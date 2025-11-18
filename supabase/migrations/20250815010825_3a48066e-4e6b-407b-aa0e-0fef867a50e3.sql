-- Fix critical security vulnerability: Remove public access to sensitive profile data
-- Drop the overly permissive public read policy that exposes personal information
DROP POLICY IF EXISTS "Public can view profiles for booking" ON public.profiles;

-- Create a secure function that only exposes minimal necessary data for public booking
-- This function will only return user display names and IDs, without sensitive contact information
CREATE OR REPLACE FUNCTION public.get_profiles_for_booking(org_id uuid)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.user_id,
    p.display_name
  FROM public.profiles p
  INNER JOIN public.organization_members om ON p.user_id = om.user_id
  WHERE om.organization_id = org_id 
    AND om.status = 'active'
    AND p.display_name IS NOT NULL
  ORDER BY p.display_name;
$function$;

-- Create a more restrictive policy that blocks direct public access to profile data
CREATE POLICY "No public access to profile data" 
ON public.profiles 
FOR SELECT 
USING (false);

-- Ensure existing functionality remains intact:
-- 1. Users can still view their own profiles
-- 2. Organization members can view each other within their organization  
-- 3. Master users retain full access
-- 4. Users can still insert/update their own profiles

-- The booking system will need to use the secure function instead of direct table access