-- Completely rework the organization_members policies to be simple and functional
-- Drop all existing policies first
DROP POLICY IF EXISTS "View organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Insert organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Update organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Delete organization members" ON public.organization_members;

-- Create very simple policies that avoid recursion
-- Policy 1: Users can always view their own membership
CREATE POLICY "Users can view their own memberships" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Users can view memberships of organizations they own
CREATE POLICY "Owners can view all organization memberships" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

-- Policy 3: Allow inserting organization memberships
CREATE POLICY "Allow inserting organization memberships" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  -- User can add themselves as owner
  (user_id = auth.uid() AND role = 'owner') OR
  -- Organization owner can add anyone
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

-- Policy 4: Allow updating organization memberships (only owners)
CREATE POLICY "Owners can update organization memberships" 
ON public.organization_members 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

-- Policy 5: Allow deleting organization memberships (only owners)
CREATE POLICY "Owners can delete organization memberships" 
ON public.organization_members 
FOR DELETE 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);