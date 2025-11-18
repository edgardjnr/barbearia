-- Permitir que clientes criem transações de pontos para seus próprios resgates
CREATE POLICY "Clients can create loyalty point transactions for redemptions" 
ON public.loyalty_point_transactions 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email'::text)
      AND c.organization_id = loyalty_point_transactions.organization_id
  )
  AND transaction_type = 'redeemed'
);

-- Permitir que clientes vejam suas próprias transações de pontos
CREATE POLICY "Clients can view their own loyalty point transactions" 
ON public.loyalty_point_transactions 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email'::text)
  )
);

-- Permitir que clientes atualizem seus próprios pontos de fidelidade
CREATE POLICY "Clients can update their own loyalty points" 
ON public.client_loyalty_points 
FOR UPDATE 
USING (
  client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email'::text)
      AND c.organization_id = client_loyalty_points.organization_id
  )
);

-- Permitir que clientes insiram seus próprios pontos de fidelidade (caso não existam ainda)
CREATE POLICY "Clients can insert their own loyalty points" 
ON public.client_loyalty_points 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT c.id
    FROM clients c
    WHERE c.email = (auth.jwt() ->> 'email'::text)
      AND c.organization_id = client_loyalty_points.organization_id
  )
);