-- Corrigir política RLS para loyalty_redemptions permitindo inserção por membros da organização
DROP POLICY IF EXISTS "Organization members can manage redemptions" ON public.loyalty_redemptions;

CREATE POLICY "Organization members can manage redemptions" 
ON public.loyalty_redemptions 
FOR ALL 
USING (organization_id = get_user_organization_id())
WITH CHECK (organization_id = get_user_organization_id());

-- Adicionar política para permitir visualização de resgates por clientes
CREATE POLICY "Clients can view their own redemptions" 
ON public.loyalty_redemptions 
FOR SELECT 
USING (client_id IN (
  SELECT c.id 
  FROM clients c 
  WHERE c.email = (auth.jwt() ->> 'email'::text)
));