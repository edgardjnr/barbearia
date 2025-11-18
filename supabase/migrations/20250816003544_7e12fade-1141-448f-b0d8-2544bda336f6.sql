-- Fix critical security vulnerability: Remove public access to sensitive organization data
-- Drop the overly permissive public read policy that exposes business contact info and API keys
DROP POLICY IF EXISTS "Public can view basic organization info for booking" ON public.organizations;

-- Create a restrictive policy that blocks direct public access to organization data
CREATE POLICY "No public access to organization data" 
ON public.organizations 
FOR SELECT 
USING (false);

-- The existing secure functions will handle public booking needs:
-- 1. get_organizations_for_booking() - returns only id, name, address, description
-- 2. get_public_organization_info(org_id) - returns only id, name, address, description
-- These functions already provide minimal necessary data without exposing:
-- - email addresses
-- - phone numbers  
-- - WhatsApp API credentials
-- - other sensitive business information

-- Ensure existing functionality remains intact:
-- 1. Organization members retain full access via existing policies
-- 2. Master users retain full access
-- 3. Owners can still manage their organization
-- 4. Public booking uses secure functions instead of direct table access