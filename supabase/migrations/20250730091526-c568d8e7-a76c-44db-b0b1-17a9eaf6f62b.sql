-- Criar política para permitir que clientes vejam seus próprios pontos de fidelidade
CREATE POLICY "Clients can view their own loyalty points" 
ON public.client_loyalty_points
FOR SELECT 
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE email = auth.jwt() ->> 'email'
  )
);

-- Também vamos adicionar política similar para clients se não existir
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data" 
ON public.clients
FOR SELECT 
USING (email = auth.jwt() ->> 'email');

-- E permitir que clientes vejam as organizações onde têm pontos
DROP POLICY IF EXISTS "Clients can view organizations where they have loyalty points" ON public.organizations;
CREATE POLICY "Clients can view organizations where they have loyalty points" 
ON public.organizations
FOR SELECT 
USING (
  id IN (
    SELECT c.organization_id 
    FROM public.clients c 
    WHERE c.email = auth.jwt() ->> 'email'
  )
);