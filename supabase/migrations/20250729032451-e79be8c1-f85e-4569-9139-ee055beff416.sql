-- Remover políticas existentes da tabela clients
DROP POLICY IF EXISTS "Organization members can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Public can create clients for booking" ON public.clients;

-- Criar políticas mais simples e permissivas
CREATE POLICY "Allow public client creation" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Organization members can view and manage clients" 
ON public.clients 
FOR ALL
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Public can view clients for booking" 
ON public.clients 
FOR SELECT 
USING (true);