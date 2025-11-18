-- Fix critical security vulnerability: Remove public access to employee information
-- Drop the overly permissive public read policy that exposes employee data
DROP POLICY IF EXISTS "Public can view active organization members for booking" ON public.organization_members;

-- Create a restrictive policy that blocks direct public access to organization member data
CREATE POLICY "No public access to organization member data" 
ON public.organization_members 
FOR SELECT 
USING (false);

-- The existing secure functions will handle public booking needs:
-- 1. get_profiles_for_booking(org_id) - returns only user_id and display_name
-- This function already provides the minimal necessary data without exposing:
-- - Employee roles and hierarchy
-- - User IDs beyond what's needed for booking
-- - Internal organizational relationships
-- - Member status and other sensitive metadata

-- Ensure existing functionality remains intact:
-- 1. Organization members retain access to view each other via existing policies
-- 2. Managers can still manage members
-- 3. Master users retain full access
-- 4. Users can still join organizations
-- 5. Public booking uses secure functions instead of direct table access