-- Fix services table security issue
-- Ensure services are only accessible to organization members

-- Add policy to restrict services reading to organization members only
CREATE POLICY "Organization members can read services"
ON public.services
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- Ensure no public access to services table directly
-- (Public access should use get_public_services RPC function instead)