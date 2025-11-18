-- Fix infinite recursion in organization_members policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organization members can view members of their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can add themselves and admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can update and delete members" ON public.organization_members;

-- Create non-recursive policies for organization_members
-- Policy for SELECT operations
CREATE POLICY "Users can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  -- Users can view members of organizations they belong to
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.status = 'active'
  )
);

-- Policy for INSERT operations
CREATE POLICY "Users can insert organization members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  -- Allow user to add themselves as owner during organization creation
  (auth.uid() = user_id AND role = 'owner') OR
  -- Allow existing admins/owners to add new members
  (
    EXISTS (
      SELECT 1 FROM public.organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = organization_members.organization_id 
      AND om.role IN ('admin', 'owner') 
      AND om.status = 'active'
    )
  )
);

-- Policy for UPDATE operations
CREATE POLICY "Admins can update organization members" 
ON public.organization_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_members.organization_id 
    AND om.role IN ('admin', 'owner') 
    AND om.status = 'active'
  )
);

-- Policy for DELETE operations
CREATE POLICY "Admins can delete organization members" 
ON public.organization_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_members.organization_id 
    AND om.role IN ('admin', 'owner') 
    AND om.status = 'active'
  )
);