-- Permitir que qualquer usuário (incluindo clientes) visualize recompensas ativas
CREATE POLICY "Public can view active loyalty rewards"
ON public.loyalty_rewards
FOR SELECT
USING (is_active = true);