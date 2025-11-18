-- Update RLS policy for member_permissions to allow system operations
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only owners can manage permissions" ON public.member_permissions;

-- Create new policies that allow the system to work
CREATE POLICY "Owners can manage all permissions" 
ON public.member_permissions 
FOR ALL 
USING (
  organization_id = get_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = member_permissions.organization_id 
    AND role = 'owner'::user_role
  )
);

-- Allow system to create initial permissions for new members
CREATE POLICY "System can create initial permissions" 
ON public.member_permissions 
FOR INSERT 
WITH CHECK (true);

-- Allow members to view their own permissions (keep existing policy)
-- The existing policy for SELECT should remain as is