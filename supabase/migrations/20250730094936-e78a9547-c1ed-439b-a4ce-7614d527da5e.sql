-- Adicionar foreign key entre loyalty_redemptions e clients
ALTER TABLE public.loyalty_redemptions 
ADD CONSTRAINT fk_loyalty_redemptions_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE CASCADE;

-- Adicionar foreign key entre loyalty_redemptions e loyalty_rewards
ALTER TABLE public.loyalty_redemptions 
ADD CONSTRAINT fk_loyalty_redemptions_reward_id 
FOREIGN KEY (reward_id) REFERENCES public.loyalty_rewards (id) ON DELETE CASCADE;