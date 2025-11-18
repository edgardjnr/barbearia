-- Fix any remaining function that might not have search_path set
-- Check and update the award_loyalty_points function
CREATE OR REPLACE FUNCTION public.award_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;