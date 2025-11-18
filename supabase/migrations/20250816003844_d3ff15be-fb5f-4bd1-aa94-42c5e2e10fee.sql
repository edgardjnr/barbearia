-- Fix critical security vulnerability: Remove public access to employee information
-- Drop the overly permissive public read policy that exposes employee data
DROP POLICY IF EXISTS "Public can view active organization members for booking" ON public.organization_members;

-- Verify that existing functionality remains intact:
-- 1. Organization members retain access to view each other via "Members can view organization members" policy
-- 2. Managers can still manage members via "Managers can manage members" policy  
-- 3. Master users retain full access via "Master users can manage all members" policy
-- 4. Users can still join organizations via "Users can join organizations" policy
-- 5. Public booking uses get_profiles_for_booking(org_id) function instead of direct table access