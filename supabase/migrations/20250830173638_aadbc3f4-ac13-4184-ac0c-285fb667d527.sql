-- Corrigir search_path nas funções criadas para resolver warning de segurança
-- Todas as funções devem ter SET search_path TO 'public' para segurança

-- Atualizar função get_public_services
CREATE OR REPLACE FUNCTION public.get_public_services(org_id uuid)
 RETURNS TABLE(id uuid, name text, description text, price numeric, duration_minutes integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.price,
    s.duration_minutes
  FROM services s
  WHERE s.organization_id = org_id
    AND s.is_active = true;
END;
$function$;

-- Atualizar função get_public_working_hours
CREATE OR REPLACE FUNCTION public.get_public_working_hours(org_id uuid)
 RETURNS TABLE(member_id uuid, day_of_week integer, start_time time, end_time time)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    wh.member_id,
    wh.day_of_week,
    wh.start_time,
    wh.end_time
  FROM working_hours wh
  INNER JOIN organization_members om ON wh.member_id = om.id
  WHERE wh.organization_id = org_id
    AND wh.is_active = true
    AND om.status = 'active';
END;
$function$;

-- Atualizar função get_public_schedule_blocks
CREATE OR REPLACE FUNCTION public.get_public_schedule_blocks(org_id uuid, start_date date DEFAULT CURRENT_DATE, end_date date DEFAULT (CURRENT_DATE + INTERVAL '30 days'))
 RETURNS TABLE(member_id uuid, block_date date, start_time time, end_time time, is_all_day boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    msb.member_id,
    msb.block_date,
    msb.start_time,
    msb.end_time,
    msb.is_all_day
  FROM member_schedule_blocks msb
  INNER JOIN organization_members om ON msb.member_id = om.id
  WHERE msb.organization_id = org_id
    AND msb.block_date BETWEEN start_date AND end_date
    AND om.status = 'active';
END;
$function$;

-- Atualizar função get_public_member_services
CREATE OR REPLACE FUNCTION public.get_public_member_services(org_id uuid)
 RETURNS TABLE(member_id uuid, service_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ms.member_id,
    ms.service_id
  FROM member_services ms
  INNER JOIN organization_members om ON ms.member_id = om.id
  INNER JOIN services s ON ms.service_id = s.id
  WHERE ms.organization_id = org_id
    AND om.status = 'active'
    AND s.is_active = true;
END;
$function$;

-- Atualizar função check_appointment_rate_limit
CREATE OR REPLACE FUNCTION public.check_appointment_rate_limit(client_ip text, org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_count integer := 0;
  rate_limit_exceeded boolean := false;
BEGIN
  -- Limpar registros antigos (mais de 1 hora)
  DELETE FROM appointment_rate_limit 
  WHERE last_appointment < (now() - INTERVAL '1 hour');
  
  -- Verificar contagem atual para este IP e organização
  SELECT appointment_count INTO current_count
  FROM appointment_rate_limit
  WHERE ip_address = client_ip 
    AND organization_id = org_id
    AND last_appointment > (now() - INTERVAL '1 hour');
  
  -- Se não existe registro ou limite não excedido
  IF current_count IS NULL OR current_count < 3 THEN
    -- Inserir ou atualizar registro
    INSERT INTO appointment_rate_limit (ip_address, organization_id, appointment_count, last_appointment)
    VALUES (client_ip, org_id, 1, now())
    ON CONFLICT ON CONSTRAINT appointment_rate_limit_pkey DO NOTHING;
    
    -- Se já existe, incrementar contador
    IF current_count IS NOT NULL THEN
      UPDATE appointment_rate_limit 
      SET appointment_count = current_count + 1,
          last_appointment = now()
      WHERE ip_address = client_ip AND organization_id = org_id;
    END IF;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Atualizar função check_review_rate_limit
CREATE OR REPLACE FUNCTION public.check_review_rate_limit(client_email text, org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  email_hash_value text;
  current_count integer := 0;
BEGIN
  -- Criar hash do email para privacidade
  email_hash_value := encode(sha256(lower(trim(client_email))::bytea), 'hex');
  
  -- Limpar registros antigos (mais de 1 semana)
  DELETE FROM review_rate_limit 
  WHERE last_review < (now() - INTERVAL '7 days');
  
  -- Verificar se já existe review desta semana
  SELECT review_count INTO current_count
  FROM review_rate_limit
  WHERE email_hash = email_hash_value 
    AND organization_id = org_id
    AND last_review > (now() - INTERVAL '7 days');
  
  -- Se não existe registro, permitir
  IF current_count IS NULL THEN
    INSERT INTO review_rate_limit (email_hash, organization_id, review_count, last_review)
    VALUES (email_hash_value, org_id, 1, now());
    RETURN true;
  ELSE
    -- Já existe review nesta semana, bloquear
    RETURN false;
  END IF;
END;
$function$;

-- Atualizar função create_review_with_validation
CREATE OR REPLACE FUNCTION public.create_review_with_validation(
  org_id uuid,
  client_email text,
  service_id_param uuid,
  member_id_param uuid,
  rating_param integer,
  comment_param text DEFAULT NULL
)
 RETURNS TABLE(review_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  client_id_found uuid;
  new_review_id uuid;
  rate_limit_ok boolean;
BEGIN
  -- Validar email format básico
  IF client_email IS NULL OR client_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Email inválido'::text;
    RETURN;
  END IF;
  
  -- Validar rating
  IF rating_param < 1 OR rating_param > 5 THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Avaliação deve ser entre 1 e 5 estrelas'::text;
    RETURN;
  END IF;
  
  -- Verificar rate limit
  SELECT check_review_rate_limit(client_email, org_id) INTO rate_limit_ok;
  IF NOT rate_limit_ok THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Apenas uma avaliação por semana é permitida'::text;
    RETURN;
  END IF;
  
  -- Buscar ou criar cliente
  SELECT id INTO client_id_found
  FROM clients c
  WHERE c.organization_id = org_id AND c.email = client_email;
  
  IF client_id_found IS NULL THEN
    -- Criar cliente se não existir
    INSERT INTO clients (organization_id, name, email)
    VALUES (org_id, split_part(client_email, '@', 1), client_email)
    RETURNING id INTO client_id_found;
  END IF;
  
  -- Criar review
  INSERT INTO reviews (organization_id, client_id, service_id, member_id, rating, comment)
  VALUES (org_id, client_id_found, service_id_param, member_id_param, rating_param, comment_param)
  RETURNING id INTO new_review_id;
  
  -- Criar entrada de moderação
  INSERT INTO review_moderation (review_id, status)
  VALUES (new_review_id, 'pending');
  
  RETURN QUERY SELECT new_review_id, true, 'Avaliação criada com sucesso. Aguardando moderação.'::text;
END;
$function$;