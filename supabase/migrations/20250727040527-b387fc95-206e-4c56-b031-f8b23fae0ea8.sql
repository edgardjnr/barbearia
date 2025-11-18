-- Fix RLS policy for organization_members to allow owners to add themselves
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;

-- Create new policy that allows organization owners to add themselves during organization creation
CREATE POLICY "Organization owners can add themselves and admins can manage members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  -- Allow user to add themselves as owner during organization creation
  (auth.uid() = user_id AND role = 'owner') OR
  -- Allow admins to add members to their organization
  has_organization_role_or_higher(auth.uid(), organization_id, 'admin'::app_role)
);

-- Recreate other policies for organization_members
CREATE POLICY "Organization admins can update and delete members" 
ON public.organization_members 
FOR ALL
USING (
  has_organization_role_or_higher(auth.uid(), organization_id, 'admin'::app_role)
);