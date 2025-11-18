-- Allow organization members to view profiles of other members in their organization
CREATE POLICY "Organization members can view each other's profiles"
ON public.profiles
FOR SELECT
USING (
  user_id IN (
    SELECT om.user_id 
    FROM public.organization_members om
    WHERE om.organization_id = get_user_organization_id()
    AND om.status = 'active'
  )
);