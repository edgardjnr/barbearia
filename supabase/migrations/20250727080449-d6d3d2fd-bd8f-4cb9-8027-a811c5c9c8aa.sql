-- Remover tabela de tiers (categorias) e criar sistema de recompensas
DROP TABLE IF EXISTS public.loyalty_tiers;

-- Criar tabela para recompensas/benefícios
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'product', -- product, service, discount, freebie
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  terms_conditions TEXT,
  max_redemptions INTEGER, -- limite de resgates (NULL = ilimitado)
  current_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para histórico de resgates
CREATE TABLE public.loyalty_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL,
  reward_id UUID NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty_rewards
CREATE POLICY "Organization members can manage loyalty rewards" 
ON public.loyalty_rewards 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create policies for loyalty_redemptions
CREATE POLICY "Organization members can manage redemptions" 
ON public.loyalty_redemptions 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create triggers for updated_at
CREATE TRIGGER update_loyalty_rewards_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_redemptions_updated_at
BEFORE UPDATE ON public.loyalty_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default rewards for existing organizations
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations
    LOOP
        INSERT INTO public.loyalty_rewards (organization_id, name, description, points_cost, reward_type) VALUES
        (org_record.id, 'Desconto de 10%', 'Desconto de 10% em qualquer serviço', 100, 'discount'),
        (org_record.id, 'Serviço Grátis', 'Um serviço básico gratuito', 300, 'service'),
        (org_record.id, 'Produto Brinde', 'Produto promocional da casa', 50, 'product');
    END LOOP;
END $$;