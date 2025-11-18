-- Function to get current date in YYYY-MM-DD format
CREATE OR REPLACE FUNCTION public.get_current_date()
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT CURRENT_DATE::text;
$function$;