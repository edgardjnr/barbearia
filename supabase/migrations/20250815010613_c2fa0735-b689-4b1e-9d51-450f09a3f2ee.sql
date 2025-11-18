-- Fix critical security vulnerability: Remove public access to sensitive client data
-- Drop the overly permissive public read policy that exposes sensitive customer information
DROP POLICY IF EXISTS "Public can view basic client info for booking" ON public.clients;

-- Drop the existing public create policy so we can replace it
DROP POLICY IF EXISTS "Public can create clients with required data" ON public.clients;

-- Create a secure function that only exposes minimal necessary data for public booking
-- This function will only return client names and IDs, without sensitive contact information
CREATE OR REPLACE FUNCTION public.get_clients_for_booking(org_id uuid)
RETURNS TABLE(id uuid, name text, organization_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    c.id,
    c.name,
    c.organization_id
  FROM public.clients c
  WHERE c.organization_id = org_id 
    AND c.name IS NOT NULL
    AND c.id IS NOT NULL
  ORDER BY c.name;
$function$;

-- Create a more restrictive policy that blocks direct public access to client data
CREATE POLICY "No public access to client data" 
ON public.clients 
FOR SELECT 
USING (false);

-- Create a secure policy for client creation through public booking
-- Only allows creation with minimal required fields and validates organization
CREATE POLICY "Public can create clients with minimal data" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  name IS NOT NULL 
  AND organization_id IS NOT NULL 
  AND (email IS NOT NULL OR phone IS NOT NULL)
  AND organization_id IN (
    SELECT id FROM public.organizations 
    WHERE name IS NOT NULL AND id IS NOT NULL
  )
);