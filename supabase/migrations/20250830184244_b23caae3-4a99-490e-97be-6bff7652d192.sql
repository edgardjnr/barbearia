-- Criar função RPC para buscar agendamentos públicos (apenas horários ocupados)
CREATE OR REPLACE FUNCTION public.get_public_appointments(
  org_id uuid, 
  target_date date,
  member_id_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  scheduled_time time without time zone,
  duration_minutes integer,
  member_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.scheduled_time,
    COALESCE(s.duration_minutes, a.duration_minutes) as duration_minutes,
    a.member_id
  FROM appointments a
  LEFT JOIN services s ON a.service_id = s.id
  WHERE a.organization_id = org_id
    AND a.scheduled_date = target_date
    AND a.status IN ('confirmed', 'pending')
    AND (member_id_filter IS NULL OR a.member_id = member_id_filter);
END;
$$;