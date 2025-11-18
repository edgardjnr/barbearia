-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can access all messages" ON "Mensagens";

-- Create a new policy that allows organization members to access their organization's messages
CREATE POLICY "Organization members can access messages" ON "Mensagens"
FOR ALL 
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);