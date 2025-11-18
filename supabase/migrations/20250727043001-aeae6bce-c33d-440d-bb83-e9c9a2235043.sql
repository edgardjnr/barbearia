-- Fix the remaining recursion issue in organization_members policies
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON public.organization_members;

-- Create simple, non-recursive policies
-- Allow users to view organization members (simple approach)
CREATE POLICY "View organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  organization_id IN (
    SELECT DISTINCT o.id 
    FROM public.organizations o 
    WHERE o.owner_id = auth.uid()
  )
);

-- Allow users to insert themselves as owners or admins to add members
CREATE POLICY "Insert organization members" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id AND role = 'owner') OR
  organization_id IN (
    SELECT DISTINCT o.id 
    FROM public.organizations o 
    WHERE o.owner_id = auth.uid()
  )
);

-- Allow organization owners to update members
CREATE POLICY "Update organization members" 
ON public.organization_members 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT DISTINCT o.id 
    FROM public.organizations o 
    WHERE o.owner_id = auth.uid()
  )
);

-- Allow organization owners to delete members
CREATE POLICY "Delete organization members" 
ON public.organization_members 
FOR DELETE 
USING (
  organization_id IN (
    SELECT DISTINCT o.id 
    FROM public.organizations o 
    WHERE o.owner_id = auth.uid()
  )
);