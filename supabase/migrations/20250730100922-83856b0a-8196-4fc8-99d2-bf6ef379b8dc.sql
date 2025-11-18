-- Adicionar política RLS para permitir que clientes criem seus próprios resgates
CREATE POLICY "Clients can create their own redemptions" 
ON public.loyalty_redemptions 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email')
    AND c.organization_id = loyalty_redemptions.organization_id
  )
);