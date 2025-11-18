-- Remover política restritiva para members e manter apenas a pública para clientes
DROP POLICY IF EXISTS "Organization members can manage clients" ON public.clients;

-- Manter apenas a política pública para criação de clientes
-- A política já existe, mas vamos garantir que está correta

-- Criar uma política específica para membros da organização gerenciarem clientes
CREATE POLICY "Organization members can manage clients" 
ON public.clients 
FOR ALL
TO authenticated
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());