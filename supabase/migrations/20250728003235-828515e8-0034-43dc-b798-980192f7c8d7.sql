-- Tabela para armazenar o saldo atual de pontos de cada cliente
CREATE TABLE public.client_loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL,
  current_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, client_id)
);

-- Tabela para histórico de transações de pontos (ganhos e gastos)
CREATE TABLE public.loyalty_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  points INTEGER NOT NULL,
  description TEXT,
  service_id UUID,
  appointment_id UUID,
  redemption_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.client_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_point_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_loyalty_points
CREATE POLICY "Organization members can manage client loyalty points"
ON public.client_loyalty_points
FOR ALL
USING (organization_id = get_user_organization_id());

-- Políticas RLS para loyalty_point_transactions
CREATE POLICY "Organization members can manage loyalty point transactions"
ON public.loyalty_point_transactions
FOR ALL
USING (organization_id = get_user_organization_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_client_loyalty_points_updated_at
  BEFORE UPDATE ON public.client_loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_point_transactions_updated_at
  BEFORE UPDATE ON public.loyalty_point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para adicionar pontos quando um serviço é concluído
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  points_per_visit INTEGER;
  points_per_real NUMERIC;
  service_price NUMERIC;
  points_to_award INTEGER;
BEGIN
  -- Buscar configurações de fidelidade
  SELECT 
    ls.points_per_visit,
    ls.points_per_real,
    NEW.organization_id
  INTO 
    points_per_visit,
    points_per_real,
    org_id
  FROM loyalty_settings ls
  WHERE ls.organization_id = NEW.organization_id
    AND ls.is_active = true;

  -- Se não há configuração ativa, não fazer nada
  IF points_per_visit IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular pontos baseados no preço do serviço
  points_to_award := COALESCE(points_per_visit, 0);
  
  IF NEW.price IS NOT NULL AND points_per_real IS NOT NULL THEN
    points_to_award := points_to_award + (NEW.price * points_per_real)::INTEGER;
  END IF;

  -- Inserir ou atualizar saldo de pontos do cliente
  INSERT INTO public.client_loyalty_points (
    organization_id,
    client_id,
    current_points,
    lifetime_points
  )
  VALUES (
    org_id,
    NEW.client_id,
    points_to_award,
    points_to_award
  )
  ON CONFLICT (organization_id, client_id)
  DO UPDATE SET
    current_points = client_loyalty_points.current_points + points_to_award,
    lifetime_points = client_loyalty_points.lifetime_points + points_to_award,
    updated_at = now();

  -- Registrar transação de pontos
  INSERT INTO public.loyalty_point_transactions (
    organization_id,
    client_id,
    transaction_type,
    points,
    description,
    service_id,
    appointment_id
  )
  VALUES (
    org_id,
    NEW.client_id,
    'earned',
    points_to_award,
    'Pontos ganhos pelo serviço concluído',
    NEW.service_id,
    NEW.appointment_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para award pontos automaticamente quando um serviço é registrado no histórico
CREATE TRIGGER award_loyalty_points_trigger
  AFTER INSERT ON public.service_history
  FOR EACH ROW
  EXECUTE FUNCTION public.award_loyalty_points();