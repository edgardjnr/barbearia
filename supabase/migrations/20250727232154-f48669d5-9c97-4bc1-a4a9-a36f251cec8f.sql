-- Fix security issue: Add search_path to function
CREATE OR REPLACE FUNCTION public.get_current_date()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT CURRENT_DATE::text;
$function$;