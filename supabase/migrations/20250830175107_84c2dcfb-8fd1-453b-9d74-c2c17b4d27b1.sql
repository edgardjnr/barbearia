-- Fix client creation security issue
-- Remove the public client creation policy and restrict to authenticated users only

-- Drop the existing public client creation policy
DROP POLICY IF EXISTS "Restricted client creation" ON public.clients;

-- Create new policy that only allows authenticated organization members to create clients
CREATE POLICY "Organization members can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_organization_id()
  AND name IS NOT NULL
  AND (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create policy for edge functions to create clients (using service role)
CREATE POLICY "Service role can create clients"
ON public.clients
FOR INSERT
TO service_role
WITH CHECK (
  organization_id IS NOT NULL
  AND name IS NOT NULL
  AND (email IS NOT NULL OR phone IS NOT NULL)
);